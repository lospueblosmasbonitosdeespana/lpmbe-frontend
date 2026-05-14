'use client'

import { Gift, Percent, Sparkles, Crown, Wine, Star } from 'lucide-react'
import { useLodgingSlice } from './lodging-config-context'

const ICONS = { gift: Gift, percent: Percent, sparkles: Sparkles, crown: Crown, wine: Wine, star: Star } as const

const DEFAULT_OFFERS = [
  { id: 'o1', icon: 'gift'      as const, badge: 'Regalo',     isFeatured: true,  title: 'Bienvenida especial Club LPMBE',                description: 'Los miembros del Club reciben a su llegada una cesta de bienvenida con productos artesanos del Sobrarbe: vino, miel, queso y conservas locales.', conditions: 'Válido para todas las reservas directas. Sujeto a disponibilidad.' },
  { id: 'o2', icon: 'percent'   as const, badge: 'Descuento',  isFeatured: false, title: '10 % de descuento en tratamientos de spa',     description: 'Disfruta de todos nuestros rituales de bienestar con un descuento exclusivo para socios del Club LPMBE. Masajes, envolturas y circuito termal incluidos.', conditions: 'Descuento no acumulable con otras promociones. Reserva previa.' },
  { id: 'o3', icon: 'sparkles'  as const, badge: 'Experiencia',isFeatured: false, title: 'Cata privada de vinos del Somontano',           description: 'Sesión de maridaje exclusiva para miembros: dos horas con nuestro sumiller, tres D.O. del Pirineo y tabla de quesos artesanos.', conditions: 'Para grupos de hasta 4 personas. Disponible jueves y viernes.' },
]

export default function MemberOffers() {
  const slice = useLodgingSlice('memberOffers')
  const eyebrow = slice?.eyebrow || 'Exclusivo Club LPMBE'
  const title = slice?.title || 'Ventajas exclusivas para socios'
  const offers = slice?.offers && slice.offers.length > 0 ? slice.offers : DEFAULT_OFFERS
  return (
    <section
      className="py-20 md:py-28 px-6 md:px-14 lg:px-20"
      style={{ background: 'oklch(0.97 0.015 70)' }}
      aria-labelledby="offers-heading"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-3"
              style={{ color: 'oklch(0.52 0.12 60)' }}
            >
              {eyebrow}
            </p>
            <h2
              id="offers-heading"
              className="font-serif text-3xl md:text-4xl font-bold text-balance"
              style={{ color: 'oklch(0.28 0.06 45)' }}
            >
              {title}
            </h2>
          </div>
          <span
            className="inline-flex items-center gap-1.5 self-start md:self-auto px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'oklch(0.52 0.12 60)', color: '#fff' }}
          >
            <Star size={11} fill="currentColor" />
            Club LPMBE
          </span>
        </div>

        {/* Offer cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {offers.map((offer) => {
            const Icon = ICONS[offer.icon as keyof typeof ICONS] ?? Gift
            const featured = offer.isFeatured
            return (
              <article
                key={offer.id}
                className="relative flex flex-col gap-4 p-6 rounded-2xl overflow-hidden"
                style={{
                  background: featured ? 'oklch(0.52 0.12 60)' : '#fff',
                  border: featured ? 'none' : '1px solid oklch(0.88 0.015 70)',
                  boxShadow: featured
                    ? '0 8px 32px oklch(0.52 0.12 60 / 0.30)'
                    : '0 2px 12px oklch(0.52 0.12 60 / 0.08)',
                }}
              >
                {featured && (
                  <span
                    className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: '#fff', color: 'oklch(0.52 0.12 60)' }}
                  >
                    Destacado
                  </span>
                )}

                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl"
                  style={{
                    background: featured ? 'oklch(1 0 0 / 0.18)' : 'oklch(0.52 0.12 60 / 0.12)',
                  }}
                >
                  <Icon
                    size={18}
                    style={{ color: featured ? '#fff' : 'oklch(0.52 0.12 60)' }}
                  />
                </div>

                <span
                  className="self-start px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    background: featured ? 'oklch(1 0 0 / 0.2)' : 'oklch(0.52 0.12 60 / 0.12)',
                    color: featured ? '#fff' : 'oklch(0.38 0.10 55)',
                  }}
                >
                  {offer.badge}
                </span>

                <h3
                  className="font-serif text-lg font-semibold leading-snug"
                  style={{ color: featured ? '#fff' : 'oklch(0.28 0.06 45)' }}
                >
                  {offer.title}
                </h3>
                <p
                  className="text-sm leading-relaxed flex-1"
                  style={{ color: featured ? 'oklch(1 0 0 / 0.80)' : 'oklch(0.45 0.03 45)' }}
                >
                  {offer.description}
                </p>
                {offer.conditions && (
                  <p
                    className="text-xs italic"
                    style={{ color: featured ? 'oklch(1 0 0 / 0.55)' : 'oklch(0.58 0.04 55)' }}
                  >
                    {offer.conditions}
                  </p>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export { MemberOffers }
