'use client'

import { Award, Star, Leaf, BookOpen } from 'lucide-react'
import { useScrollReveal } from './useScrollReveal'
import type { HotelConfig } from './types'

const AWARD_ICONS: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  Award,
  Star,
  Leaf,
  BookOpen,
}

interface Props {
  awards: HotelConfig['awards']
}

export default function AwardsSection({ awards }: Props) {
  const ref = useScrollReveal()

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="reveal w-full py-24 md:py-32 px-8 md:px-16 lg:px-24"
      style={{
        background: 'var(--hotel-stone)',
        borderTop: '1px solid rgba(201,169,110,0.1)',
        borderBottom: '1px solid rgba(201,169,110,0.1)',
      }}
    >
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-14 text-center">
          <span className="eyebrow">Reconocimientos</span>
          <div className="gold-line mx-auto" />
          <h2
            className="font-serif mt-2"
            style={{
              fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
              color: 'var(--hotel-ivory)',
              fontWeight: 300,
              letterSpacing: '-0.01em',
            }}
          >
            Excelencia reconocida
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {awards.map((award, i) => {
            const Icon = AWARD_ICONS[award.icon] || Award
            return (
              <div
                key={i}
                className="group flex flex-col items-center text-center p-8 transition-all duration-400 cursor-default"
                style={{
                  border: '1px solid rgba(201,169,110,0.2)',
                  background: 'rgba(201,169,110,0.03)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(201,169,110,0.07)'
                  e.currentTarget.style.borderColor = 'rgba(201,169,110,0.45)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(201,169,110,0.03)'
                  e.currentTarget.style.borderColor = 'rgba(201,169,110,0.2)'
                }}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center mb-5"
                  style={{ border: '1px solid rgba(201,169,110,0.3)' }}
                >
                  <Icon size={20} style={{ color: 'var(--hotel-gold)' }} />
                </div>

                <span
                  className="font-serif mb-1"
                  style={{
                    fontSize: '1.05rem',
                    color: 'var(--hotel-ivory)',
                    fontWeight: 400,
                    lineHeight: 1.3,
                  }}
                >
                  {award.name}
                </span>

                <span
                  className="font-sans mb-3"
                  style={{
                    fontSize: '0.65rem',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--hotel-gold)',
                    opacity: 0.8,
                  }}
                >
                  {award.year}
                </span>

                <p
                  className="font-sans leading-relaxed"
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--hotel-ivory-muted)',
                    lineHeight: 1.7,
                  }}
                >
                  {award.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
