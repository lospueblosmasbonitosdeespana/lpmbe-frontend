'use client'

import dynamic from 'next/dynamic'
import { Car, Bus, MapPin, ExternalLink } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import type { LocationConfig } from './comercio-config'

// Dynamically import the map to avoid SSR issues
const MapWithNoSSR = dynamic(() => import('./location-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] w-full items-center justify-center rounded-lg bg-muted">
      <span className="text-muted-foreground">Cargando mapa...</span>
    </div>
  ),
})

interface LocationSectionProps {
  config: LocationConfig
}

export function LocationSection({ config }: LocationSectionProps) {
  const directions = [
    { icon: Car, label: 'En coche', text: config.directions.car },
    {
      icon: Bus,
      label: 'En transporte público',
      text: config.directions.publicTransport,
    },
    { icon: MapPin, label: 'Aparcamiento', text: config.directions.parking },
  ]

  return (
    <section className="bg-secondary py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <span className="small-caps mb-4 inline-block text-sm font-medium tracking-wider text-accent">
            Dónde estamos
          </span>
          <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Ubicación
          </h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Map */}
          <div className="overflow-hidden rounded-lg">
            <MapWithNoSSR
              lat={config.coordinates.lat}
              lng={config.coordinates.lng}
            />
          </div>

          {/* Address and directions */}
          <div className="flex flex-col justify-center">
            {/* Address */}
            <address className="mb-8 not-italic">
              <p className="mb-2 font-serif text-2xl font-bold text-foreground md:text-3xl">
                {config.address}
              </p>
              <p className="text-lg text-muted-foreground">
                {config.comarca}, {config.provincia}
              </p>
            </address>

            {/* Directions */}
            <div className="mb-8 space-y-4">
              <h3 className="font-serif text-lg font-bold text-foreground">
                Cómo llegar
              </h3>
              {directions.map((dir, index) => (
                <div key={index} className="flex items-start gap-3">
                  <dir.icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                  <div>
                    <p className="font-medium text-foreground">{dir.label}</p>
                    <p className="text-sm text-muted-foreground">{dir.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Button
              asChild
              variant="outline"
              className="w-fit gap-2"
            >
              <a
                href={config.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir en Google Maps
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
