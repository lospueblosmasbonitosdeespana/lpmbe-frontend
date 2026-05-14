'use client'

import { Percent, Gift, Sparkles, Crown, Star } from 'lucide-react'
import { useActivitySlice } from './activity-config-context'

const ICONS = { gift: Gift, percent: Percent, sparkles: Sparkles, crown: Crown, star: Star } as const

const DEFAULT_OFFERS = [
  { id: '1', icon: 'percent'  as const, badge: '15% dto.', title: 'Descuento para socios', description: 'Los socios del Club LPMBE disfrutan de un 15% de descuento en todas nuestras actividades.',          conditions: 'Presentando carnet de socio válido',  isFeatured: false },
  { id: '2', icon: 'gift'     as const, badge: 'Regalo',   title: 'Actividad gratis',      description: 'Por cada 5 actividades reservadas, te regalamos una ruta cultural por Aínsa medieval.',                conditions: 'Actividades en el mismo año natural', isFeatured: true  },
  { id: '3', icon: 'sparkles' as const, badge: 'Grupos',   title: 'Oferta familiar',       description: 'Familias con niños: los menores de 12 años pagan solo el 50% en actividades seleccionadas.',          conditions: 'Mínimo 2 adultos por reserva',         isFeatured: false },
]

export function MemberOffers() {
  const slice = useActivitySlice('memberOffers')
  const eyebrow = slice?.eyebrow || 'Exclusivo Club LPMBE'
  const title = slice?.title || 'Ofertas especiales para socios'
  const offers = slice?.offers && slice.offers.length > 0 ? slice.offers : DEFAULT_OFFERS
  return (
    <section 
      className="py-16 md:py-24"
      style={{ backgroundColor: 'var(--color-sand)' }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <p 
            className="text-sm font-medium tracking-wider uppercase mb-3"
            style={{ color: 'var(--color-ember)' }}
          >
            {eyebrow}
          </p>
          <h2 
            className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold"
            style={{ color: 'var(--color-slate)' }}
          >
            {title}
          </h2>
        </div>

        {/* Offers Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {offers.map((offer) => {
            const Icon = ICONS[offer.icon as keyof typeof ICONS] ?? Gift
            const featured = offer.isFeatured
            return (
              <article 
                key={offer.id}
                className="relative bg-white p-6 rounded-2xl"
                style={{ 
                  border: featured ? '2px solid var(--color-ember)' : '1px solid rgba(0,0,0,0.05)',
                }}
              >
                {featured && (
                  <div 
                    className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: 'var(--color-ember)' }}
                  >
                    Destacado
                  </div>
                )}

                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ 
                    backgroundColor: featured ? 'var(--color-ember)' : 'var(--color-adventure)',
                  }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <span 
                  className="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3"
                  style={{ 
                    backgroundColor: featured ? 'var(--color-ember-light)' : 'var(--color-adventure-light)',
                    color: 'white',
                  }}
                >
                  {offer.badge}
                </span>

                <h3 
                  className="font-serif text-xl font-bold mb-2"
                  style={{ color: 'var(--color-slate)' }}
                >
                  {offer.title}
                </h3>

                <p 
                  className="text-sm mb-4"
                  style={{ color: 'var(--color-slate)', opacity: 0.7 }}
                >
                  {offer.description}
                </p>

                {offer.conditions && (
                  <p 
                    className="text-xs"
                    style={{ color: 'var(--color-slate)', opacity: 0.5 }}
                  >
                    * {offer.conditions}
                  </p>
                )}
              </article>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <button 
            className="px-8 py-4 rounded-full font-medium transition-all hover:opacity-90"
            style={{ 
              backgroundColor: 'var(--color-ember)',
              color: 'white',
            }}
          >
            Hazte socio del Club
          </button>
        </div>
      </div>
    </section>
  )
}

export default MemberOffers
