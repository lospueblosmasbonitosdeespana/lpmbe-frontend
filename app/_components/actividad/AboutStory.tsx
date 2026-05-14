export function AboutStory() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <div>
            <p 
              className="text-sm font-medium tracking-wider uppercase mb-3"
              style={{ color: 'var(--color-adventure)' }}
            >
              Nuestra filosofía
            </p>
            <h2 
              className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight"
              style={{ color: 'var(--color-slate)' }}
            >
              Conectando personas{'\n'}
              <span style={{ color: 'var(--color-adventure)' }}>con la montaña</span>
            </h2>
            
            <p 
              className="mb-4 leading-relaxed"
              style={{ color: 'var(--color-slate)', opacity: 0.8 }}
            >
              Desde 2008, Sobrarbe Aventura nació con un sueño: compartir la belleza incomparable 
              del Pirineo aragonés con viajeros de todo el mundo. Lo que comenzó como una pasión 
              personal se ha convertido en una misión de vida.
            </p>
            
            <p 
              className="mb-6 leading-relaxed"
              style={{ color: 'var(--color-slate)', opacity: 0.8 }}
            >
              Nuestro equipo de guías certificados conoce cada sendero, cada rincón secreto y 
              cada historia que guardan estas montañas. No somos solo guías, somos guardianes 
              de un patrimonio natural extraordinario.
            </p>

            {/* Quote */}
            <blockquote 
              className="pl-4 py-2 italic font-serif text-lg"
              style={{ 
                borderLeft: '3px solid var(--color-adventure)',
                color: 'var(--color-slate)',
              }}
            >
              {'"'}La montaña no se conquista, se respeta. Y en ese respeto encontramos 
              la verdadera aventura.{'"'}
              <footer 
                className="mt-2 text-sm not-italic font-sans"
                style={{ color: 'var(--color-slate)', opacity: 0.6 }}
              >
                — Carlos Pérez, Fundador
              </footer>
            </blockquote>
          </div>

          {/* Images */}
          <div className="relative h-[400px] md:h-[500px]">
            <div 
              className="absolute top-0 right-0 w-[70%] h-[60%] rounded-2xl overflow-hidden shadow-lg"
              style={{ transform: 'rotate(2deg)' }}
            >
              <img 
                src="/images/about-1.jpg" 
                alt="Guía de montaña con grupo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div 
              className="absolute bottom-0 left-0 w-[65%] h-[55%] rounded-2xl overflow-hidden shadow-xl"
              style={{ transform: 'rotate(-3deg)' }}
            >
              <img 
                src="/images/about-2.jpg" 
                alt="Paisaje del Pirineo" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AboutStory
