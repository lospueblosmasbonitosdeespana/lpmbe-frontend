'use client';

import * as React from 'react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';

type Parada = {
  titulo?: string | null;
  lat?: number | null;
  lng?: number | null;
  orden?: number | null;
};

export default function ParadasMap({
  paradas,
  puebloNombre,
}: {
  paradas: Parada[];
  puebloNombre?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<typeof import('leaflet') | null>(null);
  const [RL, setRL] = useState<typeof import('react-leaflet') | null>(null);

  useEffect(() => {
    Promise.all([import('leaflet'), import('react-leaflet')]).then(([leaflet, rl]) => {
      // Fix iconos Leaflet en Next.js
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

  // Filtrar solo paradas con coordenadas válidas
  const paradasConCoords = useMemo(
    () => paradas.filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number'),
    [paradas],
  );

  // Calcular centro del mapa
  const center = useMemo<[number, number]>(() => {
    if (paradasConCoords.length === 0) return [40.4168, -3.7038];
    const sumLat = paradasConCoords.reduce((acc, p) => acc + (p.lat as number), 0);
    const sumLng = paradasConCoords.reduce((acc, p) => acc + (p.lng as number), 0);
    return [sumLat / paradasConCoords.length, sumLng / paradasConCoords.length];
  }, [paradasConCoords]);

  // Calcular zoom
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

  // Crear iconos numerados
  const createNumberedIcon = useCallback(
    (num: number) => {
      if (!L) return undefined;
      return L.divIcon({
        className: 'parada-numbered-marker',
        html: `<div style="
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
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
    <div style={{ width: '100%', height: 340, borderRadius: 12, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
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
          const num = idx + 1;
          const icon = createNumberedIcon(num);
          return (
            <Marker
              key={`parada-${idx}`}
              position={[p.lat as number, p.lng as number]}
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
                        background: '#1e40af',
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 700,
                        marginRight: 6,
                        verticalAlign: 'middle',
                      }}
                    >
                      {num}
                    </span>
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
