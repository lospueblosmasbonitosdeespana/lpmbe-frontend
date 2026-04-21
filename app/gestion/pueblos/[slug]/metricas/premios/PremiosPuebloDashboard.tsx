'use client';

import { useEffect, useState } from 'react';

/** Meta visual de los 12 premios (mirror del backend, sólo para UI). */
const PREMIOS_UI: Record<
  number,
  { titulo: string; descripcion: string; unidad: string; emoji: string }
> = {
  1: { titulo: 'Pueblo Mejor Valorado', descripcion: 'Media más alta en reseñas.', unidad: '★', emoji: '★' },
  2: { titulo: 'Más Visitado (GPS)', descripcion: 'Visitas físicas reales registradas por GPS.', unidad: 'visitas', emoji: '📍' },
  3: { titulo: 'Más Visitado en Web/App', descripcion: 'Páginas vistas de tu pueblo en la web y la app.', unidad: 'vistas', emoji: '🌐' },
  4: { titulo: 'Más Activo del Club', descripcion: 'Canjes de QR del Club de Amigos.', unidad: 'canjes', emoji: '🎟️' },
  5: { titulo: 'Más Internacional', descripcion: '% de visitantes extranjeros (datos Telefónica Tech).', unidad: '%', emoji: '🌍' },
  6: { titulo: 'Pueblo Revelación', descripcion: 'Crecimiento relativo respecto al periodo anterior.', unidad: '%', emoji: '🚀' },
  7: { titulo: 'Pueblo Más Trabajador', descripcion: 'Eventos + noticias + páginas temáticas + POIs creados por el pueblo.', unidad: 'publicaciones', emoji: '🎭' },
  8: { titulo: 'Trabajador · Contenidos', descripcion: 'Noticias, artículos, rutas y páginas propias.', unidad: 'contenidos', emoji: '✍️' },
  9: { titulo: 'Ficha Más Completa', descripcion: '% de la ficha del pueblo rellenada: foto, escudo, descripción, historia, fotos, vídeos, webcams, audioguías, POIs, contenidos y recursos.', unidad: 'score / 100', emoji: '🗂️' },
  10: { titulo: 'Mejor Tejido Local', descripcion: 'Negocios y alojamientos adheridos al Club.', unidad: 'negocios', emoji: '🏪' },
  11: { titulo: 'Más Visitado por el Club', descripcion: 'Visitas del Club de Amigos, ponderado por el nº de recursos del pueblo.', unidad: 'visitas/recurso', emoji: '⚡' },
  12: { titulo: 'Especial del Jurado', descripcion: 'Asignación manual por iniciativas singulares.', unidad: '—', emoji: '🏆' },
};

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
  tendencia?: 'up' | 'down' | 'same' | 'new' | null;
  total: number;
  valor: number | null;
  razon?: 'pendiente' | 'sin_datos' | 'no_ranked';
}

function TrendBadge({ t, prev }: { t?: Posicion['tendencia']; prev?: number | null }) {
  if (!t) return null;
  if (t === 'up')
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
        title={prev ? `Periodo anterior: #${prev}` : undefined}
      >
        ▲ {prev ? `desde ${prev}ª` : 'sube'}
      </span>
    );
  if (t === 'down')
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700"
        title={prev ? `Periodo anterior: #${prev}` : undefined}
      >
        ▼ {prev ? `desde ${prev}ª` : 'baja'}
      </span>
    );
  if (t === 'same')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        = se mantiene
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
      NUEVO
    </span>
  );
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

