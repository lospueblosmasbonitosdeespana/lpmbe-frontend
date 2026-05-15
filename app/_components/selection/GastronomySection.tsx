'use client'

import { Star, ArrowRight } from 'lucide-react'
import { useScrollReveal } from './useScrollReveal'
import type { HotelConfig } from './types'

interface Props {
  gastronomy: HotelConfig['gastronomy']
}

export default function GastronomySection({ gastronomy }: Props) {
  const ref = useScrollReveal()

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="reveal w-full"
      style={{ background: 'var(--hotel-stone)' }}
    >
      <div className="flex flex-col md:flex-row min-h-[600px]">
        {/* Full-bleed photo — 60% */}
        <div className="relative md:w-[60%] min-h-[400px] md:min-h-0 overflow-hidden">
          <img
            src={gastronomy.image}
            alt={gastronomy.restaurantName}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Michelin badge */}
          {gastronomy.michelinStar && (
            <div
              className="absolute bottom-6 left-6 flex items-center gap-2 px-4 py-2"
              style={{
                background: 'rgba(26,26,26,0.9)',
                border: '1px solid var(--hotel-gold)',
              }}
            >
              <Star size={12} style={{ color: 'var(--hotel-gold)', fill: 'var(--hotel-gold)' }} />
              <span
                className="font-sans"
                style={{
                  fontSize: '0.6rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--hotel-gold)',
                }}
              >
                1 Estrella Michelin
              </span>
            </div>
          )}
        </div>

        {/* Content — 40% */}
        <div className="md:w-[40%] flex flex-col justify-center px-10 md:px-14 py-16 md:py-20">
          <span className="eyebrow mb-4">{gastronomy.eyebrow}</span>
          <div className="gold-line" />

          <h2
            className="font-serif mt-2 mb-4 text-balance"
            style={{
              fontSize: 'clamp(1.6rem, 2.8vw, 2.4rem)',
              color: 'var(--hotel-ivory)',
              fontWeight: 300,
              lineHeight: 1.2,
            }}
          >
            {gastronomy.restaurantName}
          </h2>

          <p
            className="font-sans mb-8 leading-relaxed"
            style={{
              fontSize: '0.88rem',
              color: 'var(--hotel-ivory-dim)',
              lineHeight: 1.8,
            }}
          >
            {gastronomy.description}
          </p>

          {/* Chef */}
          <div className="flex items-center gap-4 mb-8 pb-8"
            style={{ borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
            <div
              className="w-12 h-12 overflow-hidden flex-shrink-0"
              style={{ border: '1px solid rgba(201,169,110,0.3)' }}
            >
              <img
                src={gastronomy.chefImage}
                alt={gastronomy.chefName}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div>
              <span
                className="font-serif block"
                style={{ fontSize: '0.95rem', color: 'var(--hotel-ivory)' }}
              >
                {gastronomy.chefName}
              </span>
              <span
                className="font-sans"
                style={{
                  fontSize: '0.62rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--hotel-gold)',
                  opacity: 0.8,
                }}
              >
                {gastronomy.chefTitle}
              </span>
            </div>
          </div>

          {/* Signature dishes */}
          <div className="mb-10">
            <span
              className="font-sans block mb-4"
              style={{
                fontSize: '0.58rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--hotel-ivory-muted)',
              }}
            >
              Platos de autor
            </span>
            <ul className="flex flex-col gap-3">
              {gastronomy.dishes.map((dish, i) => (
                <li
                  key={i}
                  className="font-serif flex items-center gap-3"
                  style={{
                    fontSize: '1rem',
                    color: 'var(--hotel-ivory)',
                    fontWeight: 300,
                    fontStyle: 'italic',
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      height: 1,
                      background: 'var(--hotel-gold)',
                      opacity: 0.5,
                      flexShrink: 0,
                      display: 'inline-block',
                    }}
                  />
                  {dish}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <button
            className="self-start flex items-center gap-3 font-sans transition-all"
            style={{
              fontSize: '0.68rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--hotel-charcoal)',
              background: 'var(--hotel-gold)',
              padding: '0.85rem 1.75rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--hotel-gold-light)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--hotel-gold)'
            }}
          >
            Reservar mesa
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  )
}
