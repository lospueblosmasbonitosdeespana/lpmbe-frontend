'use client';

import * as React from 'react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import 'leaflet/dist/leaflet.css';
import { getResourceColor, getResourceSvg } from '@/lib/resource-types';
import { getTipoServicioConfig, DIAS_SEMANA, type HorarioServicio } from '@/lib/tipos-servicio';

type Parada = {
  titulo?: string | null;
  lat?: number | null;
  lng?: number | null;
  orden?: number | null;
  tipo?: string | null;
};

type PuntoServicio = {
  id: number;
  tipo: string;
  nombre?: string | null;
  lat?: number | null;
  lng?: number | null;
  horario?: HorarioServicio | null;
};

function formatHorario(horario: HorarioServicio): string {
  const lineas: string[] = [];
  for (const { key, label } of DIAS_SEMANA) {
    const val = horario[key];
    if (val && (val as string).trim()) {
      lineas.push(`<strong>${label}:</strong> ${val}`);
    }
  }
  return lineas.join('<br/>');
}

export default function ParadasMap({
  paradas,
  puebloNombre,
  resourceTipo,
  puntosServicio = [],
}: {
  paradas: Parada[];
  puebloNombre?: string;
  resourceTipo?: string | null;
  puntosServicio?: PuntoServicio[];
}) {
  const tServ = useTranslations('pueblo.serviciosVisitante');
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<typeof import('leaflet') | null>(null);
  const [RL, setRL] = useState<typeof import('react-leaflet') | null>(null);

  const [showPois, setShowPois] = useState(true);
  const [showServicios, setShowServicios] = useState(true);

  const hasServicios = puntosServicio.filter(
    (p) => typeof p.lat === 'number' && typeof p.lng === 'number'
  ).length > 0;

  useEffect(() => {
    Promise.all([import('leaflet'), import('react-leaflet')]).then(([leaflet, rl]) => {
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      setL(leaflet);
      setRL(rl);
      setMounted(true);
    });
  }, []);

  const paradasConCoords = useMemo(
    () => paradas.filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number'),
    [paradas],
  );

  const serviciosConCoords = useMemo(
    () => puntosServicio.filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number'),
    [puntosServicio],
  );

  // Centro del mapa considerando ambas capas
  const center = useMemo<[number, number]>(() => {
    const all = [
      ...paradasConCoords.map((p) => ({ lat: p.lat as number, lng: p.lng as number })),
      ...serviciosConCoords.map((p) => ({ lat: p.lat as number, lng: p.lng as number })),
    ];
    if (all.length === 0) return [40.4168, -3.7038];
    const sumLat = all.reduce((acc, p) => acc + p.lat, 0);
    const sumLng = all.reduce((acc, p) => acc + p.lng, 0);
    return [sumLat / all.length, sumLng / all.length];
  }, [paradasConCoords, serviciosConCoords]);

  const zoom = useMemo(() => {
    const all = [
      ...paradasConCoords.map((p) => ({ lat: p.lat as number, lng: p.lng as number })),
      ...serviciosConCoords.map((p) => ({ lat: p.lat as number, lng: p.lng as number })),
    ];
    if (all.length <= 1) return 15;
    const lats = all.map((p) => p.lat);
    const lngs = all.map((p) => p.lng);
    const latSpread = Math.max(...lats) - Math.min(...lats);
    const lngSpread = Math.max(...lngs) - Math.min(...lngs);
    const maxSpread = Math.max(latSpread, lngSpread);
    if (maxSpread < 0.01) return 16;
    if (maxSpread < 0.02) return 15;
    if (maxSpread < 0.05) return 14;
    if (maxSpread < 0.1) return 13;
    return 12;
  }, [paradasConCoords, serviciosConCoords]);

  const createResourceIcon = useCallback(
    (tipo: string) => {
      if (!L) return undefined;
      const color = getResourceColor(tipo);
      const svgPath = getResourceSvg(tipo);
      return L.divIcon({
        className: '',
        html: `<div style="
          background: ${color};
          color: white;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        "><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });
    },
    [L],
  );

  const createNumberedIcon = useCallback(
    (num: number) => {
      if (!L) return undefined;
      return L.divIcon({
        className: 'parada-numbered-marker',
        html: `<div style="
          background: linear-gradient(135deg, #5a1520 0%, #7A1C1C 100%);
          color: white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          border: 2.5px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">${num}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });
    },
    [L],
  );

  const createServicioIcon = useCallback(
    (tipo: string) => {
      if (!L) return undefined;
      const cfg = getTipoServicioConfig(tipo);
      if (!cfg) return undefined;
      return L.divIcon({
        className: '',
        html: `<div style="
          background: ${cfg.color};
          width: 34px;
          height: 34px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
            ${cfg.svg}
          </div>
        </div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -36],
      });
    },
    [L],
  );

  if (paradasConCoords.length === 0 && serviciosConCoords.length === 0) return null;

  if (!mounted || !L || !RL) {
    return (
      <div
        style={{
          width: '100%',
          height: 340,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: 12,
          border: '1px solid #e0e0e0',
        }}
      >
        <div className="text-sm text-gray-500">Cargando mapa...</div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = RL;

  return (
    <div>
      {/* Botones de capa — solo si hay servicios */}
      {hasServicios && (
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowPois((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              showPois
                ? 'border-[#7A1C1C] bg-[#7A1C1C] text-white shadow-sm'
                : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400'
            }`}
          >
            <span
              className="inline-block h-3 w-3 rounded-full border border-white/40"
              style={{ background: showPois ? 'white' : '#7A1C1C' }}
            />
            {tServ('togglePois')}
          </button>
          <button
            type="button"
            onClick={() => setShowServicios((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              showServicios
                ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400'
            }`}
          >
            <span
              className="inline-block h-3 w-3 rounded-full border border-white/40"
              style={{ background: showServicios ? 'white' : '#2563eb' }}
            />
            {tServ('toggleServicios')}
          </button>
        </div>
      )}

      <div
        style={{
          width: '100%',
          height: 340,
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid #e0e0e0',
          position: 'relative',
          zIndex: 0,
        }}
      >
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Marcadores de POIs / paradas */}
          {showPois &&
            paradasConCoords.map((p, idx) => {
              const tipo = p.tipo ?? resourceTipo;
              const icon = tipo ? createResourceIcon(tipo) : createNumberedIcon(idx + 1);
              return (
                <Marker
                  key={`parada-${idx}`}
                  position={[p.lat as number, p.lng as number]}
                  icon={icon}
                >
                  <Popup>
                    <div style={{ lineHeight: 1.4 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>
                        {p.titulo ?? 'Parada'}
                      </div>
                      {puebloNombre && (
                        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                          {puebloNombre}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* Marcadores de servicios del visitante */}
          {showServicios &&
            serviciosConCoords.map((punto) => {
              const cfg = getTipoServicioConfig(punto.tipo);
              const icon = createServicioIcon(punto.tipo);
              const tieneHorario =
                punto.horario &&
                Object.values(punto.horario).some((v) => v && (v as string).trim());
              return (
                <Marker
                  key={`servicio-${punto.id}`}
                  position={[punto.lat as number, punto.lng as number]}
                  icon={icon}
                >
                  <Popup>
                    <div style={{ minWidth: '150px', fontFamily: 'inherit' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          marginBottom: '4px',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: cfg?.color ?? '#6b7280',
                            borderRadius: '50%',
                            width: '26px',
                            height: '26px',
                            flexShrink: 0,
                          }}
                          dangerouslySetInnerHTML={{ __html: cfg?.svg ?? '' }}
                        />
                        <strong style={{ fontSize: '13px' }}>
                          {cfg ? tServ(`tipos.${cfg.i18nKey}`) : punto.tipo}
                        </strong>
                      </div>
                      {punto.nombre && (
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>
                          {punto.nombre}
                        </p>
                      )}
                      {tieneHorario ? (
                        <div
                          style={{
                            marginTop: '5px',
                            fontSize: '11px',
                            lineHeight: '1.5',
                            color: '#374151',
                          }}
                          dangerouslySetInnerHTML={{
                            __html: formatHorario(punto.horario as HorarioServicio),
                          }}
                        />
                      ) : (
                        <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0' }}>
                          {tServ('sinHorario')}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>
      </div>

      {/* Leyenda de servicios presentes */}
      {hasServicios && showServicios && serviciosConCoords.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Array.from(new Set(serviciosConCoords.map((p) => p.tipo))).map((tipo) => {
            const cfg = getTipoServicioConfig(tipo);
            return (
              <span
                key={tipo}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  background: (cfg?.color ?? '#6b7280') + '18',
                  color: cfg?.color ?? '#6b7280',
                }}
              >
                <span>{cfg?.emoji ?? '📍'}</span>
                {cfg ? tServ(`tipos.${cfg.i18nKey}`) : tipo}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
