'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import type { HotelConfig } from './types'

interface Props {
  name: string
  location: HotelConfig['location']
}

export default function NavBar({ name, location }: Props) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? 'rgba(26,26,26,0.97)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(201,169,110,0.15)' : 'none',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}
    >
      <div className="max-w-screen-xl mx-auto px-8 py-4 flex items-center justify-between">
        {/* Hotel name */}
        <div>
          <span
            className="font-serif"
            style={{
              color: 'var(--hotel-ivory)',
              fontSize: '1.1rem',
              fontWeight: 300,
              letterSpacing: '0.08em',
              opacity: scrolled ? 1 : 0,
              transition: 'opacity 0.4s',
            }}
          >
            {name}
          </span>
          <span
            className="font-sans block"
            style={{
              fontSize: '0.55rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--hotel-ivory-muted)',
              opacity: scrolled ? 1 : 0,
              transition: 'opacity 0.4s 0.1s',
            }}
          >
            {location.village} · {location.region}
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {['Alojamiento', 'Gastronomía', 'Spa', 'Experiencias', 'Contacto'].map((item) => (
            <span
              key={item}
              className="font-sans cursor-pointer hover:opacity-100 transition-opacity"
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--hotel-ivory)',
                opacity: 0.65,
              }}
            >
              {item}
            </span>
          ))}
        </div>

        {/* Selection badge small */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5"
          style={{
            border: '1px solid rgba(201,169,110,0.5)',
            background: 'rgba(201,169,110,0.08)',
          }}
        >
          <Star size={9} style={{ color: 'var(--hotel-gold)', fill: 'var(--hotel-gold)' }} />
          <span className="eyebrow" style={{ fontSize: '0.5rem' }}>
            Selection
          </span>
        </div>
      </div>
    </nav>
  )
}
