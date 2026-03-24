'use client';

import { CircleMarker, MapContainer, Polyline, TileLayer } from 'react-leaflet';

type Stop = { lat: number; lng: number; label?: string };

export default function EventoRecorridoMap({
  inicioLat,
  inicioLng,
  finLat,
  finLng,
  paradas,
  className,
}: {
  inicioLat?: number | null;
  inicioLng?: number | null;
  finLat?: number | null;
  finLng?: number | null;
  paradas?: Stop[] | null;
  className?: string;
}) {
  const points: Array<[number, number]> = [];
  if (inicioLat != null && inicioLng != null) points.push([inicioLat, inicioLng]);
  for (const p of paradas ?? []) points.push([p.lat, p.lng]);
  if (finLat != null && finLng != null) points.push([finLat, finLng]);
  if (points.length === 0) return null;

  const center = points[0];
  return (
    <div className="overflow-hidden rounded-lg border h-full">
      <MapContainer center={center} zoom={15} className={className || "h-64 w-full"}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {inicioLat != null && inicioLng != null && (
          <CircleMarker center={[inicioLat, inicioLng]} radius={7} pathOptions={{ color: '#16a34a' }} />
        )}
        {finLat != null && finLng != null && (
          <CircleMarker center={[finLat, finLng]} radius={7} pathOptions={{ color: '#dc2626' }} />
        )}
        {(paradas ?? []).map((p, i) => (
          <CircleMarker key={`${p.lat}-${p.lng}-${i}`} center={[p.lat, p.lng]} radius={5} pathOptions={{ color: '#2563eb' }} />
        ))}
        {points.length >= 2 && <Polyline positions={points} pathOptions={{ color: '#1d4ed8', weight: 4 }} />}
      </MapContainer>
    </div>
  );
}
