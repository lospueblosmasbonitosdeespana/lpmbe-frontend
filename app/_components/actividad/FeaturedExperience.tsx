'use client'

import { Clock, Users, Mountain, Calendar } from 'lucide-react'
import { useActivitySlice } from './activity-config-context'

const DIFFICULTY_LABELS: Record<string, string> = { facil: 'Fácil', moderada: 'Moderada', exigente: 'Exigente' }

export function FeaturedExperience() {
  const slice = useActivitySlice('featured')
  if (slice && slice.enabled === false) return null
  const eyebrow = slice?.eyebrow || 'Experiencia destacada'
  const title = slice?.title || 'Travesía completa del Parque Nacional de Ordesa'
  const description = slice?.description || 'Una experiencia de dos días atravesando los paisajes más impresionantes del Pirineo. Incluye noche en refugio, todas las comidas y guía de montaña certificado. Una aventura que recordarás toda la vida.'
  const durationLabel = slice?.durationLabel || '2 días'
  const difficultyKey = slice?.difficulty || 'exigente'
  const difficultyLabel = DIFFICULTY_LABELS[difficultyKey] ?? 'Exigente'
  const groupSizeLabel = slice?.groupSizeLabel || '4-8 personas'
  const seasonLabel = slice?.seasonLabel || 'Jun - Oct'
  const priceLabel = slice?.priceLabel || 'Desde 95 €/persona'
  const imageUrl = slice?.imageUrl || '/images/featured-exp.jpg'
  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      
      {/* Overlay */}
      <div 
        className="absolute inset-0"
        style={{ 
          background: 'linear-gradient(to right, var(--color-slate) 0%, rgba(32,34,45,0.7) 100%)',
        }}
      />

      {/* Price Badge */}
      <div 
        className="absolute top-6 right-6 md:top-10 md:right-10 px-5 py-3 rounded-2xl text-center"
        style={{ 
          backgroundColor: 'var(--color-ember)',
          color: 'white',
        }}
      >
        <p className="text-sm font-bold whitespace-pre-line">{priceLabel}</p>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <span 
            className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            style={{ 
              backgroundColor: 'var(--color-ember)',
              color: 'white',
            }}
          >
            {eyebrow}
          </span>

          {/* Title */}
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
            {title}
          </h2>

          {/* Description */}
          <p 
            className="text-lg mb-8 leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.8)' }}
          >
            {description}
          </p>

          {/* Details */}
          <div className="flex flex-wrap gap-6 mb-10">
            <div className="flex items-center gap-2 text-white">
              <Clock className="w-5 h-5" style={{ color: 'var(--color-ember-light)' }} />
              <span>{durationLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Mountain className="w-5 h-5" style={{ color: 'var(--color-ember-light)' }} />
              <span>{difficultyLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Users className="w-5 h-5" style={{ color: 'var(--color-ember-light)' }} />
              <span>{groupSizeLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5" style={{ color: 'var(--color-ember-light)' }} />
              <span>{seasonLabel}</span>
            </div>
          </div>

          {/* CTA */}
          <button 
            className="px-8 py-4 rounded-full font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--color-adventure)' }}
          >
            Reservar esta experiencia
          </button>
        </div>
      </div>
    </section>
  )
}

export default FeaturedExperience
