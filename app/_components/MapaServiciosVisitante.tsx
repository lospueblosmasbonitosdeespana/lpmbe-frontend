'use client';

import { useEffect, useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { TIPOS_SERVICIO, DIAS_SEMANA, getTipoServicioConfig, type HorarioServicio } from '@/lib/tipos-servicio';

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
    if (val && val.trim()) {
      lineas.push(`<strong>${label}:</strong> ${val}`);
    }
  }
  return lineas.join('<br/>');
}

export default function MapaServiciosVisitante({
  puntos,
  puebloNombre,
  center,
}: {
  puntos: PuntoServicio[];
  puebloNombre?: string;
  center?: [number, number];
}) {
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<typeof import('leaflet') | null>(null);
  const [RL, setRL] = useState<typeof import('react-leaflet') | null>(null);

  useEffect(() => {
    Promise.all([import('leaflet'), import('react-leaflet')]).then(([leaflet, rl]) => {
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      setL(leaflet);
      setRL(rl);
      setMounted(true);
    });
  }, []);

  const puntosConCoords = useMemo(
    () => puntos.filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number'),
    [puntos],
  );

  const mapCenter = useMemo<[number, number]>(() => {
    if (center) return center;
    if (puntosConCoords.length === 0) return [40.4168, -3.7038];
    const sumLat = puntosConCoords.reduce((acc, p) => acc + (p.lat as number), 0);
    const sumLng = puntosConCoords.reduce((acc, p) => acc + (p.lng as number), 0);
    return [sumLat / puntosConCoords.length, sumLng / puntosConCoords.length];
  }, [puntosConCoords, center]);

  const zoom = useMemo(() => {
    if (puntosConCoords.length <= 1) return 15;
    const lats = puntosConCoords.map((p) => p.lat as number);
    const lngs = puntosConCoords.map((p) => p.lng as number);
    const latSpread = Math.max(...lats) - Math.min(...lats);
    const lngSpread = Math.max(...lngs) - Math.min(...lngs);
    const maxSpread = Math.max(latSpread, lngSpread);
    if (maxSpread < 0.01) return 16;
    if (maxSpread < 0.02) return 15;
    if (maxSpread < 0.05) return 14;
    return 13;
  }, [puntosConCoords]);

  const createIcon = (tipo: string) => {
    if (!L) return undefined;
    const cfg = getTipoServicioConfig(tipo) ?? TIPOS_SERVICIO[0];
    return L.divIcon({
      className: '',
      html: `<div style="
        background: ${cfg.color};
        width: 36px;
        height: 36px;
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
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -38],
    });
  };

  if (!mounted || !L || !RL) {
    return (
      <div
        style={{ height: '380px' }}
        className="flex items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400"
      >
        Cargando mapa…
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = RL;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '380px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {puntosConCoords.map((punto) => {
          const cfg = getTipoServicioConfig(punto.tipo);
          const icon = createIcon(punto.tipo);
          const tieneHorario = punto.horario && Object.values(punto.horario).some((v) => v && (v as string).trim());
          return (
            <Marker
              key={punto.id}
              position={[punto.lat as number, punto.lng as number]}
              icon={icon}
            >
              <Popup>
                <div style={{ minWidth: '160px', fontFamily: 'inherit' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: cfg?.color ?? '#6b7280',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        flexShrink: 0,
                      }}
                      dangerouslySetInnerHTML={{ __html: cfg?.svg ?? '' }}
                    />
                    <strong style={{ fontSize: '14px' }}>
                      {cfg?.etiqueta ?? punto.tipo}
                    </strong>
                  </div>
                  {punto.nombre && (
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>
                      {punto.nombre}
                    </p>
                  )}
                  {tieneHorario && (
                    <div
                      style={{ marginTop: '6px', fontSize: '12px', lineHeight: '1.5', color: '#374151' }}
                      dangerouslySetInnerHTML={{ __html: formatHorario(punto.horario as HorarioServicio) }}
                    />
                  )}
                  {!tieneHorario && (
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0' }}>
                      Sin horario especificado
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Leyenda de tipos presentes */}
      {puntosConCoords.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-white px-4 py-3">
          {Array.from(new Set(puntosConCoords.map((p) => p.tipo))).map((tipo) => {
            const cfg = getTipoServicioConfig(tipo);
            return (
              <span
                key={tipo}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                style={{ background: (cfg?.color ?? '#6b7280') + '18', color: cfg?.color ?? '#6b7280' }}
              >
                <span>{cfg?.emoji ?? '📍'}</span>
                {cfg?.etiqueta ?? tipo}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
