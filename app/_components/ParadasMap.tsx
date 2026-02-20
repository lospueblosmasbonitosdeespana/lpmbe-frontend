'use client';

import * as React from 'react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import { getResourceColor, getResourceSvg } from '@/lib/resource-types';

type Parada = {
  titulo?: string | null;
  lat?: number | null;
  lng?: number | null;
  orden?: number | null;
  tipo?: string | null;
};

export default function ParadasMap({
  paradas,
  puebloNombre,
  resourceTipo,
}: {
  paradas: Parada[];
  puebloNombre?: string;
  resourceTipo?: string | null;
}) {
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<typeof import('leaflet') | null>(null);
  const [RL, setRL] = useState<typeof import('react-leaflet') | null>(null);

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

  const center = useMemo<[number, number]>(() => {
    if (paradasConCoords.length === 0) return [40.4168, -3.7038];
    const sumLat = paradasConCoords.reduce((acc, p) => acc + (p.lat as number), 0);
    const sumLng = paradasConCoords.reduce((acc, p) => acc + (p.lng as number), 0);
    return [sumLat / paradasConCoords.length, sumLng / paradasConCoords.length];
  }, [paradasConCoords]);

  const zoom = useMemo(() => {
    if (paradasConCoords.length <= 1) return 15;
    const lats = paradasConCoords.map((p) => p.lat as number);
    const lngs = paradasConCoords.map((p) => p.lng as number);
    const latSpread = Math.max(...lats) - Math.min(...lats);
    const lngSpread = Math.max(...lngs) - Math.min(...lngs);
    const maxSpread = Math.max(latSpread, lngSpread);
    if (maxSpread < 0.01) return 16;
    if (maxSpread < 0.02) return 15;
    if (maxSpread < 0.05) return 14;
    if (maxSpread < 0.1) return 13;
    return 12;
  }, [paradasConCoords]);

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

  if (paradasConCoords.length === 0) return null;

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
        <div className="text-sm text-gray-500">Cargando mapa de paradas...</div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = RL;

  return (
    <div style={{ width: '100%', height: 340, borderRadius: 12, overflow: 'hidden', border: '1px solid #e0e0e0', position: 'relative', zIndex: 0 }}>
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

        {paradasConCoords.map((p, idx) => {
          const tipo = p.tipo ?? resourceTipo;
          const icon = tipo
            ? createResourceIcon(tipo)
            : createNumberedIcon(idx + 1);

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
      </MapContainer>
    </div>
  );
}
