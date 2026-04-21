'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Trophy, ArrowRight, Lock } from 'lucide-react';
import {
  PREMIOS_UI,
  HERO_GRADIENT,
  formatValor,
  TrendBadge,
  type Tendencia,
} from '../../../_lib/premiosUI';

interface Edicion {
  id: number;
  anio: number;
  etiqueta: string;
  inicio: string;
  fin: string;
  cerrada: boolean;
  fechaAsamblea: string | null;
}

interface TopEntry {
  puebloId: number;
  posicion: number;
  posicionAnterior?: number | null;
  tendencia?: Tendencia;
  valor: number;
  puebloNombre: string | null;
  puebloSlug: string | null;
}

interface Resumen {
  edicion: Edicion;
  totalPueblos: number;
  premios: Array<{
    premioId: number;
    totalPueblos: number;
    participantes: number;
    top: TopEntry[];
    meta: {
      id: number;
      clave: string;
      titulo: string;
      descripcion: string;
      unidad: string;
      implementado: boolean;
      razonPendiente?: string;
    };
  }>;
}

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function PremiosAdminDashboard() {
  const [ediciones, setEdiciones] = useState<Edicion[]>([]);
  const [edicionId, setEdicionId] = useState<number | null>(null);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loadingEd, setLoadingEd] = useState(true);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/premios/ediciones', { cache: 'no-store' });
        if (!res.ok) throw new Error('No se pudieron cargar las ediciones');
        const data: Edicion[] = await res.json();
        setEdiciones(data);
        const actual = data.find((e) => !e.cerrada) ?? data[0];
        setEdicionId(actual?.id ?? null);
      } catch (e: any) {
        setError(e?.message || 'Error');
      } finally {
        setLoadingEd(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (edicionId == null) return;
    setLoadingResumen(true);
    setError(null);
    fetch(`/api/admin/premios/${edicionId}`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data: Resumen) => setResumen(data))
      .catch((e) => setError(e?.message || 'Error cargando resumen'))
      .finally(() => setLoadingResumen(false));
  }, [edicionId]);

  const edicion = resumen?.edicion;
  const totalImplementados = resumen?.premios.filter((p) => p.meta.implementado).length ?? 0;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white sm:p-8"
        style={{ background: HERO_GRADIENT }}
      >
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 shadow-inner backdrop-blur-sm">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                12 Premios · Asamblea Nacional
              </h1>
              <p className="mt-0.5 text-sm text-white/80">
                Ranking de los 126 pueblos en los 12 premios que se entregan cada octubre.
              </p>
            </div>
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-3">
          <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-white/60">
              Edición
            </label>
            <select
              value={edicionId ?? ''}
              onChange={(e) => setEdicionId(Number(e.target.value))}
              disabled={loadingEd || ediciones.length === 0}
              className="mt-1 min-w-[220px] bg-transparent text-sm font-semibold text-white outline-none [&>option]:text-foreground"
            >
              {ediciones.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.etiqueta} {e.cerrada ? '(cerrada)' : '· en curso'}
                </option>
              ))}
            </select>
          </div>
          {edicion && (
            <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/60">
                Periodo
              </span>
              <span className="text-sm font-semibold">
                {formatFecha(edicion.inicio)} → {formatFecha(edicion.fin)}
              </span>
            </div>
          )}
          <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/60">
              Pueblos elegibles
            </span>
            <span className="text-lg font-bold">{resumen?.totalPueblos ?? '—'}</span>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/60">
              Premios activos
            </span>
            <span className="text-lg font-bold">
              {loadingResumen ? '…' : `${totalImplementados} / 12`}
            </span>
          </div>
          {edicion && !edicion.cerrada && edicionId && (
            <CerrarEdicionButton edicionId={edicionId} onDone={() => setEdicionId(edicionId)} />
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Grid de 12 premios */}
      {loadingResumen ? (
        <div className="py-20 text-center text-sm text-muted-foreground">
          Calculando rankings…
        </div>
      ) : resumen ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resumen.premios.map((premio) => {
            const ui = PREMIOS_UI[premio.premioId];
            if (!ui) return null;
            const Icon = ui.Icon;
            return (
              <Link
                key={premio.premioId}
                href={`/gestion/asociacion/datos/premios/${premio.premioId}?edicionId=${resumen.edicion.id}`}
                className={`group overflow-hidden rounded-2xl border ${ui.tint.border} ${ui.tint.bg} p-5 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg`}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md ${ui.tint.iconBg}`}
                    >
                      <Icon className="h-5 w-5 text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Premio {String(premio.premioId).padStart(2, '0')}
                      </span>
                      <h3 className="text-base font-bold leading-tight text-foreground">
                        {ui.titulo}
                      </h3>
                    </div>
                  </div>
                  {!premio.meta.implementado && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
                      <Lock className="h-3 w-3" />
                      Pendiente
                    </span>
                  )}
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  {ui.descripcion}
                </p>

                {premio.meta.implementado ? (
                  <div className="mt-4 space-y-1.5">
                    {premio.top.length === 0 ? (
                      <p className="text-xs italic text-muted-foreground">
                        Aún no hay datos suficientes.
                      </p>
                    ) : (
                      premio.top.map((t, i) => (
                        <div
                          key={t.puebloId}
                          className="flex items-center justify-between gap-2 rounded-xl bg-white/70 px-2.5 py-1.5 ring-1 ring-black/5 dark:bg-zinc-900/40 dark:ring-white/5"
                        >
                          <span className="flex min-w-0 flex-1 items-center gap-2">
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ${
                                i === 0
                                  ? 'bg-amber-400 text-amber-950 ring-1 ring-amber-600/20'
                                  : i === 1
                                    ? 'bg-zinc-300 text-zinc-800 ring-1 ring-zinc-400/40'
                                    : 'bg-amber-700/70 text-amber-50 ring-1 ring-amber-900/40'
                              }`}
                            >
                              {t.posicion}
                            </span>
                            <span className="truncate text-sm font-semibold text-foreground">
                              {t.puebloNombre ?? `#${t.puebloId}`}
                            </span>
                            <TrendBadge t={t.tendencia} prev={t.posicionAnterior} compact />
                          </span>
                          <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                            {formatValor(premio.premioId, t.valor)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                    {premio.meta.razonPendiente ??
                      'Este premio requiere datos externos o una implementación específica.'}
                  </p>
                )}

                <div
                  className={`mt-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${ui.tint.pill} transition-transform group-hover:translate-x-0.5`}
                >
                  Ver ranking completo
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function CerrarEdicionButton({ edicionId, onDone }: { edicionId: number; onDone: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const cerrar = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/premios/${edicionId}/cerrar`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(await res.text());
      onDone();
      setConfirming(false);
    } catch (e: any) {
      alert('Error cerrando edición: ' + (e?.message || 'desconocido'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={cerrar}
      disabled={busy}
      className={`ml-auto rounded-xl px-4 py-2 text-sm font-bold ring-1 backdrop-blur-sm transition-colors disabled:opacity-50 ${
        confirming
          ? 'bg-red-500/90 text-white ring-red-300/60 hover:bg-red-600'
          : 'bg-white/10 text-white ring-white/25 hover:bg-white/20'
      }`}
    >
      {busy ? 'Cerrando…' : confirming ? 'Confirmar cierre anticipado' : 'Cerrar edición ahora'}
    </button>
  );
}
