import { Sun, Flower2, Leaf, Snowflake } from 'lucide-react'

const seasons = [
  {
    id: 'primavera',
    name: 'Primavera',
    icon: Flower2,
    months: 'Mar - May',
    image: '/images/season-spring.jpg',
    activities: ['Senderismo', 'Vías ferratas', 'Kayak', 'MTB'],
    description: 'El deshielo trae cascadas espectaculares y prados floridos. Ideal para senderismo y actividades acuáticas.',
    highlight: 'Cascadas en su máximo esplendor',
  },
  {
    id: 'verano',
    name: 'Verano',
    icon: Sun,
    months: 'Jun - Ago',
    image: '/images/season-summer.jpg',
    activities: ['Alta montaña', 'Barranquismo', 'Kayak', 'Observación estrellas'],
    description: 'Días largos y clima perfecto para las rutas más exigentes. Noches estrelladas inolvidables.',
    highlight: 'Acceso a alta montaña',
  },
  {
    id: 'otono',
    name: 'Otoño',
    icon: Leaf,
    months: 'Sep - Nov',
    image: '/images/season-autumn.jpg',
    activities: ['Senderismo', 'Micología', 'Rutas culturales', 'Fotografía'],
    description: 'Los bosques se tiñen de colores cálidos. Temporada de setas y rutas gastronómicas.',
    highlight: 'Colores espectaculares',
  },
  {
    id: 'invierno',
    name: 'Invierno',
    icon: Snowflake,
    months: 'Dic - Feb',
    image: '/images/season-winter.jpg',
    activities: ['Raquetas de nieve', 'Esquí de montaña', 'Observación fauna', 'Rutas culturales'],
    description: 'El Pirineo se viste de blanco. Experiencias únicas en paisajes nevados.',
    highlight: 'Paisajes nevados mágicos',
  },
]

export function SeasonCalendar() {
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
            style={{ color: 'var(--color-adventure)' }}
          >
            ¿Cuándo venir?
          </p>
          <h2 
            className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold"
            style={{ color: 'var(--color-slate)' }}
          >
            Cada estación, una aventura diferente
          </h2>
        </div>

        {/* Season Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {seasons.map(season => (
            <article 
              key={season.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group"
            >
              {/* Image */}
              <div className="relative h-40 overflow-hidden">
                <img 
                  src={season.image} 
                  alt={season.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div 
                  className="absolute inset-0"
                  style={{ 
                    background: 'linear-gradient(to top, var(--color-slate) 0%, transparent 100%)',
                    opacity: 0.5,
                  }}
                />
                {/* Icon */}
                <div 
                  className="absolute bottom-3 left-3 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-adventure)' }}
                >
                  <season.icon className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 
                    className="font-serif text-xl font-bold"
                    style={{ color: 'var(--color-slate)' }}
                  >
                    {season.name}
                  </h3>
                  <span 
                    className="text-sm"
                    style={{ color: 'var(--color-adventure)' }}
                  >
                    {season.months}
                  </span>
                </div>

                <p 
                  className="text-sm mb-4 leading-relaxed"
                  style={{ color: 'var(--color-slate)', opacity: 0.7 }}
                >
                  {season.description}
                </p>

                {/* Highlight */}
                <p 
                  className="text-xs font-medium mb-3"
                  style={{ color: 'var(--color-ember)' }}
                >
                  ✦ {season.highlight}
                </p>

                {/* Activities */}
                <div className="flex flex-wrap gap-1.5">
                  {season.activities.map((activity, i) => (
                    <span 
                      key={i}
                      className="px-2 py-0.5 rounded text-xs"
                      style={{ 
                        backgroundColor: 'var(--color-sand)',
                        color: 'var(--color-slate)',
                      }}
                    >
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SeasonCalendar
