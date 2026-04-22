'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import {
  PREMIOS_UI,
  HERO_GRADIENT,
  formatValor,
  type Tendencia,
} from '../../../../_lib/premiosUI';

interface Edicion {
  id: number;
  anio: number;
  etiqueta: string;
  inicio: string;
  fin: string;
  cerrada: boolean;
}

interface Entry {
  puebloId: number;
  puebloNombre: string | null;
  puebloSlug: string | null;
  provincia: string | null;
  posicion: number;
  posicionAnterior?: number | null;
  tendencia?: Tendencia;
  valor: number;
  metadata: Record<string, unknown> | null;
}

interface PremioMeta {
  id: number;
  clave: string;
  titulo: string;
  descripcion: string;
  unidad: string;
  implementado: boolean;
  razonPendiente?: string;
}

interface RankingResponse {
  edicion: Edicion;
  premio: PremioMeta;
  ventana?: number | null;
  totalPueblos: number;
  participantes: number;
  ranking: Entry[];
}

type VentanaDias = 3 | 7 | 15 | 30 | 90 | 180;

const VENTANAS_ADMIN: Array<{ value: VentanaDias; label: string }> = [
  { value: 3, label: '3d' },
  { value: 7, label: '7d' },
  { value: 15, label: '15d' },
  { value: 30, label: '30d' },
  { value: 90, label: '3m' },
  { value: 180, label: '6m' },
];

interface PuebloMin {
  id: number;
  nombre: string;
  slug: string;
}

