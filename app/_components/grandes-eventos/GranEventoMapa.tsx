'use client';

import dynamic from 'next/dynamic';
import type { GranEventoPueblo } from '@/lib/grandes-eventos';

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

export default function GranEventoMapa({ pueblos }: { pueblos: GranEventoPueblo[] }) {
  const waypoints = pueblos.map((p) => ({
    lat: p.pueblo.lat,
    lng: p.pueblo.lng,
    titulo: p.pueblo.nombre,
    orden: p.orden,
  }));

  return <RutaMap waypoints={waypoints} height={520} showRouting allowReverse={false} />;
}
