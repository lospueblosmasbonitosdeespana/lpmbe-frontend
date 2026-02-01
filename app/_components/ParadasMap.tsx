'use client';

import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

type Parada = {
  titulo?: string | null;
  lat?: number | null;
  lng?: number | null;
  orden?: number | null;
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

export default function ParadasMap({
  paradas,
  puebloNombre,
}: {
  paradas: Parada[];
  puebloNombre?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filtrar solo paradas con coordenadas válidas
  const paradasConCoords = useMemo(() => 
    paradas.filter(
      (p) => typeof p.lat === 'number' && typeof p.lng === 'number'
    ),
    [paradas]
  );

  // Calcular centro del mapa basado en las paradas
  const center = useMemo<[number, number]>(() => {
    if (paradasConCoords.length === 0) {
      return [40.4168, -3.7038]; // Centro de España por defecto
    }
    const sumLat = paradasConCoords.reduce((acc, p) => acc + (p.lat as number), 0);
    const sumLng = paradasConCoords.reduce((acc, p) => acc + (p.lng as number), 0);
    return [sumLat / paradasConCoords.length, sumLng / paradasConCoords.length];
  }, [paradasConCoords]);

  // Calcular zoom apropiado basado en la dispersión de las paradas
  const zoom = useMemo(() => {
    if (paradasConCoords.length <= 1) return 15;
    
    const lats = paradasConCoords.map((p) => p.lat as number);
    const lngs = paradasConCoords.map((p) => p.lng as number);
    const latSpread = Math.max(...lats) - Math.min(...lats);
    const lngSpread = Math.max(...lngs) - Math.min(...lngs);
    const maxSpread = Math.max(latSpread, lngSpread);
    
    // Ajustar zoom según la dispersión
    if (maxSpread < 0.01) return 16;
    if (maxSpread < 0.02) return 15;
    if (maxSpread < 0.05) return 14;
    if (maxSpread < 0.1) return 13;
    return 12;
  }, [paradasConCoords]);

  if (paradasConCoords.length === 0) {
    return null; // No mostrar mapa si no hay coordenadas
  }

  if (!mounted) {
    return (
      <div 
        style={{ 
          width: '100%', 
          height: 300, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: '#f5f5f5',
          borderRadius: 8,
          border: '1px solid #e0e0e0'
        }}
      >
        <div className="text-sm text-gray-600">Cargando mapa de paradas...</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 300, borderRadius: 8, overflow: 'hidden' }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {paradasConCoords.map((p, idx) => {
          const orden = p.orden ?? idx + 1;
          return (
            <CircleMarker
              key={`parada-${idx}`}
              center={[p.lat as number, p.lng as number]}
              radius={10}
              pathOptions={{ 
                color: '#0066cc', 
                fillColor: '#0066cc', 
                fillOpacity: 0.8, 
                weight: 2 
              }}
            >
              <Popup>
                <div style={{ lineHeight: 1.4 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {orden}. {p.titulo ?? 'Parada'}
                  </div>
                  {puebloNombre && (
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                      {puebloNombre}
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
