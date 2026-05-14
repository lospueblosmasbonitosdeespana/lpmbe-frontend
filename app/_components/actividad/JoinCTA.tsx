export function JoinCTA() {
  return (
    <section 
      className="relative py-20 md:py-28 overflow-hidden"
      style={{ backgroundColor: 'var(--color-slate)' }}
    >
      {/* Mountain Silhouette Pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23ffffff' d='M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,234.7C960,224,1056,192,1152,181.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 text-center">
        {/* Title */}
        <h2 
          className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6"
        >
          ¿Preparado para la aventura?
        </h2>

        {/* Description */}
        <p 
          className="text-lg mb-10 max-w-2xl mx-auto"
          style={{ color: 'rgba(255,255,255,0.8)' }}
        >
          Únete al Club de Los Pueblos Más Bonitos de España y disfruta de ventajas exclusivas 
          en todas las experiencias de Sobrarbe Aventura y más de 100 destinos únicos.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            className="px-8 py-4 rounded-full font-medium transition-all hover:opacity-90 w-full sm:w-auto"
            style={{ 
              backgroundColor: 'var(--color-adventure)',
              color: 'white',
            }}
          >
            Únete al Club
          </button>
          <button 
            className="px-8 py-4 rounded-full font-medium transition-all hover:bg-white/10 w-full sm:w-auto"
            style={{ 
              border: '2px solid rgba(255,255,255,0.5)',
              color: 'white',
              backgroundColor: 'transparent',
            }}
          >
            Saber más
          </button>
        </div>
      </div>
    </section>
  )
}

export default JoinCTA
