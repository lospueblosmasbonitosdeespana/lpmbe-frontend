'use client'

import { useScrollReveal } from './useScrollReveal'
import type { HotelConfig } from './types'

interface Props {
  story: HotelConfig['story']
}

export default function EditorialStory({ story }: Props) {
  const ref = useScrollReveal()

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="reveal w-full py-24 md:py-32 px-8 md:px-16 lg:px-24"
      style={{ background: 'var(--hotel-charcoal)' }}
    >
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-20 items-start">
        {/* Portrait image — 2 cols */}
        <div className="md:col-span-2">
          <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
            <img
              src={story.image}
              alt="La historia del hotel"
              className="w-full h-full object-cover"
            />
            {/* Subtle gold frame inset */}
            <div
              className="absolute inset-3 pointer-events-none"
              style={{ border: '1px solid rgba(201,169,110,0.2)' }}
            />
          </div>
        </div>

        {/* Text — 3 cols */}
        <div className="md:col-span-3 flex flex-col justify-center pt-4">
          <span className="eyebrow mb-4">{story.eyebrow}</span>
          <div className="gold-line" />

          <h2
            className="font-serif mt-2 mb-8 text-balance"
            style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
              color: 'var(--hotel-ivory)',
              fontWeight: 300,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            {story.title}
          </h2>

          {story.paragraphs.map((para, i) => (
            <p
              key={i}
              className="font-sans mb-5 leading-relaxed"
              style={{
                fontSize: '0.9rem',
                color: 'var(--hotel-ivory-dim)',
                lineHeight: 1.85,
              }}
            >
              {para}
            </p>
          ))}

          {/* Pull quote */}
          <blockquote
            className="mt-6 pl-6"
            style={{ borderLeft: '2px solid var(--hotel-gold)' }}
          >
            <p
              className="font-serif italic"
              style={{
                fontSize: 'clamp(1.2rem, 2.2vw, 1.6rem)',
                color: 'var(--hotel-ivory)',
                fontWeight: 300,
                lineHeight: 1.4,
              }}
            >
              &ldquo;{story.pullQuote}&rdquo;
            </p>
          </blockquote>
        </div>
      </div>
    </section>
  )
}
