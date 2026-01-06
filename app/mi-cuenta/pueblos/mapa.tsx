'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

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

export default function MapaPueblosVisitados({
  pueblos,
  visitedIds,
}: {
  pueblos: Pueblo[];
  visitedIds: Set<number>;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Centro España aproximado; si quieres, se puede centrar al primer pueblo.
  const center: [number, number] = [40.4168, -3.7038];

  if (!mounted) {
    return (
      <div style={{ width: '100%', height: 720, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e5e5', borderRadius: 4 }}>
        <div className="text-sm text-gray-600">Cargando mapa...</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 720 }}>
      <MapContainer center={center} zoom={6} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {pueblos.map((p) => {
          const isVisited = visitedIds.has(p.id);
          const radius = isVisited ? 9 : 6; // visitado más grande
          const pathOptions = isVisited
            ? { color: '#d00000', fillColor: '#d00000', fillOpacity: 0.8, weight: 1 }
            : { color: '#888888', fillColor: '#888888', fillOpacity: 0.5, weight: 1 };

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
                    Estado: <b>{isVisited ? 'Visitado' : 'No visitado'}</b>
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

