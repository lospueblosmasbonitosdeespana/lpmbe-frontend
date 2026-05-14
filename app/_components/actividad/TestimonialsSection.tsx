'use client'

import { Star, Quote } from 'lucide-react'
import { useActivitySlice } from './activity-config-context'

const DEFAULT_TESTIMONIALS = [
  { id: '1', quote: 'Una experiencia increíble. Carlos y su equipo nos hicieron sentir seguros en todo momento mientras disfrutábamos de paisajes de ensueño. Volveremos seguro.', author: 'Miguel Fernández', origin: 'Madrid',    stars: 5, activity: '', date: 'Octubre 2024' },
  { id: '2', quote: 'La ruta por el Cañón de Añisclo fue espectacular. Los guías conocen cada rincón y te cuentan historias fascinantes. Muy recomendable.',                       author: 'Laura Sánchez',    origin: 'Barcelona', stars: 5, activity: '', date: 'Agosto 2024' },
  { id: '3', quote: 'Llevamos a toda la familia y fue perfecto. Adaptaron la actividad para que los niños disfrutaran también. Profesionalidad y buen humor.',                     author: 'David Martínez',   origin: 'Valencia',  stars: 5, activity: '', date: 'Julio 2024' },
]

export function TestimonialsSection() {
  const slice = useActivitySlice('testimonials')
  const overallRating = slice?.overallRating || '4.9'
  const totalReviews = slice?.totalReviews || '89'
  const testimonials = slice?.items && slice.items.length > 0 ? slice.items : DEFAULT_TESTIMONIALS
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header with Rating */}
        <div className="text-center mb-12">
          <p 
            className="text-sm font-medium tracking-wider uppercase mb-3"
            style={{ color: 'var(--color-adventure)' }}
          >
            Lo que dicen nuestros aventureros
          </p>
          <h2 
            className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
            style={{ color: 'var(--color-slate)' }}
          >
            Opiniones reales
          </h2>
          
          {/* Overall Rating */}
          <div className="flex items-center justify-center gap-4">
            <span 
              className="text-5xl font-bold"
              style={{ color: 'var(--color-slate)' }}
            >
              {overallRating}
            </span>
            <div>
              <div className="flex gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className="w-5 h-5" 
                    fill="var(--color-ember)"
                    style={{ color: 'var(--color-ember)' }}
                  />
                ))}
              </div>
              <p 
                className="text-sm"
                style={{ color: 'var(--color-slate)', opacity: 0.6 }}
              >
                Basado en {totalReviews} reseñas
              </p>
            </div>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map(testimonial => (
            <article 
              key={testimonial.id}
              className="p-6 rounded-2xl relative"
              style={{ backgroundColor: 'var(--color-sand)' }}
            >
              {/* Quote Icon */}
              <Quote 
                className="w-8 h-8 mb-4"
                style={{ color: 'var(--color-adventure)', opacity: 0.3 }}
              />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.stars)].map((_, i) => (
                  <Star 
                    key={i} 
                    className="w-4 h-4" 
                    fill="var(--color-ember)"
                    style={{ color: 'var(--color-ember)' }}
                  />
                ))}
              </div>

              {/* Quote */}
              <p 
                className="mb-6 leading-relaxed"
                style={{ color: 'var(--color-slate)' }}
              >
                {'"'}{testimonial.quote}{'"'}
              </p>

              {/* Author */}
              <div className="flex items-center justify-between">
                <div>
                  <p 
                    className="font-semibold"
                    style={{ color: 'var(--color-slate)' }}
                  >
                    {testimonial.author}
                  </p>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--color-slate)', opacity: 0.6 }}
                  >
                    {testimonial.origin}
                  </p>
                </div>
                <p 
                  className="text-xs"
                  style={{ color: 'var(--color-slate)', opacity: 0.5 }}
                >
                  {testimonial.date}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TestimonialsSection
