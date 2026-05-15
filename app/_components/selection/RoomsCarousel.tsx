'use client'

import { useCallback, useEffect, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { useScrollReveal } from './useScrollReveal'
import type { HotelConfig } from './types'

interface Props {
  rooms: HotelConfig['rooms']
}

export default function RoomsCarousel({ rooms }: Props) {
  const sectionRef = useScrollReveal()
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    skipSnaps: false,
  })

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="reveal w-full py-24 md:py-32"
      style={{ background: 'var(--hotel-charcoal)' }}
    >
      {/* Header */}
      <div className="px-8 md:px-16 lg:px-24 mb-12 flex items-end justify-between">
        <div>
          <span className="eyebrow">Alojamiento</span>
          <div className="gold-line" />
          <h2
            className="font-serif mt-2"
            style={{
              fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
              color: 'var(--hotel-ivory)',
              fontWeight: 300,
              letterSpacing: '-0.01em',
            }}
          >
            Suites y habitaciones
          </h2>
        </div>
        {/* Navigation arrows */}
        <div className="hidden md:flex gap-3">
          <button
            onClick={scrollPrev}
            className="w-10 h-10 flex items-center justify-center transition-colors"
            style={{
              border: '1px solid rgba(201,169,110,0.35)',
              color: 'var(--hotel-gold)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(201,169,110,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
            aria-label="Anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={scrollNext}
            className="w-10 h-10 flex items-center justify-center transition-colors"
            style={{
              border: '1px solid rgba(201,169,110,0.35)',
              color: 'var(--hotel-gold)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(201,169,110,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
            aria-label="Siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div ref={emblaRef} className="overflow-hidden pl-8 md:pl-16 lg:pl-24">
        <div className="flex gap-4">
          {rooms.map((room, i) => (
            <div
              key={i}
              className="group flex-shrink-0 w-[80vw] sm:w-[55vw] md:w-[40vw] lg:w-[30vw] cursor-pointer"
            >
              {/* Photo */}
              <div
                className="overflow-hidden mb-5"
                style={{ aspectRatio: '16/10' }}
              >
                <img
                  src={room.image}
                  alt={room.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              {/* Info */}
              <div className="pr-4">
                <div className="flex items-start justify-between mb-2">
                  <h3
                    className="font-serif"
                    style={{
                      fontSize: '1.2rem',
                      color: 'var(--hotel-ivory)',
                      fontWeight: 400,
                      lineHeight: 1.2,
                    }}
                  >
                    {room.name}
                  </h3>
                  <span
                    className="font-sans flex-shrink-0 ml-4"
                    style={{
                      fontSize: '0.65rem',
                      color: 'var(--hotel-ivory-muted)',
                      letterSpacing: '0.1em',
                      marginTop: 4,
                    }}
                  >
                    {room.size}
                  </span>
                </div>

                {/* Amenity pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {room.amenities.map((a) => (
                    <span
                      key={a}
                      className="font-sans px-2 py-0.5"
                      style={{
                        fontSize: '0.58rem',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        border: '1px solid rgba(201,169,110,0.2)',
                        color: 'var(--hotel-ivory-muted)',
                      }}
                    >
                      {a}
                    </span>
                  ))}
                </div>

                <span
                  className="font-sans"
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--hotel-gold)',
                    letterSpacing: '0.05em',
                  }}
                >
                  {room.priceFrom}
                </span>
              </div>
            </div>
          ))}

          {/* CTA card at the end */}
          <div className="flex-shrink-0 w-[80vw] sm:w-[55vw] md:w-[40vw] lg:w-[30vw] flex items-center justify-center pr-8 md:pr-16 lg:pr-24">
            <button
              className="group/btn flex items-center gap-3 font-sans transition-all"
              style={{
                fontSize: '0.72rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--hotel-gold)',
                border: '1px solid rgba(201,169,110,0.35)',
                padding: '1rem 1.75rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(201,169,110,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              Ver todas las habitaciones
              <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
