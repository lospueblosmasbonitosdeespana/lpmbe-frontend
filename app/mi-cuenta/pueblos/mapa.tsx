'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

type Pueblo = {
  id: number;
  nombre: string;
  lat: number;
  lng: number;
  provincia?: string | null;
  comunidad?: string | null;
};

// Importar componentes de Leaflet dinámicamente para evitar problemas con SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// Azul GPS, verde Manual, gris no visitado
const COLOR_GPS    = { color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.85, weight: 1 };
const COLOR_MANUAL = { color: '#16a34a', fillColor: '#22c55e', fillOpacity: 0.85, weight: 1 };
const COLOR_NONE   = { color: '#888888', fillColor: '#888888', fillOpacity: 0.45, weight: 1 };

export default function MapaPueblosVisitados({
  pueblos,
  visitedIds,
  visitedOrigins,
}: {
  pueblos: Pueblo[];
  visitedIds: Set<number>;
  visitedOrigins?: Map<number, 'GPS' | 'MANUAL'>;
}) {
  const t = useTranslations('visitedVillages');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const center: [number, number] = [40.4168, -3.7038];

  if (!mounted) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center border border-border bg-muted/20 lg:h-[720px]">
        <p className="text-sm text-muted-foreground">{t('mapLoading')}</p>
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full lg:h-[720px]" style={{ position: 'relative', zIndex: 0 }}>
      {/* Leyenda */}
      <div style={{
        position: 'absolute', bottom: 28, left: 10, zIndex: 1000,
        background: 'rgba(255,255,255,0.92)', borderRadius: 8, padding: '8px 12px',
        fontSize: 12, lineHeight: 1.8, boxShadow: '0 1px 6px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#3b82f6' }} />
          GPS
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
          Manual
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#888' }} />
          No visitado
        </div>
      </div>

      <MapContainer center={center} zoom={6} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {pueblos.map((p) => {
          const origen = visitedOrigins?.get(p.id);
          const isVisited = visitedIds.has(p.id);
          const radius = isVisited ? 9 : 6;
          const pathOptions = origen === 'GPS'
            ? COLOR_GPS
            : origen === 'MANUAL'
            ? COLOR_MANUAL
            : COLOR_NONE;

          return (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={radius}
              pathOptions={pathOptions}
            >
              <Popup>
                <div style={{ lineHeight: 1.3 }}>
                  <div style={{ fontWeight: 700 }}>{p.nombre}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    {(p.provincia || '') + (p.comunidad ? ` / ${p.comunidad}` : '')}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12 }}>
                    {t('mapStatus')}: <b>{isVisited ? (origen === 'GPS' ? 'GPS' : origen === 'MANUAL' ? 'Manual' : t('mapVisited')) : t('mapNotVisited')}</b>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

