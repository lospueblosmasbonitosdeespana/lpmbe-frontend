'use client';

import * as React from 'react';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

type Waypoint = {
  lat: number;
  lng: number;
  titulo: string;
  orden: number;
};

type RouteInfo = {
  distanceKm: number;
  durationHours: number;
};

type RutaMapProps = {
  waypoints: Array<{
    lat?: number | null;
    lng?: number | null;
    titulo?: string;
    orden?: number;
  }>;
  /** Fetch road-following route from OSRM (default: true) */
  showRouting?: boolean;
  /** Show "Open in Google Maps / Apple Maps / Waze" buttons (default: true) */
  showNavButtons?: boolean;
  /** Map height in px or CSS string (default: 500) */
  height?: number | string;
  /** Callback fired when OSRM route is calculated with distance/time */
  onRouteCalculated?: (info: RouteInfo) => void;
  /** Show "Invertir ruta" button (default: true when showNavButtons) */
  allowReverse?: boolean;
};

// Brand colors
const COLOR_PRIMARY = '#854d0e';
const COLOR_PRIMARY_DARK = '#6e3f0b';
const COLOR_PRIMARY_LIGHT = '#a5650f';

export default function RutaMap({
  waypoints: rawWaypoints,
  showRouting = true,
  showNavButtons = true,
  height = 500,
  onRouteCalculated,
  allowReverse = true,
}: RutaMapProps) {
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<typeof import('leaflet') | null>(null);
  const [RL, setRL] = useState<typeof import('react-leaflet') | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [reversed, setReversed] = useState(false);
  const onRouteCalculatedRef = useRef(onRouteCalculated);
  onRouteCalculatedRef.current = onRouteCalculated;

  // Dynamic import of Leaflet + react-leaflet (SSR safe)
  useEffect(() => {
    Promise.all([import('leaflet'), import('react-leaflet')]).then(
      ([leaflet, rl]) => {
        delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
        setL(leaflet);
        setRL(rl);
        setMounted(true);
      }
    );
  }, []);

  // ── Filter valid waypoints ───────────────────────────────────
  const validWaypoints = useMemo<Waypoint[]>(() => {
    return rawWaypoints
      .filter(
        (w): w is typeof w & { lat: number; lng: number } =>
          typeof w.lat === 'number' &&
          typeof w.lng === 'number' &&
          !isNaN(w.lat) &&
          !isNaN(w.lng)
      )
      .map((w, idx) => ({
        lat: w.lat,
        lng: w.lng,
        titulo: w.titulo || `Parada ${w.orden ?? idx + 1}`,
        orden: w.orden ?? idx + 1,
      }));
  }, [rawWaypoints]);

  // Orden de paradas: normal o invertido (para mapa y navegación)
  const displayWaypoints = useMemo<Waypoint[]>(() => {
    if (!reversed || validWaypoints.length < 2) return validWaypoints;
    return [...validWaypoints]
      .reverse()
      .map((w, idx) => ({ ...w, orden: idx + 1, titulo: w.titulo }));
  }, [validWaypoints, reversed]);

  // ── Fetch OSRM route ────────────────────────────────────────
  useEffect(() => {
    if (!showRouting || displayWaypoints.length < 2) {
      setRouteCoords(null);
      return;
    }

    const coordsStr = displayWaypoints
      .map((w) => `${w.lng},${w.lat}`)
      .join(';');

    const abortController = new AbortController();

    fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`,
      { signal: abortController.signal }
    )
      .then((r) => r.json())
      .then((data) => {
        if (
          data.code === 'Ok' &&
          data.routes?.[0]?.geometry?.coordinates
        ) {
          const route = data.routes[0];
          // OSRM returns [lng, lat]; Leaflet expects [lat, lng]
          const decoded = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as [number, number]
          );
          setRouteCoords(decoded);

          // Report distance & duration to parent
          if (onRouteCalculatedRef.current && route.distance != null && route.duration != null) {
            onRouteCalculatedRef.current({
              distanceKm: Math.round((route.distance / 1000) * 10) / 10,
              durationHours: Math.round((route.duration / 3600) * 10) / 10,
            });
          }
        } else {
          // Fallback: straight lines
          setRouteCoords(
            displayWaypoints.map((w) => [w.lat, w.lng] as [number, number])
          );
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.warn('OSRM route fetch failed, falling back to straight lines:', err);
          setRouteCoords(
            displayWaypoints.map((w) => [w.lat, w.lng] as [number, number])
          );
        }
      });

    return () => abortController.abort();
  }, [showRouting, displayWaypoints]);

  // ── Calculate center ─────────────────────────────────────────
  const center = useMemo<[number, number]>(() => {
    if (displayWaypoints.length === 0) return [40.4168, -3.7038];
    const sumLat = displayWaypoints.reduce((acc, w) => acc + w.lat, 0);
    const sumLng = displayWaypoints.reduce((acc, w) => acc + w.lng, 0);
    return [
      sumLat / displayWaypoints.length,
      sumLng / displayWaypoints.length,
    ];
  }, [displayWaypoints]);

  // ── Calculate zoom ───────────────────────────────────────────
  const zoom = useMemo(() => {
    if (displayWaypoints.length <= 1) return 13;
    const lats = displayWaypoints.map((w) => w.lat);
    const lngs = displayWaypoints.map((w) => w.lng);
    const latSpread = Math.max(...lats) - Math.min(...lats);
    const lngSpread = Math.max(...lngs) - Math.min(...lngs);
    const maxSpread = Math.max(latSpread, lngSpread);
    if (maxSpread < 0.01) return 16;
    if (maxSpread < 0.02) return 15;
    if (maxSpread < 0.05) return 14;
    if (maxSpread < 0.1) return 13;
    if (maxSpread < 0.3) return 11;
    if (maxSpread < 0.5) return 10;
    if (maxSpread < 1) return 9;
    if (maxSpread < 2) return 8;
    return 7;
  }, [displayWaypoints]);

  // ── Numbered marker icons ────────────────────────────────────
  const createNumberedIcon = useCallback(
    (num: number) => {
      if (!L) return undefined;
      return L.divIcon({
        className: 'ruta-marker',
        html: `<div style="
          background: linear-gradient(135deg, ${COLOR_PRIMARY} 0%, ${COLOR_PRIMARY_DARK} 100%);
          color: white;
          border-radius: 50%;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          border: 2.5px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">${num}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -20],
      });
    },
    [L]
  );

  // ── Navigation URLs ──────────────────────────────────────────
  const googleMapsUrl = useMemo(() => {
    if (displayWaypoints.length === 0) return null;
    if (displayWaypoints.length === 1) {
      return `https://www.google.com/maps/dir/?api=1&destination=${displayWaypoints[0].lat},${displayWaypoints[0].lng}&travelmode=driving`;
    }
    const origin = displayWaypoints[0];
    const dest = displayWaypoints[displayWaypoints.length - 1];
    const middle = displayWaypoints.slice(1, -1);
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}&travelmode=driving`;
    if (middle.length > 0) {
      url += `&waypoints=${middle.map((w) => `${w.lat},${w.lng}`).join('|')}`;
    }
    return url;
  }, [displayWaypoints]);

  const appleMapsUrl = useMemo(() => {
    if (displayWaypoints.length === 0) return null;
    const dest = displayWaypoints[displayWaypoints.length - 1];
    return `https://maps.apple.com/?daddr=${dest.lat},${dest.lng}&dirflg=d`;
  }, [displayWaypoints]);

  const wazeUrl = useMemo(() => {
    if (displayWaypoints.length === 0) return null;
    const dest = displayWaypoints[displayWaypoints.length - 1];
    return `https://waze.com/ul?ll=${dest.lat},${dest.lng}&navigate=yes`;
  }, [displayWaypoints]);

  // ── Map key for re-rendering when waypoints change ───────────
  const mapKey = useMemo(
    () =>
      displayWaypoints
        .map((w) => `${w.orden}-${w.lat.toFixed(4)}-${w.lng.toFixed(4)}`)
        .join('_') || 'empty',
    [displayWaypoints]
  );

  // ── Empty state ──────────────────────────────────────────────
  if (validWaypoints.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-gray-600">
        Mapa no disponible (no hay coordenadas en las paradas)
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────
  if (!mounted || !L || !RL) {
    return (
      <div
        style={{
          width: '100%',
          height: typeof height === 'number' ? height : undefined,
          minHeight: 300,
        }}
        className="flex items-center justify-center rounded-xl border bg-gray-50"
      >
        <div className="text-sm text-gray-500">Cargando mapa...</div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Polyline } = RL;

  return (
    <div>
      {/* Map */}
      <div
        style={{
          width: '100%',
          height: typeof height === 'number' ? height : undefined,
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid #e0e0e0',
        }}
      >
        <MapContainer
          key={mapKey}
          center={center}
          zoom={zoom}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Road-following polyline (from OSRM) */}
          {routeCoords && routeCoords.length > 1 && (
            <Polyline
              positions={routeCoords}
              pathOptions={{
                color: COLOR_PRIMARY,
                weight: 4,
                opacity: 0.85,
              }}
            />
          )}

          {/* Dashed fallback while loading / if routing disabled */}
          {!routeCoords && displayWaypoints.length >= 2 && (
            <Polyline
              positions={displayWaypoints.map(
                (w) => [w.lat, w.lng] as [number, number]
              )}
              pathOptions={{
                color: COLOR_PRIMARY,
                weight: 3,
                opacity: 0.5,
                dashArray: '10 6',
              }}
            />
          )}

          {/* Numbered markers */}
          {displayWaypoints.map((w) => {
            const icon = createNumberedIcon(w.orden);
            return (
              <Marker
                key={`wp-${w.orden}`}
                position={[w.lat, w.lng]}
                icon={icon}
              >
                <Popup>
                  <div style={{ lineHeight: 1.4 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: COLOR_PRIMARY,
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 700,
                          marginRight: 6,
                          verticalAlign: 'middle',
                        }}
                      >
                        {w.orden}
                      </span>
                      {w.titulo}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Invertir ruta + Navigation buttons */}
      {showNavButtons && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {allowReverse && validWaypoints.length >= 2 && (
            <button
              type="button"
              onClick={() => setReversed((r) => !r)}
              className="inline-flex items-center gap-2 rounded-lg border border-primary bg-white px-4 py-2.5 text-sm font-medium text-primary shadow-sm transition hover:bg-accent"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 16V4M7 4L3 8M7 4L11 8" />
                <path d="M17 8v12M17 20l4-4M17 20l-4-4" />
              </svg>
              {reversed ? 'Ver ruta normal' : 'Invertir ruta'}
            </button>
          )}
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              Abrir en Google Maps
            </a>
          )}
          {appleMapsUrl && (
            <a
              href={appleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-primary bg-white px-4 py-2.5 text-sm font-medium text-primary shadow-sm transition hover:bg-accent"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              Abrir en Apple Maps
            </a>
          )}
          {wazeUrl && (
            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary/80 px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/70"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              Abrir en Waze
            </a>
          )}
        </div>
      )}
    </div>
  );
}
