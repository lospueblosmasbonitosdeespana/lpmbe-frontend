export function BookingBanner() {
  return (
    <section 
      className="py-16 md:py-20"
      style={{ 
        background: 'linear-gradient(135deg, var(--color-adventure) 0%, var(--color-adventure-light) 100%)',
      }}
    >
      <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
        {/* Eyebrow */}
        <p 
          className="text-sm font-medium tracking-wider uppercase mb-3"
          style={{ color: 'rgba(255,255,255,0.8)' }}
        >
          ¿Listo para la aventura?
        </p>

        {/* Title */}
        <h2 
          className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
        >
          Reserva tu experiencia hoy
        </h2>

        {/* Subtitle */}
        <p 
          className="text-lg mb-8 max-w-2xl mx-auto"
          style={{ color: 'rgba(255,255,255,0.9)' }}
        >
          Elige entre más de 15 actividades guiadas y vive el Pirineo como nunca antes. 
          Nuestros guías expertos te esperan.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <button 
            className="px-8 py-4 rounded-full font-medium transition-all hover:opacity-90 w-full sm:w-auto"
            style={{ 
              backgroundColor: 'white',
              color: 'var(--color-adventure)',
            }}
          >
            Reservar actividad
          </button>
          <button 
            className="px-8 py-4 rounded-full font-medium transition-all hover:bg-white/10 w-full sm:w-auto"
            style={{ 
              border: '2px solid white',
              color: 'white',
              backgroundColor: 'transparent',
            }}
          >
            Consultar disponibilidad
          </button>
        </div>

        {/* Note */}
        <p 
          className="text-sm"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          💡 Descuento del 10% para grupos de 6 o más personas
        </p>
      </div>
    </section>
  )
}

export default BookingBanner
