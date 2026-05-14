import { Percent, Gift, Users } from 'lucide-react'

const offers = [
  {
    id: 1,
    icon: Percent,
    badge: '15% dto.',
    title: 'Descuento para socios',
    description: 'Los socios del Club LPMBE disfrutan de un 15% de descuento en todas nuestras actividades.',
    conditions: 'Presentando carnet de socio válido',
    featured: false,
  },
  {
    id: 2,
    icon: Gift,
    badge: 'Regalo',
    title: 'Actividad gratis',
    description: 'Por cada 5 actividades reservadas, te regalamos una ruta cultural por Aínsa medieval.',
    conditions: 'Actividades en el mismo año natural',
    featured: true,
  },
  {
    id: 3,
    icon: Users,
    badge: 'Grupos',
    title: 'Oferta familiar',
    description: 'Familias con niños: los menores de 12 años pagan solo el 50% en actividades seleccionadas.',
    conditions: 'Mínimo 2 adultos por reserva',
    featured: false,
  },
]

export function MemberOffers() {
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
            Exclusivo Club LPMBE
          </p>
          <h2 
            className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold"
            style={{ color: 'var(--color-slate)' }}
          >
            Ofertas especiales para socios
          </h2>
        </div>

        {/* Offers Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {offers.map(offer => (
            <article 
              key={offer.id}
              className="relative bg-white p-6 rounded-2xl"
              style={{ 
                border: offer.featured ? '2px solid var(--color-ember)' : '1px solid rgba(0,0,0,0.05)',
              }}
            >
              {/* Featured Ribbon */}
              {offer.featured && (
                <div 
                  className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: 'var(--color-ember)' }}
                >
                  Destacado
                </div>
              )}

              {/* Icon */}
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{ 
                  backgroundColor: offer.featured ? 'var(--color-ember)' : 'var(--color-adventure)',
                }}
              >
                <offer.icon className="w-6 h-6 text-white" />
              </div>

              {/* Badge */}
              <span 
                className="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3"
                style={{ 
                  backgroundColor: offer.featured ? 'var(--color-ember-light)' : 'var(--color-adventure-light)',
                  color: 'white',
                }}
              >
                {offer.badge}
              </span>

              {/* Title */}
              <h3 
                className="font-serif text-xl font-bold mb-2"
                style={{ color: 'var(--color-slate)' }}
              >
                {offer.title}
              </h3>

              {/* Description */}
              <p 
                className="text-sm mb-4"
                style={{ color: 'var(--color-slate)', opacity: 0.7 }}
              >
                {offer.description}
              </p>

              {/* Conditions */}
              <p 
                className="text-xs"
                style={{ color: 'var(--color-slate)', opacity: 0.5 }}
              >
                * {offer.conditions}
              </p>
            </article>
          ))}
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
