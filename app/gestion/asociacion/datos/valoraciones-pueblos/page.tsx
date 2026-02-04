'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type PuebloValoracion = {
  puebloId: number;
  nombre: string;
  slug?: string;
  provincia?: string;
  comunidad?: string;
  totalValoraciones: number;
  mediaEstrellas: number;
  distribucion: { 1: number; 2: number; 3: number; 4: number; 5: number };
};

type ValoracionesData = {
  resumen: {
    totalValoraciones: number;
    pueblosConValoracion: number;
    pueblosSinValoracion: number;
    mediaGlobal: number;
  };
  items: PuebloValoracion[];
  topPorMedia: PuebloValoracion[];
  topPorCantidad: PuebloValoracion[];
};

function Estrellas({ media }: { media: number }) {
  const full = Math.floor(media);
  const half = media % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="inline-flex text-amber-400" title={`${media} / 5`}>
      {'★'.repeat(full)}
      {half && '½'}
      {'☆'.repeat(empty)}
    </span>
  );
}

export default function ValoracionesPueblosPage() {
  const [data, setData] = useState<ValoracionesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'todos' | 'top-media' | 'top-cantidad'>('todos');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/admin/datos/valoraciones-pueblos', {
          cache: 'no-store',
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          const err = await res.json().catch(() => ({}));
          setError(err?.message ?? 'Error cargando datos');
        }
      } catch (e) {
        setError('Error cargando datos');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="animate-pulse rounded-lg bg-gray-100 p-8">Cargando valoraciones...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <Link href="/gestion/asociacion/datos" className="text-sm text-blue-600 hover:underline">
          ← Volver a Datos
        </Link>
        <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error ?? 'Error'}</div>
      </main>
    );
  }

  const { resumen, items, topPorMedia, topPorCantidad } = data;

  const displayItems =
    tab === 'top-media'
      ? topPorMedia
      : tab === 'top-cantidad'
        ? topPorCantidad
        : items;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/gestion/asociacion/datos"
          className="mb-4 inline-block text-sm text-gray-600 hover:text-gray-900"
        >
          ← Volver a Datos
        </Link>
        <h1 className="text-3xl font-bold">Valoraciones de pueblos</h1>
        <p className="mt-2 text-gray-600">
          Estrellas con las que los usuarios valoran los pueblos
        </p>
      </div>

      {/* Resumen */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total valoraciones</p>
          <p className="mt-1 text-2xl font-bold">{resumen.totalValoraciones}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Pueblos con valoración</p>
          <p className="mt-1 text-2xl font-bold">{resumen.pueblosConValoracion}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Pueblos sin valoración</p>
          <p className="mt-1 text-2xl font-bold">{resumen.pueblosSinValoracion}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Media global</p>
          <p className="mt-1 text-2xl font-bold">
            <Estrellas media={resumen.mediaGlobal} /> {resumen.mediaGlobal}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab('todos')}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            tab === 'todos'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Todos ({items.length})
        </button>
        <button
          onClick={() => setTab('top-media')}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            tab === 'top-media'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Top por media (≥3 valoraciones)
        </button>
        <button
          onClick={() => setTab('top-cantidad')}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            tab === 'top-cantidad'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Top por cantidad
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Pueblo
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  Valoraciones
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Media
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Distribución (1★–5★)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {displayItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                    No hay valoraciones
                  </td>
                </tr>
              ) : (
                displayItems.map((p, idx) => (
                  <tr key={p.puebloId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {tab !== 'todos' && (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                            {idx + 1}
                          </span>
                        )}
                        <div>
                          <span className="font-medium text-gray-900">{p.nombre}</span>
                          {(p.provincia || p.comunidad) && (
                            <div className="text-sm text-gray-500">
                              {[p.provincia, p.comunidad].filter(Boolean).join(' · ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">
                      {p.totalValoraciones}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <Estrellas media={p.mediaEstrellas} />
                        <span className="text-sm text-gray-600">
                          {p.mediaEstrellas}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 text-xs">
                        {[1, 2, 3, 4, 5].map((r) => (
                          <span
                            key={r}
                            className="rounded bg-gray-100 px-2 py-0.5"
                            title={`${r} estrella${r > 1 ? 's' : ''}`}
                          >
                            {r}★ {p.distribucion[r as 1 | 2 | 3 | 4 | 5]}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {resumen.pueblosSinValoracion > 0 && (
        <p className="mt-4 text-sm text-gray-500">
          {resumen.pueblosSinValoracion} pueblos aún no tienen valoraciones.
        </p>
      )}
    </main>
  );
}
