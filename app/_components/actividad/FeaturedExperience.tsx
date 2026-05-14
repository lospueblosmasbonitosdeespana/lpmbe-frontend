import { Clock, Users, Mountain, Calendar } from 'lucide-react'

export function FeaturedExperience() {
  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: 'url(/images/featured-exp.jpg)' }}
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
        <p className="text-xs uppercase tracking-wider">Desde</p>
        <p className="text-2xl font-bold">95€</p>
        <p className="text-xs">/persona</p>
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
            Experiencia destacada
          </span>

          {/* Title */}
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
            Travesía completa del Parque Nacional de Ordesa
          </h2>

          {/* Description */}
          <p 
            className="text-lg mb-8 leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.8)' }}
          >
            Una experiencia de dos días atravesando los paisajes más impresionantes del Pirineo. 
            Incluye noche en refugio, todas las comidas y guía de montaña certificado. 
            Una aventura que recordarás toda la vida.
          </p>

          {/* Details */}
          <div className="flex flex-wrap gap-6 mb-10">
            <div className="flex items-center gap-2 text-white">
              <Clock className="w-5 h-5" style={{ color: 'var(--color-ember-light)' }} />
              <span>2 días</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Mountain className="w-5 h-5" style={{ color: 'var(--color-ember-light)' }} />
              <span>Exigente</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Users className="w-5 h-5" style={{ color: 'var(--color-ember-light)' }} />
              <span>4-8 personas</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5" style={{ color: 'var(--color-ember-light)' }} />
              <span>Jun - Oct</span>
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
