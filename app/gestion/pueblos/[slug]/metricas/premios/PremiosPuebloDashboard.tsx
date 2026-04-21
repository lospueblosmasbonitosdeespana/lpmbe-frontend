'use client';

import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import {
  PREMIOS_UI,
  formatValor,
  TrendBadge,
  type Tendencia,
} from '../../../../_lib/premiosUI';

const VENTANAS: Array<{ value: 3 | 7 | 15 | 30; label: string }> = [
  { value: 3, label: '3 días' },
  { value: 7, label: '7 días' },
  { value: 15, label: '15 días' },
  { value: 30, label: '30 días' },
];

interface Edicion {
  id: number;
  anio: number;
  etiqueta: string;
  inicio: string;
  fin: string;
  cerrada: boolean;
}

interface Posicion {
  premioId: number;
  posicion: number | null;
  posicionAnterior?: number | null;
  tendencia?: Tendencia;
  total: number;
  valor: number | null;
  razon?: 'pendiente' | 'sin_datos' | 'no_ranked';
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

export default function PremiosPuebloDashboard({ puebloId }: { puebloId: number }) {
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
          premio durante el periodo anual. Usa los botones{' '}
          <strong className="text-foreground/80">3d · 7d · 15d · 30d</strong> para ver tu posición
          en una ventana móvil reciente (útil para detectar tendencias).
        </p>
      </div>

      {/* Grid de 12 premios */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {resumen.posiciones.map((p) => (
          <TarjetaPremio key={p.premioId} puebloId={puebloId} posicion={p} />
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

function TarjetaPremio({ puebloId, posicion }: { puebloId: number; posicion: Posicion }) {
  const ui = PREMIOS_UI[posicion.premioId];
  const Icon = ui?.Icon;
  const [ventana, setVentana] = useState<number | null>(null);
  const [ventanaData, setVentanaData] = useState<Posicion | null>(null);
  const [loading, setLoading] = useState(false);

  const consultarVentana = async (days: 3 | 7 | 15 | 30) => {
    if (ventana === days) {
      setVentana(null);
      setVentanaData(null);
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
                  Ventana {ventana}d
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground/70">· periodo anual</span>
              )}
            </div>
          </div>

          <div className="mt-3 flex gap-1">
            {VENTANAS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => consultarVentana(value)}
                disabled={loading}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                  ventana === value
                    ? `border-transparent text-white shadow-sm ${ui.tint.iconBg}`
                    : 'border-border bg-white/60 text-foreground hover:bg-white dark:bg-zinc-900/40 dark:hover:bg-zinc-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
