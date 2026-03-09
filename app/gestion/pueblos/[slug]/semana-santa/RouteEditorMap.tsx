'use client';

import { useMemo } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, useMapEvents } from 'react-leaflet';

export type RouteStop = { lat: number; lng: number; label?: string };
export type RouteDraft = {
  inicioLat?: number;
  inicioLng?: number;
  finLat?: number;
  finLng?: number;
  paradas: RouteStop[];
};

type Mode = 'inicio' | 'fin' | 'parada';

function ClickHandler({ mode, onPick }: { mode: Mode; onPick: (lat: number, lng: number, mode: Mode) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng, mode);
    },
  });
  return null;
}

export default function RouteEditorMap({
  value,
  mode,
  onChange,
}: {
  value: RouteDraft;
  mode: Mode;
  onChange: (next: RouteDraft) => void;
}) {
  const center: [number, number] = useMemo(() => {
    if (value.inicioLat != null && value.inicioLng != null) return [value.inicioLat, value.inicioLng];
    if (value.finLat != null && value.finLng != null) return [value.finLat, value.finLng];
    if (value.paradas.length > 0) return [value.paradas[0].lat, value.paradas[0].lng];
    return [40.4168, -3.7038];
  }, [value]);

  const linePoints: Array<[number, number]> = useMemo(() => {
    const points: Array<[number, number]> = [];
    if (value.inicioLat != null && value.inicioLng != null) points.push([value.inicioLat, value.inicioLng]);
    for (const p of value.paradas) points.push([p.lat, p.lng]);
    if (value.finLat != null && value.finLng != null) points.push([value.finLat, value.finLng]);
    return points;
  }, [value]);

  return (
    <div className="overflow-hidden rounded-lg border">
      <MapContainer center={center} zoom={15} className="h-72 w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler
          mode={mode}
          onPick={(lat, lng, currentMode) => {
            if (currentMode === 'inicio') {
              onChange({ ...value, inicioLat: lat, inicioLng: lng });
              return;
            }
            if (currentMode === 'fin') {
              onChange({ ...value, finLat: lat, finLng: lng });
              return;
            }
            onChange({ ...value, paradas: [...value.paradas, { lat, lng }] });
          }}
        />

        {value.inicioLat != null && value.inicioLng != null && (
          <CircleMarker center={[value.inicioLat, value.inicioLng]} radius={7} pathOptions={{ color: '#16a34a' }} />
        )}
        {value.finLat != null && value.finLng != null && (
          <CircleMarker center={[value.finLat, value.finLng]} radius={7} pathOptions={{ color: '#dc2626' }} />
        )}
        {value.paradas.map((p, i) => (
          <CircleMarker key={`${p.lat}-${p.lng}-${i}`} center={[p.lat, p.lng]} radius={5} pathOptions={{ color: '#2563eb' }} />
        ))}

        {linePoints.length >= 2 && <Polyline positions={linePoints} pathOptions={{ color: '#1d4ed8', weight: 4 }} />}
      </MapContainer>
    </div>
  );
}
