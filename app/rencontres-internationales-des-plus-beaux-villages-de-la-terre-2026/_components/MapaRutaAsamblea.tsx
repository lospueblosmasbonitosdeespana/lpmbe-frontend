'use client';

import dynamic from 'next/dynamic';

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

const WAYPOINTS = [
  { lat: 36.318842, lng: -5.452998, titulo: 'Castellar de la Frontera', orden: 1 },
  { lat: 36.252034, lng: -5.966736, titulo: 'Vejer de la Frontera', orden: 2 },
  { lat: 36.758675, lng: -5.368439, titulo: 'Grazalema', orden: 3 },
  { lat: 36.839494, lng: -5.391992, titulo: 'Zahara', orden: 4 },
  { lat: 36.862426, lng: -5.176447, titulo: 'Setenil de las Bodegas', orden: 5 },
];

export default function MapaRutaAsamblea() {
  return <RutaMap waypoints={WAYPOINTS} height={520} showRouting allowReverse={false} />;
}
