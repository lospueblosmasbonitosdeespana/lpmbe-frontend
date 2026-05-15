'use client'

import { Star } from 'lucide-react'
import { useScrollReveal } from './useScrollReveal'
import type { HotelConfig } from './types'

interface Props {
  reviews: HotelConfig['reviews']
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          style={{
            color: 'var(--hotel-gold)',
            fill: i < Math.round(rating) ? 'var(--hotel-gold)' : 'transparent',
          }}
        />
      ))}
    </div>
  )
}

export default function ReviewsSection({ reviews }: Props) {
  const ref = useScrollReveal()

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="reveal w-full py-24 md:py-32 px-8 md:px-16 lg:px-24"
      style={{
        background: 'var(--hotel-stone)',
        borderTop: '1px solid rgba(201,169,110,0.1)',
      }}
    >
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-12">
          <span className="eyebrow">Opiniones</span>
          <div className="gold-line" />
        </div>

        {/* Overall rating */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-16 pb-12"
          style={{ borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
          <div>
            <span
              className="font-serif block"
              style={{
                fontSize: '5rem',
                color: 'var(--hotel-ivory)',
                fontWeight: 300,
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {reviews.overall.toFixed(1)}
            </span>
            <StarRating rating={reviews.overall} />
            <span
              className="font-sans block mt-2"
              style={{
                fontSize: '0.62rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--hotel-ivory-muted)',
              }}
            >
              {reviews.count.toLocaleString('es-ES')} reseñas verificadas
            </span>
          </div>
          <div
            className="hidden md:block self-stretch"
            style={{ width: 1, background: 'rgba(201,169,110,0.2)' }}
          />
          <p
            className="font-serif italic"
            style={{
              fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
              color: 'var(--hotel-ivory)',
              fontWeight: 300,
              lineHeight: 1.5,
              maxWidth: 480,
            }}
          >
            &ldquo;Una experiencia que transciende lo ordinario. Palacio de Cristal es, simplemente, extraordinario.&rdquo;
          </p>
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reviews.items.map((review, i) => (
            <div
              key={i}
              className="p-8 flex flex-col"
              style={{ border: '1px solid rgba(201,169,110,0.15)' }}
            >
              <StarRating rating={5} />
              <p
                className="font-serif italic flex-1 mt-5 mb-6"
                style={{
                  fontSize: '0.95rem',
                  color: 'var(--hotel-ivory)',
                  fontWeight: 300,
                  lineHeight: 1.7,
                }}
              >
                &ldquo;{review.quote}&rdquo;
              </p>
              <div
                className="pt-5 flex justify-between items-end"
                style={{ borderTop: '1px solid rgba(201,169,110,0.12)' }}
              >
                <div>
                  <span
                    className="font-sans block"
                    style={{ fontSize: '0.8rem', color: 'var(--hotel-ivory)' }}
                  >
                    {review.author}
                  </span>
                  <span
                    className="font-sans"
                    style={{
                      fontSize: '0.62rem',
                      letterSpacing: '0.12em',
                      color: 'var(--hotel-ivory-muted)',
                    }}
                  >
                    {review.origin}
                  </span>
                </div>
                <span
                  className="font-sans"
                  style={{
                    fontSize: '0.6rem',
                    letterSpacing: '0.12em',
                    color: 'var(--hotel-ivory-muted)',
                  }}
                >
                  {review.date}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
