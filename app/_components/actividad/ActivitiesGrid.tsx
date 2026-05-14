'use client'

import { useState, useMemo } from 'react'
import { Clock, Users } from 'lucide-react'
import { useActivitySlice } from './activity-config-context'

const CAT_LABELS: Record<string, string> = {
  senderismo: 'Senderismo', agua: 'Agua', nieve: 'Nieve', cultura: 'Cultura',
  btt: 'BTT', aire: 'Aire', otro: 'Otro',
}
const DIFFICULTY_LABELS: Record<string, string> = { facil: 'Fácil', moderada: 'Moderada', exigente: 'Exigente' }
const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  facil:    { bg: 'var(--color-adventure-light)', text: 'white' },
  moderada: { bg: 'var(--color-ember)',           text: 'white' },
  exigente: { bg: 'var(--color-slate)',           text: 'white' },
}

const DEFAULT_ACTIVITIES = [
  { id: '1', title: 'Cañón de Añisclo',           description: 'Recorre uno de los cañones más espectaculares del Pirineo, con paredes verticales de más de 1000 metros.', category: 'senderismo' as const, difficulty: 'moderada' as const, durationLabel: '5-6h', groupSizeLabel: '4-10', priceLabel: '45 €', imageUrl: '/images/activity-1.jpg' },
  { id: '2', title: 'Kayak en el río Cinca',      description: 'Desciende las aguas cristalinas del Cinca en una aventura acuática inolvidable.',                            category: 'agua'      as const, difficulty: 'facil'    as const, durationLabel: '3h',   groupSizeLabel: '2-8',  priceLabel: '35 €', imageUrl: '/images/activity-2.jpg' },
  { id: '3', title: 'Vía Ferrata de Sorrosal',    description: 'Escala junto a una cascada de 120 metros en esta emocionante vía ferrata.',                                  category: 'senderismo' as const, difficulty: 'exigente' as const, durationLabel: '4h',   groupSizeLabel: '2-6',  priceLabel: '65 €', imageUrl: '/images/activity-3.jpg' },
  { id: '4', title: 'Raquetas de nieve',          description: 'Explora los paisajes nevados del Pirineo con raquetas, una forma mágica de disfrutar el invierno.',          category: 'nieve'     as const, difficulty: 'facil'    as const, durationLabel: '4h',   groupSizeLabel: '4-12', priceLabel: '40 €', imageUrl: '/images/activity-4.jpg' },
  { id: '5', title: 'Aínsa Medieval',             description: 'Descubre la historia y leyendas de una de las villas medievales mejor conservadas de España.',               category: 'cultura'   as const, difficulty: 'facil'    as const, durationLabel: '2h',   groupSizeLabel: '2-15', priceLabel: '25 €', imageUrl: '/images/activity-5.jpg' },
  { id: '6', title: 'MTB Zona Zero',              description: 'Rutas de mountain bike por el legendario territorio Zona Zero, paraíso del enduro.',                          category: 'btt'       as const, difficulty: 'moderada' as const, durationLabel: '5h',   groupSizeLabel: '2-8',  priceLabel: '55 €', imageUrl: '/images/activity-6.jpg' },
  { id: '7', title: 'Observación de estrellas',   description: 'El cielo de Sobrarbe es Reserva Starlight. Vive una noche mágica bajo las estrellas.',                       category: 'cultura'   as const, difficulty: 'facil'    as const, durationLabel: '3h',   groupSizeLabel: '4-15', priceLabel: '30 €', imageUrl: '/images/activity-7.jpg' },
  { id: '8', title: 'Barranquismo en Mascún',     description: 'Descenso de uno de los barrancos más bonitos de la Sierra de Guara.',                                         category: 'agua'      as const, difficulty: 'moderada' as const, durationLabel: '6h',   groupSizeLabel: '4-10', priceLabel: '75 €', imageUrl: '/images/activity-8.jpg' },
]

export function ActivitiesGrid() {
  const slice = useActivitySlice('activities')
  const eyebrow = slice?.eyebrow || 'Experiencias'
  const title = slice?.title || 'Nuestras actividades'
  const activities = slice?.items && slice.items.length > 0 ? slice.items : DEFAULT_ACTIVITIES
  const categories = useMemo(
    () => ['Todas', ...Array.from(new Set(activities.map((a) => CAT_LABELS[a.category] ?? a.category)))],
    [activities],
  )
  const [activeCategory, setActiveCategory] = useState('Todas')
  const filteredActivities = activeCategory === 'Todas'
    ? activities
    : activities.filter((a) => (CAT_LABELS[a.category] ?? a.category) === activeCategory)

  return (
    <section 
      className="py-16 md:py-24"
      style={{ backgroundColor: 'var(--color-sand)' }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-10">
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
            {title}
          </h2>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className="px-5 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: activeCategory === category ? 'var(--color-adventure)' : 'white',
                color: activeCategory === category ? 'white' : 'var(--color-slate)',
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredActivities.map(activity => (
            <article
              key={activity.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={activity.imageUrl} 
                  alt={activity.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Category Badge */}
                <span 
                  className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: 'var(--color-adventure)' }}
                >
                  {CAT_LABELS[activity.category] ?? activity.category}
                </span>
                {/* Difficulty Badge */}
                <span 
                  className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: DIFFICULTY_COLORS[activity.difficulty]?.bg ?? 'var(--color-slate)',
                    color: DIFFICULTY_COLORS[activity.difficulty]?.text ?? 'white',
                  }}
                >
                  {DIFFICULTY_LABELS[activity.difficulty] ?? activity.difficulty}
                </span>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 
                  className="font-serif text-lg font-bold mb-2"
                  style={{ color: 'var(--color-slate)' }}
                >
                  {activity.title}
                </h3>
                <p 
                  className="text-sm mb-4 line-clamp-2"
                  style={{ color: 'var(--color-slate)', opacity: 0.7 }}
                >
                  {activity.description}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span 
                      className="flex items-center gap-1"
                      style={{ color: 'var(--color-slate)', opacity: 0.6 }}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {activity.durationLabel}
                    </span>
                    <span 
                      className="flex items-center gap-1"
                      style={{ color: 'var(--color-slate)', opacity: 0.6 }}
                    >
                      <Users className="w-3.5 h-3.5" />
                      {activity.groupSizeLabel}
                    </span>
                  </div>
                  <span 
                    className="font-semibold flex items-center"
                    style={{ color: 'var(--color-adventure)' }}
                  >
                    {activity.priceLabel}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center mt-10">
          <button 
            className="px-8 py-3 rounded-full font-medium transition-all hover:opacity-90"
            style={{ 
              backgroundColor: 'var(--color-adventure)',
              color: 'white',
            }}
          >
            Ver todas las actividades
          </button>
        </div>
      </div>
    </section>
  )
}

export default ActivitiesGrid
