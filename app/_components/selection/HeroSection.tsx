'use client'

import { MapPin, Star, ChevronDown } from 'lucide-react'
import type { HotelConfig } from './types'

interface Props {
  config: Pick<HotelConfig, 'name' | 'tagline' | 'location' | 'heroImage' | 'badges'>
}

export default function HeroSection({ config }: Props) {
  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* Ken Burns hero image */}
      <div className="absolute inset-0 animate-ken-burns">
        <img
          src={config.heroImage}
          alt={config.name}
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Bottom gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(26,26,26,0.96) 0%, rgba(26,26,26,0.5) 35%, transparent 65%, rgba(26,26,26,0.3) 100%)',
        }}
      />

      {/* Selection badge — top right */}
      <div className="absolute top-6 right-6 z-20">
        <div
          className="flex items-center gap-2 px-4 py-2"
          style={{
            border: '1px solid var(--hotel-gold)',
            background: 'rgba(26,26,26,0.85)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Star size={12} style={{ color: 'var(--hotel-gold)', fill: 'var(--hotel-gold)' }} />
          <span className="eyebrow" style={{ fontSize: '0.6rem', letterSpacing: '0.2em' }}>
            Club LPMBE Selection
          </span>
        </div>
      </div>

      {/* Hero content */}
      <div className="absolute inset-0 flex flex-col justify-end pb-16 px-8 md:px-16 lg:px-24 z-10">
        <div className="animate-fade-in-up max-w-4xl">
          {/* Location */}
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={14} style={{ color: 'var(--hotel-gold)' }} />
            <span
              className="font-sans text-xs tracking-widest uppercase"
              style={{ color: 'var(--hotel-ivory-dim)' }}
            >
              {config.location.village} · {config.location.region}
            </span>
          </div>

          {/* Hotel name */}
          <h1
            className="font-serif leading-none mb-3"
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
              color: 'var(--hotel-ivory)',
              letterSpacing: '-0.01em',
              fontWeight: 300,
            }}
          >
            {config.name}
          </h1>

          {/* Tagline */}
          <p
            className="font-serif italic mb-8"
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.35rem)',
              color: 'var(--hotel-ivory-dim)',
              letterSpacing: '0.02em',
            }}
          >
            {config.tagline}
          </p>

          {/* Award badges row */}
          <div className="flex flex-wrap gap-2">
            {config.badges.map((badge) => (
              <span
                key={badge.label}
                className="font-sans px-3 py-1"
                style={{
                  fontSize: '0.6rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  border: '1px solid var(--hotel-gold)',
                  color: 'var(--hotel-gold)',
                  background: 'rgba(201,169,110,0.08)',
                }}
              >
                {badge.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1">
        <span className="eyebrow" style={{ fontSize: '0.5rem', opacity: 0.5 }}>
          Scroll
        </span>
        <ChevronDown
          size={20}
          className="animate-chevron-bounce"
          style={{ color: 'var(--hotel-gold)', opacity: 0.7 }}
        />
      </div>
    </section>
  )
}
