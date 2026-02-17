'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import RutaMap, { type RouteInfo, type RouteLeg } from './RutaMap';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

type Parada = {
  puebloId?: number;
  pueblo?: any;
  orden?: number;
  titulo?: string;
  descripcion?: string;
  fotoUrl?: string;
  lat?: number | null;
  lng?: number | null;
};

type Props = {
  paradas: Parada[];
  tips: any[];
  /** Total distance from DB (used before OSRM loads) */
  totalDistanciaKm?: number | null;
  /** Total estimated time from DB */
  totalTiempoEstimado?: string | null;
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

export default function RutaParadasConMapa({
  paradas,
  tips,
  totalDistanciaKm,
  totalTiempoEstimado,
}: Props) {
  const t = useTranslations('rutas');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [reversed, setReversed] = useState(false);

  const handleReversedChange = useCallback((val: boolean) => {
    setReversed(val);
    // Clear route info so it recalculates with new order
    setRouteInfo(null);
  }, []);

  // Preprocess paradas: strip TIPS from the original last parada
  const processedParadas = useMemo(() => {
    return paradas.map((p, idx) => {
      let descripcion = (p.descripcion ?? '').toString().trim();
      if (tips.length > 0 && idx === paradas.length - 1) {
        const marcadores = ['TIPS DE RUTA', 'Tips de ruta', 'TIPS', 'Tips', 'Duración recomendada'];
        for (const m of marcadores) {
          const i = descripcion.indexOf(m);
          if (i !== -1) {
            descripcion = descripcion.slice(0, i).trim();
            break;
          }
        }
      }
      return { ...p, cleanDescripcion: descripcion };
    });
  }, [paradas, tips]);

  // Display paradas: normal or reversed order
  const displayParadas = useMemo(() => {
    if (!reversed) return processedParadas;
    return [...processedParadas].reverse();
  }, [processedParadas, reversed]);

  // Build waypoints for the map (always in original order, RutaMap handles reversal)
  const mapWaypoints = useMemo(
    () =>
      paradas.map((p, idx) => {
        const n = p.orden ?? idx + 1;
        return {
          lat: p.lat ?? p.pueblo?.lat ?? null,
          lng: p.lng ?? p.pueblo?.lng ?? null,
          titulo: (p.titulo?.trim() || p.pueblo?.nombre || t('stopN', { n })) as string,
          orden: Number(n),
        };
      }),
    [paradas, t]
  );

  // Use OSRM data if available, otherwise DB data
  const displayDistance = routeInfo?.distanceKm ?? totalDistanciaKm;
  const displayDuration = routeInfo
    ? formatDuration(Math.round(routeInfo.durationHours * 60))
    : totalTiempoEstimado
      ? `${totalTiempoEstimado} h`
      : null;

  const legs = routeInfo?.legs ?? [];

  // Calculate accumulated distance for each stop
  const accumulatedDistances = useMemo(() => {
    const acc: number[] = [0]; // first stop = 0 km
    for (let i = 0; i < legs.length; i++) {
      acc.push(Math.round((acc[i] + legs[i].distanceKm) * 10) / 10);
    }
    return acc;
  }, [legs]);

  return (
    <div>
      {/* Resumen total de la ruta */}
      {(displayDistance || displayDuration) && (
        <div className="mb-8 rounded-xl border bg-accent/50 p-5">
          <h3 className="text-lg font-semibold text-foreground mb-3">{t('routeSummary')}</h3>
          <div className="flex flex-wrap gap-6">
            {displayDistance && (
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div>
                  <span className="text-xs font-medium uppercase text-muted-foreground">{t('totalDistance')}</span>
                  <p className="text-lg font-bold text-foreground">{displayDistance} km</p>
                </div>
              </div>
            )}
            {displayDuration && (
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <div>
                  <span className="text-xs font-medium uppercase text-muted-foreground">{t('driveTime')}</span>
                  <p className="text-lg font-bold text-foreground">{displayDuration}</p>
                </div>
              </div>
            )}
            {paradas.length > 0 && (
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" />
                </svg>
                <div>
                  <span className="text-xs font-medium uppercase text-muted-foreground">{t('stops')}</span>
                  <p className="text-lg font-bold text-foreground">{paradas.length}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mapa de la ruta (ANTES de las paradas) */}
      <section id="mapa" className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">{t('routeMap')}</h2>
        <RutaMap
          waypoints={mapWaypoints}
          height={500}
          onRouteCalculated={setRouteInfo}
          reversed={reversed}
          onReversedChange={handleReversedChange}
        />
      </section>

      {/* Paradas de la ruta con distancias entre ellas */}
      {displayParadas.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            {t('routeStops')}
            {reversed && (
              <span className="ml-3 text-sm font-normal text-muted-foreground">{t('routeStopsReversed')}</span>
            )}
          </h2>

          <div className="mt-4 space-y-0">
            {displayParadas.map((p: any, idx: number) => {
              const pueblo = p.pueblo ?? {};
              const displayOrder = idx + 1;
              const titulo = (p.titulo?.trim() || pueblo.nombre || t('stopN', { n: displayOrder })) as string;
              const descripcion = p.cleanDescripcion ?? '';
              const fotoUrl = (p.fotoUrl || '').toString().trim();
              const leg = idx < legs.length ? legs[idx] : null;
              const accumulated = accumulatedDistances[idx] ?? null;

              return (
                <div key={`${p.puebloId}-${displayOrder}-${reversed ? 'r' : 'n'}`}>
                  <article className="rounded-lg border p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                        {displayOrder}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">{titulo}</h3>
                        {accumulated != null && accumulated > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t('kmFromStart', { km: accumulated })}
                          </p>
                        )}
                      </div>
                    </div>

                    {fotoUrl ? (
                      <div className="mt-4">
                        {(pueblo as any).slug ? (
                          <Link
                            href={`/pueblos/${(pueblo as any).slug}`}
                            className="block transition hover:opacity-90"
                          >
                            <img
                              src={fotoUrl}
                              alt={titulo}
                              className="mt-3 rounded-md border cursor-pointer"
                              style={{ width: 260, height: 'auto' }}
                            />
                            <span className="mt-1 block text-sm text-primary hover:underline">
                              {t('viewVillage')}
                            </span>
                          </Link>
                        ) : (
                          <img
                            src={fotoUrl}
                            alt={titulo}
                            className="mt-3 rounded-md border"
                            style={{ width: 260, height: 'auto' }}
                          />
                        )}
                      </div>
                    ) : null}

                    {descripcion ? (
                      <div
                        className="mt-4 prose prose-gray max-w-none"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(descripcion) }}
                      />
                    ) : null}
                  </article>

                  {/* Indicador de distancia entre paradas */}
                  {leg && (
                    <div className="flex items-center gap-2 py-2 pl-4">
                      <div className="flex flex-col items-center">
                        <div className="h-4 w-px bg-primary/30" />
                        <svg className="h-4 w-4 text-primary/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12l7 7 7-7" />
                        </svg>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {leg.distanceKm} km · {formatDuration(leg.durationMinutes)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
