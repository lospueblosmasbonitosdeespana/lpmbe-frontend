'use client'

import {
  Clock, CreditCard, Globe, Baby, PawPrint, Accessibility,
  ShieldCheck, XCircle,
} from 'lucide-react'
import { useLodgingSlice } from './lodging-config-context'

const ICONS = {
  clock: Clock, 'x-circle': XCircle, 'credit-card': CreditCard,
  globe: Globe, baby: Baby, 'paw-print': PawPrint,
  shield: ShieldCheck, accessibility: Accessibility,
} as const

const DEFAULT_ITEMS = [
  { id: 'p1', icon: 'clock'        as const, label: 'Check-in / Check-out',     detail: 'Entrada: 15:00 – 21:00 h · Salida: hasta las 12:00 h · Early check-in bajo petición' },
  { id: 'p2', icon: 'x-circle'     as const, label: 'Política de cancelación',  detail: 'Cancelación gratuita hasta 72 h antes. Reservas no reembolsables con descuento del 15 %.' },
  { id: 'p3', icon: 'credit-card'  as const, label: 'Formas de pago',           detail: 'Tarjeta de crédito/débito, Bizum y efectivo. No se acepta American Express.' },
  { id: 'p4', icon: 'globe'        as const, label: 'Idiomas',                  detail: 'Español · Inglés · Francés · Aragonés' },
  { id: 'p5', icon: 'baby'         as const, label: 'Política de niños',        detail: 'Se admiten niños de todas las edades. Cuna disponible sin cargo (bajo reserva). Menú infantil.' },
  { id: 'p6', icon: 'paw-print'    as const, label: 'Mascotas',                 detail: 'Se admiten mascotas pequeñas (hasta 10 kg). Suplemento de 15 €/noche. Deben estar vacunadas.' },
  { id: 'p7', icon: 'shield'       as const, label: 'Medidas sanitarias',       detail: 'Alojamiento con protocolo de limpieza reforzado. Certificado de calidad turística aragonesa.' },
  { id: 'p8', icon: 'accessibility'as const, label: 'Accesibilidad',            detail: 'Planta baja accesible. Rampa de acceso. Dos habitaciones adaptadas disponibles.' },
]

export default function PracticalInfo() {
  const slice = useLodgingSlice('practicalInfo')
  const infoItems = slice?.items && slice.items.length > 0 ? slice.items : DEFAULT_ITEMS
  return (
    <section
      className="py-20 md:py-28 px-6 md:px-14 lg:px-20"
      style={{ background: 'var(--color-stone)' }}
      aria-labelledby="practical-heading"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: 'var(--color-terracotta)' }}
          >
            Información práctica
          </p>
          <h2
            id="practical-heading"
            className="font-serif text-3xl md:text-4xl font-bold text-balance"
            style={{ color: 'var(--color-midnight)' }}
          >
            Todo lo que necesitas saber<br className="hidden md:block" /> antes de llegar
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {infoItems.map((item) => {
            const Icon = ICONS[item.icon as keyof typeof ICONS] ?? Clock
            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 p-5 rounded-xl"
                style={{
                  background: '#fff',
                  border: '1px solid oklch(0.90 0.005 80)',
                  boxShadow: '0 1px 6px oklch(0.22 0.05 250 / 0.05)',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
                    style={{ background: 'oklch(0.62 0.12 45 / 0.12)' }}
                  >
                    <Icon size={15} style={{ color: 'var(--color-terracotta)' }} />
                  </div>
                  <p
                    className="font-semibold text-sm"
                    style={{ color: 'var(--color-midnight)' }}
                  >
                    {item.label}
                  </p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'oklch(0.45 0.02 250)' }}>
                  {item.detail}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export { PracticalInfo }
