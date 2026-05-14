'use client'

import { Clock, BedDouble, Banknote, Star, CalendarCheck, Mountain, Users } from 'lucide-react'
import { useLodgingSlice } from './lodging-config-context'

const ICONS = {
  clock: Clock,
  bed: BedDouble,
  banknote: Banknote,
  star: Star,
  calendar: CalendarCheck,
  mountain: Mountain,
  users: Users,
} as const

const DEFAULT_STATS = [
  { id: 'd1', icon: 'clock'    as const, label: 'Check-in / Check-out', value: '15:00 — 12:00' },
  { id: 'd2', icon: 'bed'      as const, label: 'Habitaciones',          value: '8 estancias'   },
  { id: 'd3', icon: 'banknote' as const, label: 'Desde',                 value: '120 €/noche'   },
  { id: 'd4', icon: 'star'     as const, label: 'Valoración media',      value: '4.8 / 5'       },
  { id: 'd5', icon: 'calendar' as const, label: 'Renovado',              value: '2019'          },
]

export default function QuickStats() {
  const slice = useLodgingSlice('quickStats')
  const stats = slice?.items && slice.items.length > 0 ? slice.items : DEFAULT_STATS
  return (
    <section aria-label="Datos rápidos del alojamiento">
      <div
        className="mx-auto px-4 py-0"
        style={{ maxWidth: '1200px' }}
      >
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-x divide-y lg:divide-y-0"
          style={{
            background: '#fff',
            border: '1px solid oklch(0.90 0.005 80)',
            borderRadius: '0 0 12px 12px',
            boxShadow: '0 4px 24px oklch(0.22 0.05 250 / 0.08)',
          }}
        >
          {stats.map((stat, i) => {
            const Icon = ICONS[stat.icon as keyof typeof ICONS] ?? Clock
            return (
              <div
                key={i}
                className="flex flex-col items-center justify-center gap-2 py-5 px-4 text-center"
              >
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-full"
                  style={{ background: 'oklch(0.62 0.12 45 / 0.12)' }}
                >
                  <Icon size={17} style={{ color: 'var(--color-terracotta)' }} />
                </div>
                <p className="text-xs font-medium tracking-wide uppercase" style={{ color: 'oklch(0.45 0.02 250)' }}>
                  {stat.label}
                </p>
                <p className="font-serif font-semibold text-base" style={{ color: 'var(--color-midnight)' }}>
                  {stat.value}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export { QuickStats }
