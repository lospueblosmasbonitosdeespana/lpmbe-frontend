'use client';

import dynamic from 'next/dynamic';
import { MapPin, Navigation } from 'lucide-react';

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const LeafletMarker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });

interface Props {
  lat: number;
  lng: number;
  nombre: string;
  pueblo?: { id: number; nombre: string; slug: string } | null;
  localidad?: string | null;
  t: (key: string) => string;
}

export default function PremiumLocationMap({ lat, lng, nombre, pueblo, localidad, t }: Props) {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="text-center mb-12">
          <p className="text-gold text-sm tracking-[0.2em] uppercase mb-3">
            {t('locationSubtitle')}
          </p>
          <h2 className="text-3xl md:text-4xl font-serif text-foreground">
            {t('locationTitle')}
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="bg-card rounded-lg border border-border p-8">
            <div className="size-14 rounded-full bg-muted flex items-center justify-center mb-6">
              <MapPin className="size-7 text-primary" />
            </div>
            <h3 className="text-xl font-serif text-foreground mb-4">
              {t('address')}
            </h3>
            <address className="not-italic text-muted-foreground leading-relaxed">
              {nombre}<br />
              {pueblo?.nombre && <>{pueblo.nombre}<br /></>}
              {localidad && <>{localidad}<br /></>}
            </address>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Navigation className="size-4" />
              {t('getDirections')}
            </a>
          </div>

          <div className="lg:col-span-2 rounded-lg overflow-hidden border border-border h-[400px] lg:h-auto min-h-[400px]">
            <MapContainer
              center={[lat, lng]}
              zoom={15}
              style={{ width: '100%', height: '100%', minHeight: '400px' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <LeafletMarker position={[lat, lng]} />
            </MapContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
