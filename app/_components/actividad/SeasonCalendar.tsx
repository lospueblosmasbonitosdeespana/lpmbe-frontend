'use client'

import { Sun, Flower2, Leaf, Snowflake } from 'lucide-react'
import { useActivitySlice } from './activity-config-context'

const SEASON_META: Record<string, { name: string; icon: React.ElementType; months: string }> = {
  primavera: { name: 'Primavera', icon: Flower2,   months: 'Mar - May' },
  verano:    { name: 'Verano',    icon: Sun,       months: 'Jun - Ago' },
  otono:     { name: 'Otoño',     icon: Leaf,      months: 'Sep - Nov' },
  invierno:  { name: 'Invierno',  icon: Snowflake, months: 'Dic - Feb' },
}

const DEFAULT_SEASONS = [
  { id: 'primavera', season: 'primavera' as const, title: 'Cascadas en su máximo esplendor', description: 'El deshielo trae cascadas espectaculares y prados floridos. Ideal para senderismo y actividades acuáticas.', featuredActivities: [{id:'a1',text:'Senderismo'},{id:'a2',text:'Vías ferratas'},{id:'a3',text:'Kayak'},{id:'a4',text:'MTB'}], imageUrl: '/images/season-spring.jpg' },
  { id: 'verano',    season: 'verano'    as const, title: 'Acceso a alta montaña',           description: 'Días largos y clima perfecto para las rutas más exigentes. Noches estrelladas inolvidables.',                  featuredActivities: [{id:'a1',text:'Alta montaña'},{id:'a2',text:'Barranquismo'},{id:'a3',text:'Kayak'},{id:'a4',text:'Observación estrellas'}], imageUrl: '/images/season-summer.jpg' },
  { id: 'otono',     season: 'otono'     as const, title: 'Colores espectaculares',           description: 'Los bosques se tiñen de colores cálidos. Temporada de setas y rutas gastronómicas.',                            featuredActivities: [{id:'a1',text:'Senderismo'},{id:'a2',text:'Micología'},{id:'a3',text:'Rutas culturales'},{id:'a4',text:'Fotografía'}], imageUrl: '/images/season-autumn.jpg' },
  { id: 'invierno',  season: 'invierno'  as const, title: 'Paisajes nevados mágicos',         description: 'El Pirineo se viste de blanco. Experiencias únicas en paisajes nevados.',                                       featuredActivities: [{id:'a1',text:'Raquetas de nieve'},{id:'a2',text:'Esquí de montaña'},{id:'a3',text:'Observación fauna'},{id:'a4',text:'Rutas culturales'}], imageUrl: '/images/season-winter.jpg' },
]

export function SeasonCalendar() {
  const slice = useActivitySlice('seasons')
  const eyebrow = slice?.eyebrow || '¿Cuándo venir?'
  const heading = slice?.title || 'Cada estación, una aventura diferente'
  const seasons = slice?.items && slice.items.length > 0 ? slice.items : DEFAULT_SEASONS
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
            {eyebrow}
          </p>
          <h2 
            className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold"
            style={{ color: 'var(--color-slate)' }}
          >
            {heading}
          </h2>
        </div>

        {/* Season Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {seasons.map((season) => {
            const meta = SEASON_META[season.season] ?? SEASON_META.primavera
            const Icon = meta.icon
            return (
              <article 
                key={season.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group"
              >
                {/* Image */}
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src={season.imageUrl} 
                    alt={meta.name}
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
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 
                      className="font-serif text-xl font-bold"
                      style={{ color: 'var(--color-slate)' }}
                    >
                      {meta.name}
                    </h3>
                    <span 
                      className="text-sm"
                      style={{ color: 'var(--color-adventure)' }}
                    >
                      {meta.months}
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
                    ✦ {season.title}
                  </p>

                  {/* Activities */}
                  <div className="flex flex-wrap gap-1.5">
                    {season.featuredActivities.map((activity) => (
                      <span 
                        key={activity.id}
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ 
                          backgroundColor: 'var(--color-sand)',
                          color: 'var(--color-slate)',
                        }}
                      >
                        {activity.text}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default SeasonCalendar
