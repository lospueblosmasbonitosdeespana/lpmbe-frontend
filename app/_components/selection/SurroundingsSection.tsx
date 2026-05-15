'use client'

import { MapPin } from 'lucide-react'
import { useScrollReveal } from './useScrollReveal'
import type { HotelConfig } from './types'

interface Props {
  surroundings: HotelConfig['surroundings']
  location: HotelConfig['location']
}

export default function SurroundingsSection({ surroundings, location }: Props) {
  const ref = useScrollReveal()

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="reveal w-full py-24 md:py-32 px-8 md:px-16 lg:px-24"
      style={{ background: 'var(--hotel-charcoal)' }}
    >
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-12">
          <span className="eyebrow">Descubre el entorno</span>
          <div className="gold-line" />
          <h2
            className="font-serif mt-2"
            style={{
              fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
              color: 'var(--hotel-ivory)',
              fontWeight: 300,
            }}
          >
            El Pirineo a su alcance
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Map placeholder */}
          <div
            className="relative overflow-hidden"
            style={{
              minHeight: 420,
              background: 'var(--hotel-stone)',
              border: '1px solid rgba(201,169,110,0.15)',
            }}
          >
            {/* Stylized dark map */}
            <img
              src={surroundings[0]?.image || '/placeholder.svg?height=420&width=600'}
              alt="Entorno del hotel"
              className="w-full h-full object-cover opacity-60"
              style={{ minHeight: 420 }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, rgba(26,26,26,0.2), rgba(26,26,26,0.6))',
              }}
            />
            {/* Location pin */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div
                className="w-10 h-10 flex items-center justify-center"
                style={{
                  background: 'var(--hotel-gold)',
                  borderRadius: '50%',
                }}
              >
                <MapPin size={18} style={{ color: 'var(--hotel-charcoal)' }} />
              </div>
              <span
                className="font-sans"
                style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--hotel-ivory)',
                  background: 'rgba(26,26,26,0.8)',
                  padding: '6px 12px',
                }}
              >
                {location.village}
              </span>
            </div>
          </div>

          {/* POI list */}
          <div className="flex flex-col gap-4">
            {surroundings.map((poi, i) => (
              <div
                key={i}
                className="flex gap-4 p-5"
                style={{ border: '1px solid rgba(201,169,110,0.12)' }}
              >
                {/* Thumbnail */}
                <div
                  className="flex-shrink-0 overflow-hidden"
                  style={{ width: 72, height: 72 }}
                >
                  <img
                    src={poi.image}
                    alt={poi.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Info */}
                <div className="flex flex-col justify-center">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span
                      className="font-serif"
                      style={{
                        fontSize: '1rem',
                        color: 'var(--hotel-ivory)',
                        fontWeight: 400,
                      }}
                    >
                      {poi.name}
                    </span>
                    <span
                      className="font-sans flex-shrink-0"
                      style={{
                        fontSize: '0.58rem',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: 'var(--hotel-gold)',
                        opacity: 0.8,
                      }}
                    >
                      {poi.distance}
                    </span>
                  </div>
                  <p
                    className="font-sans leading-relaxed"
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--hotel-ivory-muted)',
                    }}
                  >
                    {poi.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
