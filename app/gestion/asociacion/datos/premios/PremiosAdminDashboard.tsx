'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

// Catálogo frontend de los 12 premios. Mantener en sync con backend/src/premios/premios.types.ts
// Sólo usamos meta visual aquí; el backend es la fuente de verdad para los datos.
const PREMIOS_UI: Record<
  number,
  { titulo: string; descripcion: string; unidad: string; implementado: boolean; emoji: string }
> = {
  1: { titulo: 'Pueblo Mejor Valorado', descripcion: 'Media bayesiana de las reseñas (ponderada por nº de votos).', unidad: '★ de 5', implementado: true, emoji: '★' },
  2: { titulo: 'Más Visitado (GPS)', descripcion: 'Mayor número de visitas físicas reales.', unidad: 'visitas', implementado: true, emoji: '📍' },
  3: { titulo: 'Más Visitado en Web/App', descripcion: 'Mayor número de consultas digitales.', unidad: 'vistas', implementado: true, emoji: '🌐' },
  4: { titulo: 'Más Activo del Club', descripcion: 'Mayor volumen de canjes de QR del Club.', unidad: 'canjes', implementado: true, emoji: '🎟️' },
  5: { titulo: 'Más Internacional', descripcion: '% de visitantes extranjeros (datos Telefónica Tech).', unidad: '%', implementado: false, emoji: '🌍' },
  6: { titulo: 'Pueblo Revelación', descripcion: 'Mayor crecimiento relativo del periodo.', unidad: '%', implementado: true, emoji: '🚀' },
  7: { titulo: 'Más Trabajador · Eventos y Noticias', descripcion: 'Más eventos y noticias publicados por el pueblo.', unidad: 'publicaciones', implementado: true, emoji: '🎭' },
  8: { titulo: 'Más Trabajador · Contenidos', descripcion: 'Más noticias, artículos, páginas y rutas propias.', unidad: 'publicaciones', implementado: true, emoji: '✍️' },
  9: { titulo: 'Mejor Fichado', descripcion: 'Ficha más completa: fotos, traducciones, recursos.', unidad: 'índice', implementado: true, emoji: '🗂️' },
  10: { titulo: 'Mejor Tejido Local', descripcion: 'Más negocios y alojamientos adheridos al Club.', unidad: 'negocios', implementado: true, emoji: '🏪' },
  11: { titulo: 'Más Visitado por el Club', descripcion: 'Visitas del Club ponderadas por el nº de recursos del pueblo.', unidad: 'visitas/recurso', implementado: true, emoji: '⚡' },
  12: { titulo: 'Especial del Jurado', descripcion: 'Iniciativas singulares, a decisión del jurado.', unidad: 'manual', implementado: true, emoji: '🏆' },
};

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

function formatValor(premioId: number, valor: number): string {
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

export default function PremiosAdminDashboard() {
  const [ediciones, setEdiciones] = useState<Edicion[]>([]);
  const [edicionId, setEdicionId] = useState<number | null>(null);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loadingEd, setLoadingEd] = useState(true);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial de ediciones
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/premios/ediciones', {
          cache: 'no-store',
        });
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

  // Cada vez que cambia la edición, recargar resumen
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

  return (
    <div className="space-y-8">
      {/* Selector de edición */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border/70 bg-card p-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Edición
          </label>
          <select
            value={edicionId ?? ''}
            onChange={(e) => setEdicionId(Number(e.target.value))}
            disabled={loadingEd || ediciones.length === 0}
            className="min-w-[260px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {ediciones.map((e) => (
              <option key={e.id} value={e.id}>
                {e.etiqueta} {e.cerrada ? '(cerrada)' : '· en curso'}
              </option>
            ))}
          </select>
        </div>
        {edicion && (
          <div className="text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">Periodo:</span>{' '}
              {formatFecha(edicion.inicio)} → {formatFecha(edicion.fin)}
            </div>
            <div>
              <span className="font-medium text-foreground">Pueblos elegibles:</span>{' '}
              {resumen?.totalPueblos ?? '—'}
            </div>
          </div>
        )}
        {edicion && !edicion.cerrada && edicionId && (
          <CerrarEdicionButton
            edicionId={edicionId}
            onDone={() => setEdicionId(edicionId)}
          />
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Grid de 12 premios */}
      {loadingResumen ? (
        <div className="py-20 text-center text-sm text-muted-foreground">
          Calculando rankings…
        </div>
      ) : resumen ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumen.premios.map((premio) => {
            const ui = PREMIOS_UI[premio.premioId];
            return (
              <Link
                key={premio.premioId}
                href={`/gestion/asociacion/datos/premios/${premio.premioId}?edicionId=${resumen.edicion.id}`}
                className="group flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-lg"
                      aria-hidden
                    >
                      {ui?.emoji}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      #{String(premio.premioId).padStart(2, '0')}
                    </span>
                  </div>
                  {!premio.meta.implementado && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                      Próximamente
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  {premio.meta.titulo}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">{premio.meta.descripcion}</p>

                {premio.meta.implementado ? (
                  <div className="mt-4 space-y-1.5 text-sm">
                    {premio.top.length === 0 ? (
                      <p className="text-xs italic text-muted-foreground">
                        Aún no hay datos suficientes.
                      </p>
                    ) : (
                      premio.top.map((t, i) => (
                        <div
                          key={t.puebloId}
                          className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1.5"
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                i === 0
                                  ? 'bg-amber-400 text-amber-950'
                                  : i === 1
                                    ? 'bg-zinc-300 text-zinc-800'
                                    : 'bg-amber-700/50 text-amber-50'
                              }`}
                            >
                              {t.posicion}
                            </span>
                            <span className="truncate">{t.puebloNombre ?? `#${t.puebloId}`}</span>
                          </span>
                          <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                            {formatValor(premio.premioId, t.valor)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <p className="mt-4 rounded-md bg-amber-50 p-2 text-xs text-amber-900">
                    {premio.meta.razonPendiente ?? 'Pendiente de implementación.'}
                  </p>
                )}

                <div className="mt-4 text-xs font-medium text-primary group-hover:underline">
                  Ver ranking completo →
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function CerrarEdicionButton({
  edicionId,
  onDone,
}: {
  edicionId: number;
  onDone: () => void;
}) {
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
      className={`ml-auto rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
        confirming
          ? 'border-destructive bg-destructive text-destructive-foreground hover:brightness-110'
          : 'border-border bg-background hover:bg-muted'
      } disabled:opacity-50`}
    >
      {busy
        ? 'Cerrando…'
        : confirming
          ? 'Confirmar cierre anticipado'
          : 'Cerrar edición ahora'}
    </button>
  );
}