function formatValor(premioId: number, valor: number | null): string {
  if (valor == null) return '—';
  if (premioId === 1) return valor.toFixed(2) + ' ★';
  if (premioId === 6) return (valor >= 0 ? '+' : '') + valor.toFixed(1) + '%';
  if (premioId === 9) return Math.round(valor) + ' / 100';
  if (premioId === 11) return valor.toFixed(2) + ' vis/rec';
  return Math.round(valor).toLocaleString('es-ES');
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
          fetch(`/api/admin/pueblos/${puebloId}/premios/historico`, {
            cache: 'no-store',
          }),
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
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }
  if (!resumen) return null;

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border/70 bg-gradient-to-br from-amber-50 to-background p-5 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-200 text-base">
            🏆
          </span>
          <div>
            <div className="font-semibold text-foreground">
              Edición {resumen.edicion.etiqueta}
              {resumen.edicion.cerrada ? ' · cerrada' : ' · en curso'}
            </div>
            <div className="text-xs text-muted-foreground">
              Periodo anual: {formatFecha(resumen.edicion.inicio)} →{' '}
              {formatFecha(resumen.edicion.fin)} · {resumen.totalPueblos} pueblos
              compiten
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Cada tarjeta muestra <strong>tu posición</strong> en ese premio durante el
          periodo anual. Usa los botones 3d · 7d · 15d · 30d para ver tu posición en
          una <strong>ventana móvil</strong> reciente (útil para detectar tendencias).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resumen.posiciones.map((p) => (
          <TarjetaPremio key={p.premioId} puebloId={puebloId} posicion={p} />
        ))}
      </div>

      {historico.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <button
            type="button"
            onClick={() => setMostrarHistorico((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Ediciones anteriores
              </h3>
              <p className="text-xs text-muted-foreground">
                Posiciones finales en ediciones ya cerradas · {historico.length} ediciones
              </p>
            </div>
            <span className="text-xs font-medium text-primary">
              {mostrarHistorico ? 'Ocultar' : 'Ver'}
            </span>
          </button>

          {mostrarHistorico && (
            <div className="mt-4 space-y-4">
              {historico.map((h) => (
                <div
                  key={h.edicion.id}
                  className="rounded-lg border border-border bg-muted/20 p-4"
                >
                  <div className="mb-2 text-sm font-semibold">
                    {h.edicion.etiqueta}
                  </div>
                  <div className="grid gap-1 text-xs sm:grid-cols-2 lg:grid-cols-3">
                    {h.posiciones.map((it) => {
                      const ui = PREMIOS_UI[it.premioId];
                      return (
                        <div
                          key={it.premioId}
                          className="flex items-center justify-between rounded bg-background px-2 py-1.5"
                        >
                          <span className="truncate">
                            <span aria-hidden>{ui?.emoji}</span>{' '}
                            {ui?.titulo ?? `Premio ${it.premioId}`}
                          </span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
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
  posicion,
}: {
  puebloId: number;
  posicion: Posicion;
}) {
  const ui = PREMIOS_UI[posicion.premioId];
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

  return (
    <div className="flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-lg" aria-hidden>
            {ui?.emoji}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            #{String(posicion.premioId).padStart(2, '0')}
          </span>
        </div>
        {pendiente && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
            Próximamente
          </span>
        )}
      </div>
      <h3 className="text-base font-semibold text-foreground">{ui?.titulo}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{ui?.descripcion}</p>

      {pendiente ? (
        <p className="mt-4 rounded-md bg-amber-50 p-2 text-xs text-amber-900">
          Este premio estará disponible en breve.
        </p>
      ) : (
        <>
          <div className="mt-4 flex items-baseline gap-2">
            {loading ? (
              <span className="text-sm text-muted-foreground">Calculando…</span>
            ) : datosActivos.posicion == null ? (
              <span className="text-sm text-muted-foreground">Sin datos todavía</span>
            ) : (
              <>
                <span className="text-3xl font-bold tabular-nums text-foreground">
                  {datosActivos.posicion}
                </span>
                <span className="text-sm text-muted-foreground">
                  de {datosActivos.total}
                </span>
                <TrendBadge
                  t={(datosActivos as Posicion).tendencia}
                  prev={(datosActivos as Posicion).posicionAnterior}
                />
              </>
            )}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Valor:{' '}
            <span className="font-medium text-foreground">
              {formatValor(posicion.premioId, datosActivos.valor)}
            </span>
            {ventana != null && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Ventana {ventana}d
              </span>
            )}
            {ventana == null && !pendiente && (
              <span className="ml-2 text-[10px] text-muted-foreground/70">
                · periodo anual
              </span>
            )}
          </div>

          <div className="mt-4 flex gap-1">
            {VENTANAS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => consultarVentana(value)}
                disabled={loading}
                className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                  ventana === value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-muted'
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