function TrendCell({
  t,
  prev,
  labelRef,
}: {
  t?: Tendencia;
  prev?: number | null;
  /** Texto que acompaña al "Antes" en el tooltip (p.ej. "hace 7 días" o "ventana anterior"). */
  labelRef?: string;
}) {
  if (!t) return <span className="text-muted-foreground">—</span>;
  const ref = labelRef ?? 'antes';
  if (t === 'up')
    return (
      <span
        className="inline-flex items-center gap-1 font-semibold text-emerald-600"
        title={prev ? `${ref}: #${prev}` : undefined}
      >
        <TrendingUp className="h-4 w-4" />
        <span className="text-xs tabular-nums">{prev ? `${prev}→` : ''}</span>
      </span>
    );
  if (t === 'down')
    return (
      <span
        className="inline-flex items-center gap-1 font-semibold text-rose-600"
        title={prev ? `${ref}: #${prev}` : undefined}
      >
        <TrendingDown className="h-4 w-4" />
        <span className="text-xs tabular-nums">{prev ? `${prev}→` : ''}</span>
      </span>
    );
  if (t === 'same')
    return (
      <span
        className="inline-flex items-center text-muted-foreground"
        title={prev ? `${ref}: #${prev} (sin cambios)` : undefined}
      >
        <Minus className="h-4 w-4" />
      </span>
    );
  return (
    <span
      className="inline-flex items-center gap-1 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800 ring-1 ring-sky-200"
      title={`No estaba en el ranking ${ref}`}
    >
      <Sparkles className="h-3 w-3" />
      NUEVO
    </span>
  );
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

export default function PremioDetalleClient({
  premioId,
  edicionIdInicial,
}: {
  premioId: number;
  edicionIdInicial?: number;
}) {
  const [ediciones, setEdiciones] = useState<Edicion[]>([]);
  const [edicionId, setEdicionId] = useState<number | null>(edicionIdInicial ?? null);
  const [ventana, setVentana] = useState<VentanaDias | null>(null);
  const [data, setData] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/premios/ediciones', { cache: 'no-store' });
      if (res.ok) {
        const list: Edicion[] = await res.json();
        setEdiciones(list);
        if (edicionId == null) {
          const actual = list.find((e) => !e.cerrada) ?? list[0];
          if (actual) setEdicionId(actual.id);
        }
      }
    })();
  }, [edicionId]);

  useEffect(() => {
    if (edicionId == null) return;
    setLoading(true);
    setError(null);
    const url =
      ventana != null
        ? `/api/admin/premios/${edicionId}/${premioId}?days=${ventana}`
        : `/api/admin/premios/${edicionId}/${premioId}`;
    fetch(url, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((d: RankingResponse) => setData(d))
      .catch((e) => setError(e?.message || 'Error'))
      .finally(() => setLoading(false));
  }, [edicionId, premioId, ventana]);

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['posicion', 'puebloId', 'pueblo', 'provincia', 'valor', 'tendencia', 'posicionAnterior'],
      ...data.ranking.map((r) => [
        r.posicion,
        r.puebloId,
        r.puebloNombre ?? '',
        r.provincia ?? '',
        r.valor,
        r.tendencia ?? '',
        r.posicionAnterior ?? '',
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((v) => {
            const s = String(v);
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(','),
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `premio-${premioId}-${data.edicion.etiqueta.replace(/[^\w]/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const ui = PREMIOS_UI[premioId];
  const Icon = ui?.Icon;

  return (
    <div className="space-y-6">
      {/* Hero del premio */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white sm:p-8"
        style={{ background: HERO_GRADIENT }}
      >
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <Link
            href="/gestion/asociacion/datos/premios"
            className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/20"
          >
            <ArrowLeft className="h-3 w-3" />
            Volver a los 10 premios
          </Link>
          <div className="flex items-start gap-4">
            {Icon && (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-inner backdrop-blur-sm">
                <Icon className="h-6 w-6 text-white" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                Premio {String(premioId).padStart(2, '0')}
              </span>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {data?.premio.titulo ?? ui?.titulo}
              </h1>
              <p className="mt-1 max-w-3xl text-sm text-white/85">
                {data?.premio.descripcion ?? ui?.descripcion}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
              <label className="block text-[10px] font-semibold uppercase tracking-wide text-white/60">
                Edición
              </label>
              <select
                value={edicionId ?? ''}
                onChange={(e) => setEdicionId(Number(e.target.value))}
                className="mt-0.5 min-w-[200px] bg-transparent text-sm font-semibold text-white outline-none [&>option]:text-foreground"
              >
                {ediciones.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.etiqueta} {e.cerrada ? '(cerrada)' : '· en curso'}
                  </option>
                ))}
              </select>
            </div>
            {data && (
              <>
                <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/60">
                    Periodo
                  </span>
                  <span className="text-sm font-semibold">
                    {formatFecha(data.edicion.inicio)} → {formatFecha(data.edicion.fin)}
                  </span>
                </div>
                <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/60">
                    Participan
                  </span>
                  <span className="text-lg font-bold tabular-nums">
                    {data.participantes}
                    <span className="ml-1 text-xs font-normal text-white/70">
                      / {data.totalPueblos}
                    </span>
                  </span>
                </div>
                <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/60">
                    Unidad
                  </span>
                  <span className="text-sm font-semibold">{data.premio.unidad}</span>
                </div>
                <div className="rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/15 backdrop-blur-sm">
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/60">
                    Ventana
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setVentana(null)}
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold transition-colors ${
                        ventana == null
                          ? 'bg-white text-foreground shadow-sm'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      Anual
                    </button>
                    {VENTANAS_ADMIN.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setVentana(value)}
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums transition-colors ${
                          ventana === value
                            ? 'bg-white text-foreground shadow-sm'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {premioId === 7 && (
                  <Link
                    href={
                      data.edicion.id
                        ? `/gestion/asociacion/datos/premios/7/baremo?edicionId=${data.edicion.id}`
                        : '/gestion/asociacion/datos/premios/7/baremo'
                    }
                    className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-foreground shadow-sm ring-1 ring-white/40 transition-colors hover:bg-white/90"
                  >
                    <BookOpen className="h-4 w-4" />
                    Ver baremo de puntos
                  </Link>
                )}
                {data.ranking.length > 0 && (
                  <button
                    type="button"
                    onClick={exportCsv}
                    className={`${premioId === 7 ? '' : 'ml-auto'} inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-white/20`}
                  >
                    <Download className="h-4 w-4" />
                    CSV
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Premio 12: formulario de asignación manual */}
      {premioId === 12 && data && !data.edicion.cerrada && (
        <JuradoForm
          edicionId={data.edicion.id}
          actual={data.ranking[0] ?? null}
          onChange={() => {
            if (edicionId != null) setEdicionId(edicionId);
          }}
        />
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Calculando ranking…</div>
      ) : !data ? null : !data.premio.implementado && premioId !== 12 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-900">
          <strong>Premio pendiente de implementación.</strong>
          <p className="mt-2">
            {data.premio.razonPendiente ??
              'Este premio requiere cambios de modelo o una fórmula consensuada antes de poder calcularse.'}
          </p>
        </div>
      ) : data.ranking.length === 0 ? (
        <div className="rounded-2xl border border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          Aún no hay datos suficientes para este premio en la edición seleccionada.
        </div>
      ) : (
        <div
          className={`overflow-hidden rounded-2xl border ${ui?.tint.border ?? 'border-border'} bg-card shadow-md`}
        >
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-3 py-3 text-left">Tendencia</th>
                <th className="px-4 py-3 text-left">Pueblo</th>
                <th className="px-4 py-3 text-left">Provincia</th>
                <th className="px-4 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {data.ranking.map((r) => (
                <tr
                  key={r.puebloId}
                  className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-2.5 tabular-nums">
                    <span
                      className={`inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-1.5 text-xs font-bold ring-1 ${
                        r.posicion === 1
                          ? 'bg-amber-400 text-amber-950 ring-amber-600/30'
                          : r.posicion === 2
                            ? 'bg-zinc-300 text-zinc-800 ring-zinc-400/40'
                            : r.posicion === 3
                              ? 'bg-amber-700/70 text-amber-50 ring-amber-900/40'
                              : 'bg-muted text-muted-foreground ring-border'
                      }`}
                    >
                      {r.posicion}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <TrendCell
                      t={r.tendencia}
                      prev={r.posicionAnterior}
                      labelRef={ventana != null ? `ventana anterior` : `hace 7 días`}
                    />
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-foreground">
                    {r.puebloNombre ?? `#${r.puebloId}`}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.provincia ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {premioId === 1 ? (
                      <MejorValoradoValor valor={r.valor} meta={r.metadata} />
                    ) : (
                      <span className="font-semibold">{formatValor(premioId, r.valor)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {premioId === 1 && (
            <div className="border-t border-border/60 bg-muted/20 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
              <strong className="text-foreground">¿Cómo se lee?</strong> La cifra
              grande es la <em>media real</em> del pueblo (★ sobre <em>n</em> valoraciones).
              El ranking se ordena por el <em>límite inferior de confianza</em>
              (Wilson LB 95%): premia pueblos con muchas valoraciones consistentes
              sobre los que tienen pocas muy altas. Se requiere un mínimo de 3
              valoraciones para concursar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Celda específica del P1 en el ranking admin: media real como cifra
 * principal y confianza Wilson 95% entre paréntesis, con tooltip.
 */
function MejorValoradoValor({
  valor,
  meta,
}: {
  valor: number;
  meta: Record<string, unknown> | null;
}) {
  const n = (meta?.n as number | undefined) ?? 0;
  const mediaBruta = (meta?.mediaBruta as number | undefined) ?? valor;
  const mediaGlobal = (meta?.mediaGlobal as number | undefined) ?? 0;
  const wilsonLB = meta?.wilsonLB as number | undefined;
  const nMin = (meta?.nMin as number | undefined) ?? 3;

  if (n === 0) {
    return (
      <span className="text-xs text-muted-foreground" title="Sin valoraciones en el periodo">
        —
      </span>
    );
  }
  if (n < nMin) {
    return (
      <span
        className="text-xs text-muted-foreground"
        title={`Se necesitan al menos ${nMin} valoraciones para concursar (tiene ${n}).`}
      >
        {mediaBruta.toFixed(2)} ★ · {n}
      </span>
    );
  }

  const wilsonPct =
    typeof wilsonLB === 'number' ? Math.round(wilsonLB * 1000) / 10 : null;
  return (
    <div
      className="flex flex-col items-end leading-tight"
      title={
        `Media real: ${mediaBruta.toFixed(2)} ★ sobre ${n} valoraciones\n` +
        `Media de la red: ${mediaGlobal.toFixed(2)} ★` +
        (wilsonPct != null
          ? `\nConfianza inferior (Wilson 95%): ${wilsonPct.toFixed(1)}%\nEl ranking se ordena por la confianza inferior: a más valoraciones consistentes, mayor confianza.`
          : '')
      }
    >
      <span className="font-bold text-foreground">
        {mediaBruta.toFixed(2)} ★
        <span className="ml-1 text-[10px] font-normal text-muted-foreground">· {n}</span>
      </span>
      {wilsonPct != null && (
        <span className="text-[10px] font-medium text-muted-foreground/80">
          conf. {wilsonPct.toFixed(1)}%
        </span>
      )}
    </div>
  );
}

function JuradoForm({
  edicionId,
  actual,
  onChange,
}: {
  edicionId: number;
  actual: Entry | null;
  onChange: () => void;
}) {
  const [pueblos, setPueblos] = useState<PuebloMin[]>([]);
  const [puebloId, setPuebloId] = useState<number | ''>(actual?.puebloId ?? '');
  const [motivo, setMotivo] = useState<string>(() => {
    const meta = actual?.metadata as { motivo?: string } | null;
    return meta?.motivo ?? '';
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/pueblos', { cache: 'no-store' })
      .then(async (r) => (r.ok ? r.json() : []))
      .then((d: PuebloMin[]) => setPueblos(Array.isArray(d) ? d : []))
      .catch(() => setPueblos([]));
  }, []);

  const guardar = async () => {
    setMsg(null);
    if (!puebloId || !motivo.trim()) {
      setMsg('Selecciona un pueblo y escribe un motivo (mínimo 10 caracteres).');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/premios/${edicionId}/12`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ puebloId: Number(puebloId), motivo }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg('Premio asignado');
      onChange();
    } catch (e: any) {
      setMsg('Error: ' + (e?.message || 'desconocido'));
    } finally {
      setBusy(false);
    }
  };

  const limpiar = async () => {
    if (!confirm('¿Quitar el Premio Especial del Jurado de esta edición?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/premios/${edicionId}/12`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setPuebloId('');
      setMotivo('');
      setMsg('Premio eliminado');
      onChange();
    } catch (e: any) {
      setMsg('Error: ' + (e?.message || 'desconocido'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-b from-violet-50/60 to-white p-5 shadow-md shadow-violet-100/40 dark:border-violet-800/50 dark:from-violet-950/30 dark:to-card">
      <h3 className="text-base font-bold text-foreground">
        Asignación manual · Premio Especial del Jurado
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Decisión discrecional del jurado por iniciativas singulares.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[260px_1fr_auto_auto]">
        <select
          value={puebloId}
          onChange={(e) => setPuebloId(e.target.value === '' ? '' : Number(e.target.value))}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">— Selecciona pueblo —</option>
          {pueblos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo del premio (mínimo 10 caracteres)"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={guardar}
          disabled={busy}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:brightness-110 disabled:opacity-50"
        >
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
        {actual && (
          <button
            type="button"
            onClick={limpiar}
            disabled={busy}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
          >
            Quitar
          </button>
        )}
      </div>
      {msg && <p className="mt-3 text-xs text-muted-foreground">{msg}</p>}
    </div>
  );
}
