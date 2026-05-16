'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { MapPin, Car, Bus, Accessibility } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const LeafletMarker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });

interface AccessCard {
  icon: 'car' | 'bus' | 'accessibility';
  title: string;
  text: string;
}

const ACCESS_ICONS: Record<AccessCard['icon'], LucideIcon> = {
  car: Car,
  bus: Bus,
  accessibility: Accessibility,
};

interface Props {
  eyebrow: string;
  title: string;
  nombre: string;
  direccionLineas: string[];
  telefono?: string | null;
  email?: string | null;
  lat: number;
  lng: number;
  comoLlegarLabel: string;
  accessCards?: AccessCard[];
}

export default function RestauranteContactoUbicacion({
  eyebrow,
  title,
  nombre,
  direccionLineas,
  telefono,
  email,
  lat,
  lng,
  comoLlegarLabel,
  accessCards,
}: Props) {
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
      mapRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10">
          <p className="text-gold uppercase tracking-[0.2em] text-xs font-semibold mb-3">
            {eyebrow}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-foreground text-balance">{title}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border border-border bg-card p-6 flex flex-col justify-between">
            <div>
              <div className="size-10 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                <MapPin className="size-5 text-gold" />
              </div>
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
                {comoLlegarLabel}
              </p>
              <address className="not-italic text-foreground leading-relaxed">
                <p className="font-semibold text-base mb-1">{nombre}</p>
                {direccionLineas.map((linea, i) => (
                  <p key={i}>{linea}</p>
                ))}
              </address>
            </div>
            <div className="mt-6 space-y-2">
              {telefono && (
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground">Tel: </span>
                  <a href={`tel:${telefono}`} className="hover:text-gold transition-colors">
                    {telefono}
                  </a>
                </p>
              )}
              {email && (
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground">Email: </span>
                  <a href={`mailto:${email}`} className="hover:text-gold transition-colors break-all">
                    {email}
                  </a>
                </p>
              )}
              <Button
                variant="outline"
                asChild
                className="w-full mt-4 rounded-lg border-border hover:border-gold/40 hover:text-gold"
              >
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                  {comoLlegarLabel}
                </a>
              </Button>
            </div>
          </Card>

          <div className="md:col-span-2 rounded-2xl overflow-hidden border border-border" style={{ height: 400 }}>
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

        {accessCards && accessCards.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6">
            {accessCards.map((card, i) => {
              const Icon = ACCESS_ICONS[card.icon] ?? Car;
              return (
                <div key={i} className="flex gap-4">
                  <div className="size-9 rounded-full bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="size-4 text-gold" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground mb-1">{card.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{card.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
