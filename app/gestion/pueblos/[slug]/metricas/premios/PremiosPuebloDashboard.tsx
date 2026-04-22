'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Lock } from 'lucide-react';
import {
  PREMIOS_UI,
  formatValor,
  TrendBadge,
  type Tendencia,
} from '../../../../_lib/premiosUI';

type VentanaDias = 3 | 7 | 15 | 30 | 90 | 180;

const VENTANAS: Array<{ value: VentanaDias; label: string }> = [
  { value: 3, label: '3 días' },
  { value: 7, label: '7 días' },
  { value: 15, label: '15 días' },
  { value: 30, label: '30 días' },
  { value: 90, label: '3 meses' },
  { value: 180, label: '6 meses' },
];

interface Edicion {
  id: number;
  anio: number;
  etiqueta: string;
  inicio: string;
  fin: string;
  cerrada: boolean;
}

interface Vecino {
  puebloId: number;
  puebloNombre: string | null;
  puebloSlug: string | null;
  posicion: number;
  posicionAnterior: number | null;
  tendencia: Tendencia;
  valor: number;
}

interface Posicion {
  premioId: number;
  posicion: number | null;
  posicionAnterior?: number | null;
  tendencia?: Tendencia;
  total: number;
  valor: number | null;
  razon?: 'pendiente' | 'sin_datos' | 'no_ranked';
  vecinos?: Vecino[];
  metadata?: {
    n?: number;
    mediaBruta?: number;
    mediaGlobal?: number;
    wilsonLB?: number;
    nMin?: number;
    [key: string]: unknown;
  };
}

interface ResumenResponse {
  edicion: Edicion;
  totalPueblos: number;
  posiciones: Posicion[];
}

