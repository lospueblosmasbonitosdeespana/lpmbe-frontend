'use client'

import Image from 'next/image'
import { Leaf, Coffee, Wheat, Egg, Beef } from 'lucide-react'
import { useLodgingSlice } from './lodging-config-context'

const ICONS = { leaf: Leaf, coffee: Coffee, wheat: Wheat, egg: Egg, cheese: Beef } as const

const DEFAULT_HIGHLIGHTS = [
  { id: 'h1', icon: 'leaf'   as const, text: 'Miel artesana del Sobrarbe y mermeladas caseras de temporada' },
  { id: 'h2', icon: 'coffee' as const, text: 'Café de especialidad de tueste local y infusiones de hierbas pirenaicas' },
  { id: 'h3', icon: 'wheat'  as const, text: 'Pan de masa madre horneado a diario con harina de espelta ecológica' },
]

export default function BreakfastSection() {
  const slice = useLodgingSlice('breakfast')
  const eyebrow = slice?.eyebrow || 'Gastronomía'
  const title = slice?.title || 'Un desayuno que es ya una experiencia en sí misma'
  const description = slice?.description || 'Cada mañana el comedor de vigas del siglo XVIII se convierte en un mercado de proximidad. Los productos viajan pocos kilómetros: los huevos llegan de la granja de Broto, el queso del Ager de Isábena y el jamón de cerdo negro de Benasque. Desayunar en la Posada no es solo comer — es entender el territorio.'
  const schedule = slice?.schedule || 'Desayuno incluido · 8:00 — 10:30 h'
  const highlights = slice?.highlights && slice.highlights.length > 0 ? slice.highlights : DEFAULT_HIGHLIGHTS
  const note = slice?.note || 'También disponible: media pensión (cena incluida) · Consulta con recepción.'
  return (
    <section
      className="py-20 md:py-28 px-6 md:px-14 lg:px-20"
      style={{ background: 'var(--color-cream)' }}
      aria-labelledby="breakfast-heading"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        {/* Image */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
          <Image
            src="/images/breakfast.jpg"
            alt="Mesa de desayuno con productos locales del Sobrarbe"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 90vw, 50vw"
          />
          {/* Subtle label */}
          <div
            className="absolute bottom-4 left-4 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'oklch(0.22 0.05 250 / 0.75)', backdropFilter: 'blur(8px)' }}
          >
            {schedule}
          </div>
        </div>

        {/* Text */}
        <div>
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: 'var(--color-terracotta)' }}
          >
            {eyebrow}
          </p>
          <h2
            id="breakfast-heading"
            className="font-serif text-3xl md:text-4xl font-bold leading-snug text-balance mb-5"
            style={{ color: 'var(--color-midnight)' }}
          >
            {title}
          </h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: 'oklch(0.40 0.02 250)' }}>
            {description}
          </p>

          {/* Highlights */}
          <ul className="space-y-4 mb-8">
            {highlights.map((h) => {
              const Icon = ICONS[h.icon as keyof typeof ICONS] ?? Leaf
              return (
                <li key={h.id} className="flex items-start gap-3">
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-0.5"
                    style={{ background: 'oklch(0.62 0.12 45 / 0.14)' }}
                  >
                    <Icon size={15} style={{ color: 'var(--color-terracotta)' }} />
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.38 0.02 250)' }}>{h.text}</p>
                </li>
              )
            })}
          </ul>

          {note && (
            <p className="text-xs italic" style={{ color: 'oklch(0.55 0.02 250)' }}>
              {note}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export { BreakfastSection }
