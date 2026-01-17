'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type RutaRow = {
  id: number;
  titulo: string;
  slug: string;
  activo: boolean;
  programa?: string | null;
  _count?: { paradas: number };
};

export default function RutasList() {
  const [rutas, setRutas] = useState<RutaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchRutas() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gestion/asociacion/rutas', { cache: 'no-store' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Error ${res.status}`);
      }
      const data = await res.json();
      setRutas(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? 'Error cargando rutas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRutas();
  }, []);

  async function eliminarRuta(id: number) {
    if (!confirm('¿Eliminar esta ruta?')) return;
    
    setError(null);
    try {
      const res = await fetch(`/api/gestion/asociacion/rutas/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Error ${res.status}`);
      }
      await fetchRutas();
    } catch (e: any) {
      setError(e?.message ?? 'Error eliminando');
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <p className="text-sm text-gray-600">Cargando rutas...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Gestión de Rutas</h1>
          <p className="mt-1 text-sm text-gray-600">Asociación · Nacional</p>
        </div>

        <Link
          className="rounded-md border px-3 py-2 text-sm hover:underline"
          href="/gestion/asociacion/rutas/nueva"
        >
          + Nueva ruta
        </Link>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {rutas.length === 0 ? (
        <div className="mt-6 rounded-md border p-4 text-sm text-gray-600">
          No hay rutas todavía.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-2 text-left font-medium">Título</th>
                <th className="px-4 py-2 text-left font-medium">Slug</th>
                <th className="px-4 py-2 text-left font-medium">Programa</th>
                <th className="px-4 py-2 text-center font-medium">Paradas</th>
                <th className="px-4 py-2 text-center font-medium">Km</th>
                <th className="px-4 py-2 text-center font-medium">Tiempo</th>
                <th className="px-4 py-2 text-center font-medium">Activo</th>
                <th className="px-4 py-2 text-center font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rutas.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{r.titulo}</td>
                  <td className="px-4 py-3 text-gray-600">{r.slug}</td>
                  <td className="px-4 py-3 text-gray-600">{r.programa || '—'}</td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {(r as any).paradasCount ??
                     (r as any)._count?.pueblos ??
                     (Array.isArray((r as any).pueblos) ? (r as any).pueblos.length : 0)}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {(r as any).distancia_km ?? (r as any).distanciaKm ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {(r as any).tiempo_estimado ?? (r as any).tiempoEstimado ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.activo ? (
                      <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                        Sí
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/gestion/asociacion/rutas/${r.id}/editar`}
                        className="text-blue-600 hover:underline"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => eliminarRuta(r.id)}
                        className="text-red-600 hover:underline"
                      >
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