interface HistoricoItem {
  edicion: Edicion;
  posiciones: Array<{
    premioId: number;
    posicion: number | null;
    valor: number | null;
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

export default function PremiosPuebloDashboard({
  puebloId,
  puebloNombre,
  puebloSlug,
}: {
  puebloId: number;
  puebloNombre: string;
  puebloSlug: string;
}) {
  const [resumen, setResumen] = useState<ResumenResponse | null>(null);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [resResumen, resHist] = await Promise.all([
          fetch(`/api/admin/pueblos/${puebloId}/premios`, { cache: 'no-store' }),
          fetch(`/api/admin/pueblos/${puebloId}/premios/historico`, { cache: 'no-store' }),
        ]);
        if (!resResumen.ok) throw new Error(await resResumen.text());
        setResumen(await resResumen.json());
        if (resHist.ok) setHistorico(await resHist.json());
      } catch (e: any) {
        setError(e?.message || 'Error cargando datos');
      } finally {
        setLoading(false);
      }
    })();
  }, [puebloId]);

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Calculando tus posiciones…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-800">
        {error}
      </div>
    );
  }
  if (!resumen) return null;

  const totalPremios = resumen.posiciones.length;
  const enRanking = resumen.posiciones.filter((p) => p.posicion != null).length;
  const top10 = resumen.posiciones.filter((p) => p.posicion != null && p.posicion <= 10).length;

  return (
    <div className="space-y-8">
      {/* Resumen (tarjeta clara, el hero marrón lo pone el shell) */}
      <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/50 to-white p-5 shadow-md shadow-amber-100/30 dark:border-amber-900/50 dark:from-amber-950/30 dark:to-card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-amber-200/70">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Edición
            </span>
            <span className="text-sm font-bold text-foreground">
              {resumen.edicion.etiqueta}
              <span className="ml-1 font-normal text-muted-foreground">
                · {resumen.edicion.cerrada ? 'cerrada' : 'en curso'}
              </span>
            </span>
          </div>
          <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-amber-200/70">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Periodo anual
            </span>
            <span className="text-sm font-semibold text-foreground">
              {formatFecha(resumen.edicion.inicio)} → {formatFecha(resumen.edicion.fin)}
            </span>
          </div>
          <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-amber-200/70">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Compiten
            </span>
            <span className="text-sm font-bold text-foreground">
              {resumen.totalPueblos} pueblos
            </span>
          </div>
          <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-amber-200/70">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-700">
              En ranking
            </span>
            <span className="text-sm font-bold tabular-nums text-foreground">
              {enRanking}
              <span className="ml-1 font-normal text-muted-foreground">/ {totalPremios}</span>
            </span>
          </div>
          <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-amber-200/70">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Top 10
            </span>
            <span className="text-sm font-bold tabular-nums text-foreground">{top10}</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Cada tarjeta muestra <strong className="text-foreground/80">tu posición</strong> en ese
          premio durante el periodo anual. Pulsa{' '}
          <strong className="text-foreground/80">3d · 7d · 15d · 30d · 3m · 6m</strong> para ver tu
          posición en una ventana móvil reciente; pulsa{' '}
          <strong className="text-foreground/80">Anual</strong> para volver al periodo completo de
          la edición.
        </p>
      </div>

      {/* Grid de los 10 premios */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {resumen.posiciones.map((p) => (
          <TarjetaPremio
            key={p.premioId}
            puebloId={puebloId}
            puebloNombre={puebloNombre}
            puebloSlug={puebloSlug}
            edicionId={resumen.edicion.id}
            posicion={p}
          />
        ))}
      </div>

      {/* Histórico */}
      {historico.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
          <button
            type="button"
            onClick={() => setMostrarHistorico((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <div>
              <h3 className="text-base font-bold text-foreground">Ediciones anteriores</h3>
              <p className="text-xs text-muted-foreground">
                Posiciones finales en ediciones ya cerradas · {historico.length} ediciones
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {mostrarHistorico ? 'Ocultar' : 'Ver'}
            </span>
          </button>

          {mostrarHistorico && (
            <div className="mt-4 space-y-4">
              {historico.map((h) => (
                <div
                  key={h.edicion.id}
                  className="rounded-xl border border-border bg-muted/20 p-4"
                >
                  <div className="mb-2 text-sm font-bold">{h.edicion.etiqueta}</div>
                  <div className="grid gap-1.5 text-xs sm:grid-cols-2 lg:grid-cols-3">
                    {h.posiciones.map((it) => {
                      const ui = PREMIOS_UI[it.premioId];
                      const Icon = ui?.Icon;
                      return (
                        <div
                          key={it.premioId}
                          className="flex items-center justify-between gap-2 rounded-lg bg-background px-2 py-1.5 ring-1 ring-black/5"
                        >
                          <span className="flex min-w-0 items-center gap-1.5 truncate">
                            {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                            <span className="truncate">{ui?.titulo ?? `Premio ${it.premioId}`}</span>
                          </span>
                          <span className="shrink-0 font-semibold tabular-nums text-foreground">
                            {it.posicion == null ? '—' : `${it.posicion}ª`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TarjetaPremio({
  puebloId,
  puebloNombre,
  puebloSlug,
  edicionId,
  posicion,
}: {
  puebloId: number;
  puebloNombre: string;
  puebloSlug: string;
  edicionId: number;
  posicion: Posicion;
}) {
  const ui = PREMIOS_UI[posicion.premioId];
  const Icon = ui?.Icon;
  const [ventana, setVentana] = useState<number | null>(null);
  const [ventanaData, setVentanaData] = useState<Posicion | null>(null);
  const [loading, setLoading] = useState(false);

  const volverAnual = () => {
    setVentana(null);
    setVentanaData(null);
  };

  const consultarVentana = async (days: VentanaDias) => {
    if (ventana === days) {
      volverAnual();
      return;
    }
    setVentana(days);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/pueblos/${puebloId}/premios/${posicion.premioId}?days=${days}`,
        { cache: 'no-store' },
      );
      if (res.ok) {
        setVentanaData(await res.json());
      } else {
        setVentanaData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const pendiente = posicion.razon === 'pendiente';
  const datosActivos = ventanaData && ventana != null ? ventanaData : posicion;
  const pos = datosActivos.posicion;
  const ventanaLabel =
    ventana != null ? (VENTANAS.find((v) => v.value === ventana)?.label ?? `${ventana}d`) : null;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border ${ui.tint.border} ${ui.tint.bg} p-5 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md ${ui.tint.iconBg}`}
          >
            {Icon && <Icon className="h-5 w-5 text-white" strokeWidth={2} />}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Premio {String(posicion.premioId).padStart(2, '0')}
            </span>
            <h3 className="text-base font-bold leading-tight text-foreground">{ui.titulo}</h3>
          </div>
        </div>
        {pendiente && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
            <Lock className="h-3 w-3" />
            Próximamente
          </span>
        )}
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{ui.descripcion}</p>

      {posicion.premioId === 6 && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-[11px] leading-relaxed text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          <strong className="font-bold">Este premio NO se otorga en la edición 2025/2026.</strong>{' '}
          La app se lanzó en 2025, así que aún no existe un año anterior con el que comparar el
          crecimiento. Los datos mostrados son orientativos (comparan con un periodo sin actividad real)
          y se concederá oficialmente por primera vez en la edición 2026/2027.
        </div>
      )}

      {pendiente ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
          Este premio estará disponible en breve.
        </p>
      ) : (
        <>
          <div className="mt-4 rounded-xl bg-white/70 p-3 ring-1 ring-black/5 dark:bg-zinc-900/40 dark:ring-white/5">
            <div className="flex items-baseline gap-2">
              {loading ? (
                <span className="text-sm text-muted-foreground">Calculando…</span>
              ) : pos == null ? (
                <span className="text-sm text-muted-foreground">Sin datos todavía</span>
              ) : (
                <>
                  <span
                    className={`text-4xl font-black tabular-nums leading-none ${
                      pos === 1
                        ? 'text-amber-600'
                        : pos <= 3
                          ? 'text-amber-700'
                          : pos <= 10
                            ? 'text-foreground'
                            : 'text-foreground/70'
                    }`}
                  >
                    {pos}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    ª de {datosActivos.total}
                  </span>
                  <span className="ml-auto">
                    <TrendBadge
                      t={(datosActivos as Posicion).tendencia}
                      prev={(datosActivos as Posicion).posicionAnterior}
                      labelRef={ventana != null ? 'ventana anterior' : 'hace 7 días'}
                    />
                  </span>
                </>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span>
                Valor:{' '}
                <span className="font-semibold text-foreground">
                  {formatValor(posicion.premioId, datosActivos.valor)}
                </span>
              </span>
              {ventana != null ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${ui.tint.pill}`}
                >
                  Últimos {ventanaLabel}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground/70">· periodo anual</span>
              )}
            </div>

            {/* P1 · Mejor Valorado: detalle de la media real + confianza
                Wilson LB 95%. Se muestra siempre que el backend envía
                metadata (n, mediaBruta, mediaGlobal, wilsonLB, nMin). */}
            {posicion.premioId === 1 &&
              datosActivos.metadata &&
              typeof datosActivos.metadata.n === 'number' && (
                <MejorValoradoDetalle meta={datosActivos.metadata} />
              )}
          </div>

          {/* Vecinos: 2 arriba y 2 abajo del pueblo. Disponible en cualquier
              ventana (anual y móviles) — el backend devuelve `vecinos` también
              para 3/7/15/30/90/180d. */}
          {datosActivos.vecinos && datosActivos.vecinos.length > 0 && pos != null && (
            <div className="mt-3 overflow-hidden rounded-xl border border-black/5 bg-white/60 dark:border-white/5 dark:bg-zinc-900/40">
              {(() => {
                const arriba = (datosActivos.vecinos ?? []).filter((v) => v.posicion < pos);
                const abajo = (datosActivos.vecinos ?? []).filter((v) => v.posicion > pos);
                const filas: Array<{
                  key: string;
                  posicion: number;
                  nombre: string;
                  tendencia: Tendencia;
                  prev: number | null;
                  valor: number | null;
                  yo: boolean;
                }> = [
                  ...arriba.map((v) => ({
                    key: `u-${v.puebloId}`,
                    posicion: v.posicion,
                    nombre: v.puebloNombre ?? '—',
                    tendencia: v.tendencia,
                    prev: v.posicionAnterior,
                    valor: v.valor,
                    yo: false,
                  })),
                  {
                    key: 'yo',
                    posicion: pos,
                    nombre: puebloNombre,
                    tendencia: datosActivos.tendencia,
                    prev: datosActivos.posicionAnterior ?? null,
                    valor: datosActivos.valor,
                    yo: true,
                  },
                  ...abajo.map((v) => ({
                    key: `d-${v.puebloId}`,
                    posicion: v.posicion,
                    nombre: v.puebloNombre ?? '—',
                    tendencia: v.tendencia,
                    prev: v.posicionAnterior,
                    valor: v.valor,
                    yo: false,
                  })),
                ];
                return filas.map((f) => (
                  <div
                    key={f.key}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs ${
                      f.yo
                        ? `${ui.tint.pill} font-bold`
                        : 'text-foreground/80 hover:bg-black/[0.02]'
                    } ${f.key.startsWith('d-') || f.yo ? 'border-t border-black/5 dark:border-white/5' : ''}`}
                  >
                    <span className="w-8 shrink-0 text-right font-bold tabular-nums">
                      {f.posicion}ª
                    </span>
                    <span className="flex-1 truncate">
                      {f.nombre}
                      {f.yo && <span className="ml-1 text-[10px] font-bold uppercase opacity-70">· tú</span>}
                    </span>
                    <span className="shrink-0">
                      <TrendBadge
                        t={f.tendencia}
                        prev={f.prev}
                        compact
                        labelRef={ventana != null ? 'ventana anterior' : 'hace 7 días'}
                      />
                    </span>
                    <span className="w-16 shrink-0 text-right font-semibold tabular-nums">
                      {formatValor(posicion.premioId, f.valor)}
                    </span>
                  </div>
                ));
              })()}
            </div>
          )}

          {/* Controles de ventana: "Anual" a la izquierda para volver al
              periodo completo (importante en ediciones inaugurales donde las
              ventanas móviles aún están vacías). */}
          <div className="mt-3 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={volverAnual}
              disabled={loading}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                ventana == null
                  ? `border-transparent text-white shadow-sm ${ui.tint.iconBg}`
                  : 'border-border bg-white/60 text-foreground hover:bg-white dark:bg-zinc-900/40 dark:hover:bg-zinc-800'
              }`}
            >
              Anual
            </button>
            {VENTANAS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => consultarVentana(value)}
                disabled={loading}
                className={`min-w-[44px] flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                  ventana === value
                    ? `border-transparent text-white shadow-sm ${ui.tint.iconBg}`
                    : 'border-border bg-white/60 text-foreground hover:bg-white dark:bg-zinc-900/40 dark:hover:bg-zinc-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* P7 · botón al baremo para que el alcalde vea cómo se puntúa. */}
          {posicion.premioId === 7 && (
            <Link
              href={`/gestion/asociacion/datos/premios/7/baremo?edicionId=${edicionId}&from=${encodeURIComponent(
                `/gestion/pueblos/${puebloSlug}/metricas/premios`,
              )}`}
              className={`mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors ${ui.tint.iconBg} hover:opacity-90`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Ver baremo de puntos
            </Link>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Detalle del P1 (Mejor Valorado): muestra la media REAL del pueblo como
 * cifra principal (★ 4.9 · 87 valoraciones). El orden del ranking se
 * calcula con Wilson lower bound al 95%: a más valoraciones consistentes,
 * más arriba se queda el pueblo. Así una media "perfecta" con pocos votos
 * no supera a una media alta con muchos votos.
 */
function MejorValoradoDetalle({
  meta,
}: {
  meta: {
    n?: number;
    mediaBruta?: number;
    mediaGlobal?: number;
    wilsonLB?: number;
    nMin?: number;
    [key: string]: unknown;
  };
}) {
  const n = meta.n ?? 0;
  const media = meta.mediaBruta ?? 0;
  const global = meta.mediaGlobal ?? 0;
  const wilsonLB = meta.wilsonLB ?? 0;
  const nMin = meta.nMin ?? 3;
  const wilsonPct = Math.round(wilsonLB * 1000) / 10;

  if (n === 0) {
    return (
      <div className="mt-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/50 p-2.5 text-[11px] leading-relaxed text-amber-900">
        <span className="font-semibold">Aún sin valoraciones en el periodo.</span>{' '}
        La media de la red es <strong>{global.toFixed(2)} ★</strong>. En cuanto los
        visitantes empiecen a valorarte aparecerás en el ranking.
      </div>
    );
  }
  if (n < nMin) {
    const faltan = nMin - n;
    return (
      <div className="mt-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/50 p-2.5 text-[11px] leading-relaxed text-amber-900">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
            Tu media real
          </span>
          <span className="text-lg font-black tabular-nums text-amber-800">
            {media.toFixed(2)} ★
          </span>
          <span className="text-[11px] font-medium text-amber-800/90">
            sobre {n} valoración{n === 1 ? '' : 'es'}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-amber-900/85">
          Necesitas al menos <strong>{nMin} valoraciones</strong> para entrar
          en el ranking ({faltan === 1 ? 'falta 1' : `faltan ${faltan}`}). La
          media de la red es <strong>{global.toFixed(2)} ★</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-lg bg-amber-50/70 p-2.5 text-[11px] leading-relaxed text-amber-900 ring-1 ring-amber-200/70">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
          Tu media real
        </span>
        <span className="text-lg font-black tabular-nums text-amber-800">
          {media.toFixed(2)} ★
        </span>
        <span className="text-[11px] font-medium text-amber-800/90">
          sobre {n} valoración{n === 1 ? '' : 'es'}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-amber-900/85">
        El ranking usa un <strong>límite inferior de confianza al 95%</strong>{' '}
        (Wilson) para que una media perfecta con pocos votos no gane a una
        media alta con muchos votos. Tu confianza inferior es{' '}
        <strong>{wilsonPct.toFixed(1)}%</strong>. Media de la red:{' '}
        <strong>{global.toFixed(2)} ★</strong>. A más valoraciones, tu
        confianza inferior se acerca a tu media real.
      </p>
    </div>
  );
}
