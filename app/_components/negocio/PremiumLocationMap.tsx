'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const LeafletMarker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });

interface AccessInfo {
  label: string;
  detail: string;
}

interface Props {
  lat: number;
  lng: number;
  nombre: string;
  pueblo?: { id: number; nombre: string; slug: string } | null;
  localidad?: string | null;
  accessInfo?: AccessInfo[];
  t: (key: string) => string;
}

export default function PremiumLocationMap({ lat, lng, nombre, pueblo, localidad, accessInfo, t }: Props) {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const mapRef = useRef<any>(null);
  const [markerIcon, setMarkerIcon] = useState<any>(undefined);

  useEffect(() => {
    import('leaflet').then((L) => {
      import('@/lib/leaflet-div-icons').then(({ createNegocioDivIcon }) => {
        setMarkerIcon(createNegocioDivIcon(L));
      });
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, []);

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

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-card rounded-lg border border-border p-8">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-6">
              <MapPin className="size-6 text-primary" />
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

          <div className="lg:col-span-2 rounded-lg overflow-hidden border border-border" style={{ height: 400 }}>
            <MapContainer
              center={[lat, lng]}
              zoom={15}
              style={{ width: '100%', height: '100%' }}
              scrollWheelZoom={false}
              ref={mapRef as any}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {markerIcon && <LeafletMarker position={[lat, lng]} icon={markerIcon} />}
            </MapContainer>
          </div>
        </div>

        {accessInfo && accessInfo.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {accessInfo.map((info, i) => (
              <div key={i}>
                <p className="text-gold text-sm font-semibold tracking-wide mb-1.5">
                  {info.label}
                </p>
                <p className="text-muted-foreground text-sm">
                  {info.detail}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
