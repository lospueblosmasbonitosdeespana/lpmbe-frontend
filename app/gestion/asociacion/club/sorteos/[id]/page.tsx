'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SorteoForm, type SorteoFormValue } from '../_form';

type SorteoDetalle = {
  id: number;
  slug: string;
  titulo: string;
  descripcion: string;
  premio: string;
  imagenUrl: string | null;
  basesLegales: string;
  organizador: string;
  provinciaFiltro: string | null;
  interesesFiltro: string[];
  edadMinima: number | null;
  tiposSuscripcion: string[];
  validacionesMinimas: number;
  inicioAt: string;
  finAt: string;
  resueltoAt: string | null;
  numGanadores: number;
  estado: 'BORRADOR' | 'PUBLICADO' | 'CERRADO' | 'RESUELTO';
  participantesCount: number;
  ganadoresCount: number;
  ganadores?: Array<{
    id: number;
    posicion: number;
    user: { id: number; email: string; nombre: string | null; apellidos: string | null };
  }>;
};

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditarSorteoPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number((params as any).id);
  const [sorteo, setSorteo] = useState<SorteoDetalle | null>(null);
  const [participantes, setParticipantes] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [resS, resP] = await Promise.all([
        fetch(`/api/club/admin/sorteos/${id}`, { cache: 'no-store' }),
        fetch(`/api/club/admin/sorteos/${id}/participantes`, { cache: 'no-store' }),
      ]);
      if (resS.ok) setSorteo(await resS.json());
      if (resP.ok) setParticipantes(await resP.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleResolver() {
    if (!confirm('¿Resolver el sorteo? Esta acción es irreversible.')) return;
    setResolving(true);
    setError(null);
    try {
      const res = await fetch(`/api/club/admin/sorteos/${id}/resolver`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? 'Error al resolver');
      setSorteo(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setResolving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este sorteo?')) return;
    const res = await fetch(`/api/club/admin/sorteos/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/gestion/asociacion/club/sorteos');
  }

  if (loading) {
    return <main className="mx-auto max-w-4xl px-6 py-12">Cargando…</main>;
  }
  if (!sorteo) {
    return <main className="mx-auto max-w-4xl px-6 py-12">Sorteo no encontrado</main>;
  }

  const formInitial: SorteoFormValue = {
    id: sorteo.id,
    titulo: sorteo.titulo,
    slug: sorteo.slug,
    descripcion: sorteo.descripcion,
    premio: sorteo.premio,
    imagenUrl: sorteo.imagenUrl,
    basesLegales: sorteo.basesLegales,
    organizador: sorteo.organizador,
    provinciaFiltro: sorteo.provinciaFiltro,
    interesesFiltro: sorteo.interesesFiltro ?? [],
    edadMinima: sorteo.edadMinima,
    tiposSuscripcion: sorteo.tiposSuscripcion ?? [],
    validacionesMinimas: sorteo.validacionesMinimas,
    inicioAt: toLocalInput(sorteo.inicioAt),
    finAt: toLocalInput(sorteo.finAt),
    numGanadores: sorteo.numGanadores,
    estado: sorteo.estado,
  };

  const finPasado = new Date(sorteo.finAt) < new Date();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/gestion/asociacion/club/sorteos"
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-gray-900"
      >
        ← Volver a sorteos
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{sorteo.titulo}</h1>
          <p className="mt-1 text-sm text-muted-foreground">/{sorteo.slug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {sorteo.estado === 'PUBLICADO' && finPasado && (
            <button
              onClick={handleResolver}
              disabled={resolving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {resolving ? 'Resolviendo…' : 'Resolver sorteo'}
            </button>
          )}
          {sorteo.estado !== 'RESUELTO' && (
            <button
              onClick={handleDelete}
              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Estado" value={sorteo.estado} />
        <Stat label="Participantes" value={String(sorteo.participantesCount)} />
        <Stat
          label="Ganadores"
          value={`${sorteo.ganadoresCount} / ${sorteo.numGanadores}`}
        />
      </div>

      {sorteo.estado === 'RESUELTO' && (sorteo.ganadores?.length ?? 0) > 0 && (
        <section className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="mb-3 text-lg font-semibold text-blue-900">🎉 Ganadores</h2>
          <ol className="space-y-2">
            {sorteo.ganadores!.map((g) => (
              <li key={g.id} className="flex items-center gap-3">
                <span className="rounded-full bg-blue-200 px-2 py-0.5 text-xs font-bold text-blue-900">
                  #{g.posicion}
                </span>
                <span className="font-medium">
                  {[g.user.nombre, g.user.apellidos].filter(Boolean).join(' ') || g.user.email}
                </span>
                <span className="text-sm text-blue-900/70">{g.user.email}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {sorteo.estado !== 'RESUELTO' ? (
        <SorteoForm mode="edit" initial={formInitial} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Este sorteo ya está resuelto y no puede modificarse.
        </p>
      )}

      {/* Participantes */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Participantes</h2>
        {!participantes || participantes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center text-sm text-muted-foreground">
            Aún no hay inscripciones
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Nº socio</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Socio</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Provincia</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Inscrito</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {participantes.map((p: any) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                      {p.numeroSocio != null ? String(p.numeroSocio).padStart(5, '0') : '—'}
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium">
                        {[p.user.nombre, p.user.apellidos].filter(Boolean).join(' ') || p.user.email}
                      </div>
                      <div className="text-xs text-muted-foreground">{p.user.email}</div>
                    </td>
                    <td className="px-4 py-2">{p.user.provincia ?? '—'}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {new Date(p.inscritoAt).toLocaleString('es-ES')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}
