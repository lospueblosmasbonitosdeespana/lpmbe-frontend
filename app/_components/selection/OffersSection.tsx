'use client'

import { Star, ArrowRight } from 'lucide-react'
import { useScrollReveal } from './useScrollReveal'
import type { HotelConfig } from './types'

interface Props {
  offers: HotelConfig['offers']
}

export default function OffersSection({ offers }: Props) {
  const ref = useScrollReveal()

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="reveal w-full py-24 md:py-32 px-8 md:px-16 lg:px-24"
      style={{ background: 'var(--hotel-charcoal)' }}
    >
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="eyebrow">Ventajas Club LPMBE</span>
            <div className="gold-line" />
            <h2
              className="font-serif mt-2"
              style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                color: 'var(--hotel-ivory)',
                fontWeight: 300,
              }}
            >
              Ofertas exclusivas para socios
            </h2>
          </div>
          <button
            className="self-start flex items-center gap-2 font-sans"
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--hotel-gold)',
              border: '1px solid rgba(201,169,110,0.4)',
              padding: '0.7rem 1.5rem',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,169,110,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            Hazte socio del Club
            <ArrowRight size={12} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {offers.map((offer, i) => (
            <div
              key={i}
              className="relative p-8 flex flex-col"
              style={{
                border: '1px solid rgba(201,169,110,0.25)',
                background: 'rgba(201,169,110,0.03)',
              }}
            >
              {/* Selection badge */}
              <div
                className="absolute top-5 right-5 flex items-center gap-1 px-2 py-1"
                style={{
                  border: '1px solid rgba(201,169,110,0.4)',
                  background: 'rgba(201,169,110,0.08)',
                }}
              >
                <Star size={8} style={{ color: 'var(--hotel-gold)', fill: 'var(--hotel-gold)' }} />
                <span
                  className="font-sans"
                  style={{
                    fontSize: '0.5rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--hotel-gold)',
                  }}
                >
                  Selection
                </span>
              </div>

              {/* Discount */}
              <span
                className="font-serif block mb-3"
                style={{
                  fontSize: '2.5rem',
                  color: 'var(--hotel-gold)',
                  fontWeight: 300,
                  lineHeight: 1,
                }}
              >
                {offer.discount}
              </span>

              <h3
                className="font-serif mb-3"
                style={{
                  fontSize: '1.15rem',
                  color: 'var(--hotel-ivory)',
                  fontWeight: 400,
                  lineHeight: 1.3,
                }}
              >
                {offer.title}
              </h3>

              <p
                className="font-sans mb-5 flex-1 leading-relaxed"
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--hotel-ivory-dim)',
                  lineHeight: 1.7,
                }}
              >
                {offer.description}
              </p>

              <div
                className="pt-5 flex flex-col gap-2"
                style={{ borderTop: '1px solid rgba(201,169,110,0.15)' }}
              >
                <div className="flex justify-between items-baseline">
                  <span
                    className="font-sans"
                    style={{
                      fontSize: '0.6rem',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: 'var(--hotel-ivory-muted)',
                    }}
                  >
                    Válido hasta
                  </span>
                  <span
                    className="font-sans"
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--hotel-ivory)',
                    }}
                  >
                    {offer.validity}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span
                    className="font-sans"
                    style={{
                      fontSize: '0.6rem',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: 'var(--hotel-ivory-muted)',
                    }}
                  >
                    Desde
                  </span>
                  <span
                    className="font-serif"
                    style={{
                      fontSize: '1rem',
                      color: 'var(--hotel-gold)',
                    }}
                  >
                    {offer.priceFrom}
                  </span>
                </div>
              </div>

              <p
                className="font-sans mt-3"
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--hotel-ivory-muted)',
                  fontStyle: 'italic',
                }}
              >
                * {offer.conditions}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
