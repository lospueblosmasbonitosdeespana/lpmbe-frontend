'use client'

import {
  BedDouble,
  Calendar,
  UtensilsCrossed,
  Waves,
  Star,
  Droplets,
} from 'lucide-react'
import type { HotelConfig } from './types'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  BedDouble,
  Calendar,
  UtensilsCrossed,
  Waves,
  Star,
  Droplets,
}

interface Props {
  stats: HotelConfig['stats']
}

export default function StatsBar({ stats }: Props) {
  return (
    <div
      className="w-full py-0"
      style={{ background: 'var(--hotel-stone)', borderBottom: '1px solid rgba(201,169,110,0.1)' }}
    >
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-wrap md:flex-nowrap divide-y md:divide-y-0 md:divide-x"
          style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
          {stats.map((stat, i) => {
            const Icon = ICON_MAP[stat.icon] || Star
            return (
              <div
                key={i}
                className="flex-1 min-w-[50%] md:min-w-0 flex flex-col items-center justify-center gap-2 py-6 px-4"
                style={{
                  borderColor: 'rgba(201,169,110,0.15)',
                }}
              >
                <Icon size={16} style={{ color: 'var(--hotel-gold)', opacity: 0.8 }} />
                <span
                  className="font-serif"
                  style={{
                    fontSize: '1.25rem',
                    color: 'var(--hotel-ivory)',
                    fontWeight: 300,
                    letterSpacing: '0.02em',
                  }}
                >
                  {stat.value}
                </span>
                <span
                  className="font-sans text-center"
                  style={{
                    fontSize: '0.6rem',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--hotel-ivory-muted)',
                  }}
                >
                  {stat.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
