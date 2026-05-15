'use client'

import { useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useScrollReveal } from './useScrollReveal'
import type { HotelConfig } from './types'

interface Props {
  press: HotelConfig['press']
}

export default function PressSection({ press }: Props) {
  const ref = useScrollReveal()
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' })
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="reveal w-full py-24 md:py-32"
      style={{
        background: 'var(--hotel-stone)',
        borderTop: '1px solid rgba(201,169,110,0.1)',
      }}
    >
      <div className="px-8 md:px-16 lg:px-24 mb-10 flex items-end justify-between">
        <div>
          <span className="eyebrow">En los medios</span>
          <div className="gold-line" />
          <h2
            className="font-serif mt-2"
            style={{
              fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
              color: 'var(--hotel-ivory)',
              fontWeight: 300,
            }}
          >
            Prensa internacional
          </h2>
        </div>
        <div className="hidden md:flex gap-3">
          <button
            onClick={scrollPrev}
            className="w-10 h-10 flex items-center justify-center"
            style={{ border: '1px solid rgba(201,169,110,0.35)', color: 'var(--hotel-gold)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,169,110,0.1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            aria-label="Anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={scrollNext}
            className="w-10 h-10 flex items-center justify-center"
            style={{ border: '1px solid rgba(201,169,110,0.35)', color: 'var(--hotel-gold)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,169,110,0.1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            aria-label="Siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div ref={emblaRef} className="overflow-hidden pl-8 md:pl-16 lg:pl-24">
        <div className="flex gap-4">
          {press.map((item, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[75vw] sm:w-[50vw] md:w-[35vw] lg:w-[26vw] p-8 flex flex-col justify-between"
              style={{
                border: '1px solid rgba(201,169,110,0.18)',
                background: 'rgba(201,169,110,0.02)',
                minHeight: 220,
              }}
            >
              {/* Outlet name */}
              <span
                className="font-serif block mb-5"
                style={{
                  fontSize: '1.1rem',
                  color: 'var(--hotel-gold)',
                  fontWeight: 400,
                  letterSpacing: '0.04em',
                }}
              >
                {item.outlet}
              </span>

              {/* Quote */}
              <p
                className="font-serif italic flex-1"
                style={{
                  fontSize: '0.95rem',
                  color: 'var(--hotel-ivory)',
                  fontWeight: 300,
                  lineHeight: 1.65,
                }}
              >
                &ldquo;{item.quote}&rdquo;
              </p>

              {/* Date */}
              <span
                className="font-sans block mt-6"
                style={{
                  fontSize: '0.6rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--hotel-ivory-muted)',
                }}
              >
                {item.date}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
