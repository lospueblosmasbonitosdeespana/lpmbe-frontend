'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RutaAdminStatsCells from './RutaAdminStatsCells';
import RutaMiniMap from '@/app/_components/RutaMiniMap';
import { GestionAsociacionSubpageShell } from '../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconMap } from '../_components/asociacion-hero-icons';

type PuebloEnRuta = {
  orden: number;
  pueblo: { id: number; nombre: string; slug: string; provincia?: string };
};

type RutaRow = {
  id: number;
  titulo: string;
  slug: string;
  activo: boolean;
  programa?: string | null;
  _count?: { paradas: number };
  paradasCount?: number;
  pueblos?: PuebloEnRuta[];
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

  const nuevaRutaBtn = (
    <Link
      href="/gestion/asociacion/rutas/nueva"
      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white/15 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm transition-all hover:bg-white/25 hover:ring-white/40 active:scale-[0.98]"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
      Nueva ruta
    </Link>
  );

  if (loading) {
    return (
      <GestionAsociacionSubpageShell
        title="Rutas"
        subtitle="Multiexperiencias y rutas turísticas · Asociación LPMBE"
        heroIcon={<AsociacionHeroIconMap />}
        maxWidthClass="max-w-[1600px]"
        heroAction={nuevaRutaBtn}
      >
        <p className="text-sm text-muted-foreground">Cargando rutas…</p>
      </GestionAsociacionSubpageShell>
    );
  }

  return (
    <GestionAsociacionSubpageShell
      title="Rutas"
      subtitle="Multiexperiencias y rutas turísticas · Asociación LPMBE"
      heroIcon={<AsociacionHeroIconMap />}
      maxWidthClass="max-w-[1600px]"
      heroAction={nuevaRutaBtn}
      heroBadges={
        <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
          <span className="text-lg font-bold">{rutas.length}</span>
          <span className="ml-1.5 text-xs text-white/70">{rutas.length === 1 ? 'ruta' : 'rutas'}</span>
        </div>
      }
    >
      {error && (
        <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {rutas.length === 0 ? (
        <div className="mt-6 rounded-md border p-4 text-sm text-muted-foreground">
          No hay rutas todavía.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto min-w-0">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-2 text-left font-medium">Título</th>
                <th className="px-4 py-2 text-left font-medium">Pueblos</th>
                <th className="px-4 py-2 text-left font-medium">Slug</th>
                <th className="px-4 py-2 text-left font-medium">Programa</th>
                <th className="px-4 py-2 text-center font-medium">Paradas</th>
                <th className="px-4 py-2 text-center font-medium">Km</th>
                <th className="px-4 py-2 text-center font-medium">Tiempo</th>
                <th className="px-4 py-2 text-center font-medium">Activo</th>
                <th className="sticky right-0 bg-muted/30 px-4 py-2 text-center font-medium shadow-[-4px_0_8px_rgba(0,0,0,0.06)]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rutas.map((r) => {
                const pueblosList = (r as RutaRow).pueblos ?? [];
                return (
                  <tr key={r.id} className="group border-b hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <RutaMiniMap rutaId={r.id} width={180} height={110} />
                        <span className="font-medium">{r.titulo}</span>
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      {pueblosList.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <ul className="flex flex-wrap gap-x-2 gap-y-0.5">
                          {pueblosList
                            .sort((a, b) => a.orden - b.orden)
                            .map((rp, idx) => (
                              <li key={rp.pueblo.id} className="inline">
                                <Link
                                  href={`/pueblos/${rp.pueblo.slug}`}
                                  className="text-blue-600 hover:underline"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {rp.pueblo.nombre}
                                </Link>
                                {idx < pueblosList.length - 1 && (
                                  <span className="text-gray-300"> · </span>
                                )}
                              </li>
                            ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.slug}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.programa || '—'}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {(r as any).paradasCount ??
                       (r as any)._count?.pueblos ??
                       pueblosList.length}
                    </td>
                    <RutaAdminStatsCells rutaId={r.id} />
                    <td className="px-4 py-3 text-center">
                      {r.activo ? (
                        <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                          Sí
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                          No
                        </span>
                      )}
                    </td>
                    <td className="sticky right-0 bg-white px-4 py-3 text-center shadow-[-4px_0_8px_rgba(0,0,0,0.06)] group-hover:bg-muted/30">
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </GestionAsociacionSubpageShell>
  );
}
