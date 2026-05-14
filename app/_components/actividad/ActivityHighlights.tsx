'use client'

import { Mountain, Clock, Users, Award, MapPin, Calendar } from 'lucide-react'
import { useActivitySlice } from './activity-config-context'

const ICONS = { mountain: Mountain, clock: Clock, users: Users, award: Award, 'map-pin': MapPin, calendar: Calendar } as const

const DEFAULT_STATS = [
  { id: 's1', icon: 'mountain' as const, label: '15+',           detail: 'Rutas' },
  { id: 's2', icon: 'calendar' as const, label: 'Todo el año',   detail: 'Disponibilidad' },
  { id: 's3', icon: 'users'    as const, label: '2-12',          detail: 'Personas' },
  { id: 's4', icon: 'award'    as const, label: 'Certificados',  detail: 'Guías' },
  { id: 's5', icon: 'map-pin'  as const, label: 'Ordesa',        detail: 'y Monte Perdido' },
  { id: 's6', icon: 'clock'    as const, label: 'Desde 2008',    detail: 'Experiencia' },
]

export function ActivityHighlights() {
  const slice = useActivitySlice('highlights')
  const stats = slice?.items && slice.items.length > 0 ? slice.items : DEFAULT_STATS
  return (
    <section 
      className="py-8 overflow-x-auto"
      style={{ backgroundColor: 'var(--color-sand)' }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex gap-4 md:gap-6 pb-2 min-w-max md:min-w-0 md:flex-wrap md:justify-center">
          {stats.map((stat) => {
            const Icon = ICONS[stat.icon as keyof typeof ICONS] ?? Mountain
            return (
              <div
                key={stat.id}
                className="flex items-center gap-3 bg-white px-5 py-4 rounded-xl shadow-sm min-w-[160px]"
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'oklch(0.45 0.18 155 / 0.1)' }}
                >
                  <Icon 
                    className="w-5 h-5" 
                    style={{ color: 'var(--color-adventure)' }}
                  />
                </div>
                <div>
                  <p 
                    className="font-semibold text-sm"
                    style={{ color: 'var(--color-slate)' }}
                  >
                    {stat.label}
                  </p>
                  <p 
                    className="text-xs"
                    style={{ color: 'var(--color-slate)', opacity: 0.7 }}
                  >
                    {stat.detail}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default ActivityHighlights
