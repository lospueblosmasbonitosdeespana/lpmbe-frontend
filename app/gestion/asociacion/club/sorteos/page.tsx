'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type SorteoAdmin = {
  id: number;
  slug: string;
  titulo: string;
  premio: string;
  estado: 'BORRADOR' | 'PUBLICADO' | 'CERRADO' | 'RESUELTO';
  inicioAt: string;
  finAt: string;
  participantesCount: number;
  ganadoresCount: number;
  numGanadores: number;
};

const ESTADO_LABEL: Record<SorteoAdmin['estado'], { label: string; className: string }> = {
  BORRADOR: { label: 'Borrador', className: 'bg-gray-100 text-gray-700' },
  PUBLICADO: { label: 'Publicado', className: 'bg-green-100 text-green-800' },
  CERRADO: { label: 'Cerrado', className: 'bg-amber-100 text-amber-800' },
  RESUELTO: { label: 'Resuelto', className: 'bg-blue-100 text-blue-800' },
};

export default function SorteosAdminPage() {
  const [sorteos, setSorteos] = useState<SorteoAdmin[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/club/admin/sorteos', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSorteos(data);
      } else {
        const e = await res.json().catch(() => ({}));
        setError(e?.message ?? 'Error al cargar sorteos');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <Link
            href="/gestion/asociacion/club"
            className="mb-4 inline-block text-sm text-muted-foreground hover:text-gray-900"
          >
            ← Volver al Club
          </Link>
          <h1 className="text-3xl font-bold">Sorteos del Club</h1>
          <p className="mt-2 text-muted-foreground">
            Concursos para socios. Reproducibles, segmentables por provincia, intereses, edad o
            tipo de plan. Las bases legales se publican junto al sorteo.
          </p>
        </div>
        <Link
          href="/gestion/asociacion/club/sorteos/nuevo"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          + Nuevo sorteo
        </Link>
      </div>

      {error && <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</div>}

      {loading ? (
        <div className="animate-pulse rounded-lg bg-muted p-8">Cargando sorteos…</div>
      ) : sorteos && sorteos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white p-12 text-center">
          <p className="text-lg font-medium text-gray-900">Aún no has creado ningún sorteo</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Crea el primero para empezar a fidelizar a los socios del Club.
          </p>
          <Link
            href="/gestion/asociacion/club/sorteos/nuevo"
            className="mt-6 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Crear sorteo
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Sorteo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Fechas
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Participantes
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Ganadores
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sorteos!.map((s) => {
                const meta = ESTADO_LABEL[s.estado];
                return (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{s.titulo}</div>
                      <div className="text-xs text-muted-foreground">{s.premio}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(s.inicioAt).toLocaleDateString('es-ES')} →{' '}
                      {new Date(s.finAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">{s.participantesCount}</td>
                    <td className="px-4 py-3 text-center text-sm">
                      {s.ganadoresCount} / {s.numGanadores}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/gestion/asociacion/club/sorteos/${s.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        Ver / Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
