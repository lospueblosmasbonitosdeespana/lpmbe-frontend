'use client'

import { Waves, Heart, Sparkles, Wind, ArrowRight } from 'lucide-react'
import { useScrollReveal } from './useScrollReveal'
import type { HotelConfig } from './types'

const SPA_ICONS: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  Waves,
  Heart,
  Sparkles,
  Wind,
}

interface Props {
  spa: HotelConfig['spa']
}

export default function SpaSection({ spa }: Props) {
  const ref = useScrollReveal()

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="reveal relative w-full min-h-[70vh] flex items-center justify-center overflow-hidden"
    >
      {/* Full-width atmospheric image */}
      <img
        src={spa.image}
        alt="Spa y bienestar"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(26,26,26,0.78)' }}
      />

      <div className="relative z-10 w-full max-w-screen-xl mx-auto px-8 md:px-16 lg:px-24 py-28">
        {/* Text center */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <span className="eyebrow">Bienestar</span>
          <div className="gold-line mx-auto" />
          <h2
            className="font-serif mt-2 mb-6 text-balance"
            style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 3rem)',
              color: 'var(--hotel-ivory)',
              fontWeight: 300,
              letterSpacing: '-0.01em',
            }}
          >
            {spa.title}
          </h2>
          <p
            className="font-sans leading-relaxed"
            style={{
              fontSize: '0.9rem',
              color: 'var(--hotel-ivory-dim)',
              lineHeight: 1.85,
            }}
          >
            {spa.description}
          </p>
        </div>

        {/* Treatment highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {spa.treatments.map((t, i) => {
            const Icon = SPA_ICONS[t.icon] || Waves
            return (
              <div
                key={i}
                className="flex flex-col items-center text-center p-6"
                style={{
                  background: 'rgba(26,26,26,0.7)',
                  border: '1px solid rgba(201,169,110,0.2)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Icon size={22} style={{ color: 'var(--hotel-gold)', marginBottom: 12 }} />
                <span
                  className="font-serif block mb-2"
                  style={{
                    fontSize: '1rem',
                    color: 'var(--hotel-ivory)',
                    fontWeight: 400,
                  }}
                >
                  {t.name}
                </span>
                <p
                  className="font-sans"
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--hotel-ivory-muted)',
                    lineHeight: 1.6,
                  }}
                >
                  {t.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <button
            className="flex items-center gap-3 font-sans transition-all"
            style={{
              fontSize: '0.68rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--hotel-gold)',
              border: '1px solid rgba(201,169,110,0.5)',
              padding: '0.85rem 2rem',
              background: 'rgba(26,26,26,0.7)',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(201,169,110,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(26,26,26,0.7)'
            }}
          >
            Descubrir el spa
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  )
}
