import { redirect } from 'next/navigation';
import Link from 'next/link';

import { getMeServer } from '@/lib/me';
import { getApiUrl } from '@/lib/api';
import { getToken } from '@/lib/auth';

import { AgenteEjecucion, ESTADO_LABEL } from '../_types';

export const dynamic = 'force-dynamic';

interface SearchParams {
  agente?: string;
  estado?: string;
  limit?: string;
  offset?: string;
}

async function fetchHistorial(
  sp: SearchParams,
): Promise<{ items: AgenteEjecucion[]; total: number; limit: number; offset: number }> {
  const token = await getToken();
  if (!token) return { items: [], total: 0, limit: 50, offset: 0 };
  const API_BASE = getApiUrl();
  const qs = new URLSearchParams();
  if (sp.agente) qs.set('agente', sp.agente);
  if (sp.estado) qs.set('estado', sp.estado);
  if (sp.limit) qs.set('limit', sp.limit);
  if (sp.offset) qs.set('offset', sp.offset);
  const url = `${API_BASE}/admin/agentes/historial${qs.toString() ? `?${qs}` : ''}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return { items: [], total: 0, limit: 50, offset: 0 };
  return res.json();
}

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/gestion');

  const sp = await searchParams;
  const { items, total, limit, offset } = await fetchHistorial(sp);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Histórico
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          Ejecuciones de agentes
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cada llamada al modelo, con prompt, respuesta, tokens y coste.
        </p>
      </header>

      <form method="GET" className="mb-5 flex flex-wrap items-end gap-3 rounded-xl bg-slate-50 p-4">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Agente (slug)
          </label>
          <input
            type="text"
            name="agente"
            defaultValue={sp.agente ?? ''}
            placeholder="ej: sabueso-subvenciones"
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Estado
          </label>
          <select
            name="estado"
            defaultValue={sp.estado ?? ''}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(ESTADO_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-700"
        >
          Filtrar
        </button>
      </form>

      <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Inicio</th>
              <th className="px-3 py-2">Agente</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Modelo</th>
              <th className="px-3 py-2 text-right">Tokens (in/out)</th>
              <th className="px-3 py-2 text-right">€</th>
              <th className="px-3 py-2 text-right">Dur (ms)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.map((it) => (
              <tr key={it.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-mono text-[11px] text-slate-500">
                  {it.id}
                </td>
                <td className="px-3 py-2 text-xs">
                  {new Date(it.startedAt).toLocaleString('es-ES')}
                </td>
                <td className="px-3 py-2 font-mono text-[11px]">{it.agenteNombre}</td>
                <td className="px-3 py-2">
                  <EstadoBadge estado={it.estado} />
                </td>
                <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                  {it.modeloIa ?? '—'}
                </td>
                <td className="px-3 py-2 text-right font-mono text-[11px]">
                  {(it.tokensInput ?? 0).toLocaleString('es-ES')} /{' '}
                  {(it.tokensOutput ?? 0).toLocaleString('es-ES')}
                </td>
                <td className="px-3 py-2 text-right font-mono text-[11px]">
                  {it.costeEstimadoEur
                    ? Number(it.costeEstimadoEur).toFixed(4)
                    : '—'}
                </td>
                <td className="px-3 py-2 text-right font-mono text-[11px]">
                  {it.durationMs ?? '—'}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-slate-400">
                  Sin ejecuciones todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Mostrando {items.length} de {total} · offset {offset} · limit {limit}
      </p>

      <div className="mt-10 border-t border-border/60 pt-6 text-sm">
        <Link
          href="/gestion/agentes"
          className="inline-flex items-center gap-1 text-muted-foreground transition hover:text-foreground hover:underline"
        >
          <span aria-hidden>←</span> Volver al centro de control
        </Link>
      </div>
    </main>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const styles: Record<string, string> = {
    OK: 'bg-emerald-100 text-emerald-800',
    APROBADA: 'bg-emerald-100 text-emerald-800',
    EN_CURSO: 'bg-sky-100 text-sky-800',
    PENDIENTE_REVISION: 'bg-amber-100 text-amber-800',
    ERROR: 'bg-rose-100 text-rose-800',
    RECHAZADA: 'bg-slate-100 text-slate-700',
    CANCELADA: 'bg-slate-100 text-slate-700',
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        styles[estado] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {ESTADO_LABEL[estado as keyof typeof ESTADO_LABEL] || estado}
    </span>
  );
}
