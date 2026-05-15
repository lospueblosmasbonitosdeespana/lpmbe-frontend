'use client'

import { Clock, Star } from 'lucide-react'
import { useScrollReveal } from './useScrollReveal'
import type { HotelConfig } from './types'

interface Props {
  experiences: HotelConfig['experiences']
}

export default function ExperiencesSection({ experiences }: Props) {
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
          <span className="eyebrow">Experiencias</span>
          <div className="gold-line" />
          <h2
            className="font-serif mt-2"
            style={{
              fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
              color: 'var(--hotel-ivory)',
              fontWeight: 300,
            }}
          >
            Vivir el Pirineo
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {experiences.map((exp, i) => (
            <div
              key={i}
              className="group relative overflow-hidden cursor-pointer"
              style={{ aspectRatio: '4/3' }}
            >
              {/* Background image */}
              <img
                src={exp.image}
                alt={exp.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Dark overlay */}
              <div
                className="absolute inset-0 transition-opacity duration-400"
                style={{
                  background:
                    'linear-gradient(to top, rgba(26,26,26,0.9) 0%, rgba(26,26,26,0.3) 50%, transparent 100%)',
                }}
              />

              {/* Exclusive badge */}
              {exp.exclusive && (
                <div
                  className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1"
                  style={{
                    background: 'rgba(26,26,26,0.85)',
                    border: '1px solid var(--hotel-gold)',
                  }}
                >
                  <Star size={9} style={{ color: 'var(--hotel-gold)', fill: 'var(--hotel-gold)' }} />
                  <span
                    className="font-sans"
                    style={{
                      fontSize: '0.52rem',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: 'var(--hotel-gold)',
                    }}
                  >
                    Exclusivo
                  </span>
                </div>
              )}

              {/* Bottom text */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3
                  className="font-serif mb-2"
                  style={{
                    fontSize: '1.2rem',
                    color: 'var(--hotel-ivory)',
                    fontWeight: 400,
                    lineHeight: 1.2,
                  }}
                >
                  {exp.title}
                </h3>
                <p
                  className="font-sans mb-3"
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--hotel-ivory-dim)',
                    lineHeight: 1.5,
                  }}
                >
                  {exp.description}
                </p>
                <div className="flex items-center gap-2">
                  <Clock size={11} style={{ color: 'var(--hotel-gold)' }} />
                  <span
                    className="font-sans"
                    style={{
                      fontSize: '0.6rem',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: 'var(--hotel-gold)',
                    }}
                  >
                    {exp.duration}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
