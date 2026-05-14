const guides = [
  {
    id: 1,
    name: 'Carlos Pérez',
    role: 'Fundador y Guía de Montaña',
    bio: 'Más de 20 años explorando el Pirineo. Especialista en alta montaña y travesías.',
    certifications: ['AEGM', 'Primeros Auxilios'],
    image: '/images/guide-1.jpg',
  },
  {
    id: 2,
    name: 'María García',
    role: 'Guía de Barrancos y Kayak',
    bio: 'Apasionada del agua y los deportes acuáticos. Instructora de kayak certificada.',
    certifications: ['Técnico Deportivo', 'Kayak'],
    image: '/images/guide-2.jpg',
  },
  {
    id: 3,
    name: 'Javier Martín',
    role: 'Guía de Escalada',
    bio: 'Especialista en vías ferratas y escalada. Conoce cada roca del Sobrarbe.',
    certifications: ['FAM', 'Rescate'],
    image: '/images/guide-3.jpg',
  },
  {
    id: 4,
    name: 'Ana López',
    role: 'Guía Cultural',
    bio: 'Historiadora y amante del patrimonio aragonés. Experta en rutas culturales.',
    certifications: ['Guía Turística', 'Patrimonio'],
    image: '/images/guide-4.jpg',
  },
]

export function GuidesTeam() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <p 
            className="text-sm font-medium tracking-wider uppercase mb-3"
            style={{ color: 'var(--color-adventure)' }}
          >
            Nuestro equipo
          </p>
          <h2 
            className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold"
            style={{ color: 'var(--color-slate)' }}
          >
            Guías expertos
          </h2>
        </div>

        {/* Guides Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {guides.map(guide => (
            <article 
              key={guide.id}
              className="text-center group"
            >
              {/* Photo */}
              <div 
                className="relative w-40 h-40 mx-auto mb-5 rounded-full overflow-hidden transition-all"
                style={{ 
                  boxShadow: '0 0 0 4px var(--color-adventure)',
                }}
              >
                <img 
                  src={guide.image} 
                  alt={guide.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <h3 
                className="font-serif text-xl font-bold mb-1"
                style={{ color: 'var(--color-slate)' }}
              >
                {guide.name}
              </h3>
              <p 
                className="text-sm mb-3"
                style={{ color: 'var(--color-adventure)' }}
              >
                {guide.role}
              </p>
              <p 
                className="text-sm mb-4 leading-relaxed"
                style={{ color: 'var(--color-slate)', opacity: 0.7 }}
              >
                {guide.bio}
              </p>

              {/* Certifications */}
              <div className="flex flex-wrap justify-center gap-2">
                {guide.certifications.map((cert, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: 'var(--color-sand)',
                      color: 'var(--color-slate)',
                    }}
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default GuidesTeam
