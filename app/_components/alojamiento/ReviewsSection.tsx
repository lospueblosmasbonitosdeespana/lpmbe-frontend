import { Star, Quote } from 'lucide-react'

const reviews = [
  {
    quote:
      'Una experiencia que supera cualquier expectativa. El desayuno con vistas a los picos del Pirineo, la atención del equipo y la autenticidad de cada detalle hacen de La Posada del Sobrarbe un lugar al que regresaremos cada año.',
    author: 'María G.',
    origin: 'Madrid',
    stars: 5,
    date: 'Octubre 2024',
  },
  {
    quote:
      'Llevábamos años buscando un hotel rural así: con alma, con historia y sin renunciar al confort. Lo hemos encontrado en Aínsa. La habitación con chimenea y el spa de piedra son sencillamente perfectos.',
    author: 'Javier M.',
    origin: 'Barcelona',
    stars: 5,
    date: 'Septiembre 2024',
  },
]

export default function ReviewsSection() {
  return (
    <section
      className="py-20 md:py-28 px-6 md:px-14 lg:px-20"
      style={{ background: '#fff' }}
      aria-labelledby="reviews-heading"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: 'var(--color-terracotta)' }}
          >
            Opiniones de huéspedes
          </p>
          {/* Overall rating */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <span
              className="font-serif text-6xl font-bold"
              style={{ color: 'var(--color-midnight)' }}
            >
              4.8
            </span>
            <div className="flex flex-col items-start gap-1">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" style={{ color: 'var(--color-terracotta)' }} />
                ))}
              </div>
              <span className="text-sm" style={{ color: 'oklch(0.50 0.02 250)' }}>
                127 reseñas verificadas
              </span>
            </div>
          </div>
          <h2
            id="reviews-heading"
            className="font-serif text-2xl md:text-3xl font-bold text-balance"
            style={{ color: 'var(--color-midnight)' }}
          >
            Lo que dicen nuestros huéspedes
          </h2>
        </div>

        {/* Review cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reviews.map((review, i) => (
            <blockquote
              key={i}
              className="flex flex-col gap-5 p-8 rounded-2xl"
              style={{
                background: 'var(--color-cream)',
                border: '1px solid oklch(0.90 0.005 80)',
              }}
            >
              <Quote
                size={28}
                style={{ color: 'var(--color-terracotta)', opacity: 0.5 }}
                aria-hidden="true"
              />
              <p
                className="font-serif text-lg leading-relaxed flex-1 italic"
                style={{ color: 'var(--color-midnight)' }}
              >
                {review.quote}
              </p>
              <footer className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-midnight)' }}>
                    {review.author}
                  </p>
                  <p className="text-xs" style={{ color: 'oklch(0.55 0.02 250)' }}>
                    {review.origin} · {review.date}
                  </p>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(review.stars)].map((_, s) => (
                    <Star key={s} size={13} fill="currentColor" style={{ color: 'var(--color-terracotta)' }} />
                  ))}
                </div>
              </footer>
            </blockquote>
          ))}
        </div>

        {/* See all link */}
        <div className="text-center mt-10">
          <button
            className="text-sm font-semibold underline underline-offset-4 transition-opacity hover:opacity-60"
            style={{ color: 'var(--color-midnight)' }}
          >
            Ver todas las 127 reseñas
          </button>
        </div>
      </div>
    </section>
  )
}

export { ReviewsSection }
