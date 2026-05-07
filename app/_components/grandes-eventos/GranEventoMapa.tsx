'use client';

import dynamic from 'next/dynamic';
import type { GranEventoPueblo, GranEventoParada } from '@/lib/grandes-eventos';

const RutaMap = dynamic(() => import('@/app/_components/RutaMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: 520,
        borderRadius: 16,
        background: 'linear-gradient(135deg, #f5f0e8 0%, #ece2cf 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6b5a3c',
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      Cargando mapa…
    </div>
  ),
});

/**
 * Mapa de la ruta del evento. Mezcla pueblos de la red + paradas extra
 * (aeropuerto, sitios de visita, etc.) ordenados por su campo `orden`.
 */
export default function GranEventoMapa({
  pueblos,
  paradas = [],
}: {
  pueblos: GranEventoPueblo[];
  paradas?: GranEventoParada[];
}) {
  type Waypoint = { lat: number; lng: number; titulo: string; orden: number };
  const waypoints: Waypoint[] = [
    ...pueblos.map((p) => ({
      lat: p.pueblo.lat,
      lng: p.pueblo.lng,
      titulo: p.pueblo.nombre,
      orden: p.orden,
    })),
    ...paradas.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      titulo: p.nombre_es,
      orden: p.orden,
    })),
  ].sort((a, b) => a.orden - b.orden);

  return <RutaMap waypoints={waypoints} height={520} showRouting allowReverse={false} />;
}
