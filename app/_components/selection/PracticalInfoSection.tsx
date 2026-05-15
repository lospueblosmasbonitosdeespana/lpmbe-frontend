'use client'

import {
  Clock,
  Globe,
  Car,
  PawPrint,
  Accessibility,
  Wifi,
  Key,
  ShieldCheck,
  Languages,
} from 'lucide-react'
import { useScrollReveal } from './useScrollReveal'
import type { HotelConfig } from './types'

const INFO_ICONS: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  Clock,
  Globe,
  Car,
  PawPrint,
  Accessibility,
  Wifi,
  Key,
  ShieldCheck,
  Languages,
}

interface Props {
  info: HotelConfig['practicalInfo']
}

export default function PracticalInfoSection({ info }: Props) {
  const ref = useScrollReveal()

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="reveal w-full py-24 md:py-32 px-8 md:px-16 lg:px-24"
      style={{ background: 'var(--hotel-charcoal)' }}
    >
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-12">
          <span className="eyebrow">Información práctica</span>
          <div className="gold-line" />
          <h2
            className="font-serif mt-2"
            style={{
              fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
              color: 'var(--hotel-ivory)',
              fontWeight: 300,
            }}
          >
            Todo lo que necesita saber
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px"
          style={{ border: '1px solid rgba(201,169,110,0.12)', background: 'rgba(201,169,110,0.12)' }}>
          {info.map((item, i) => {
            const Icon = INFO_ICONS[item.icon] || Clock
            return (
              <div
                key={i}
                className="flex items-start gap-4 p-6"
                style={{ background: 'var(--hotel-charcoal)' }}
              >
                <Icon size={18} style={{ color: 'var(--hotel-gold)', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <span
                    className="font-sans block mb-1"
                    style={{
                      fontSize: '0.6rem',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'var(--hotel-ivory-muted)',
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    className="font-sans"
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--hotel-ivory)',
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
