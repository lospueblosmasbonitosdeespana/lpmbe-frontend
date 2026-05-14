import Image from 'next/image'
import { Clock, Tag } from 'lucide-react'

const experiences = [
  {
    image: '/images/exp-hiking.jpg',
    title: 'Senderismo por el Cañón de Añisclo',
    description:
      'Recorrido guiado por uno de los cañones más espectaculares de los Pirineos, con paradas en miradores exclusivos y flora endémica.',
    duration: '5 h',
    badge: 'Incluido',
    badgeColor: 'oklch(0.45 0.13 155)',
  },
  {
    image: '/images/exp-wine.jpg',
    title: 'Cata de vinos del Somontano',
    description:
      'Sesión guiada con sumiller en nuestra bodega de piedra. Descubre los tintos y blancos premiados de la D.O. Somontano.',
    duration: '2 h',
    badge: '35 €/persona',
    badgeColor: 'var(--color-terracotta)',
  },
  {
    image: '/images/exp-stars.jpg',
    title: 'Observación astronómica nocturna',
    description:
      'El cielo oscuro del Sobrarbe es uno de los mejores de Europa. Nuestro astrónomo local te guiará por la Vía Láctea con telescopio profesional.',
    duration: '2,5 h',
    badge: '45 €/persona',
    badgeColor: 'var(--color-terracotta)',
  },
  {
    image: '/images/exp-spa.jpg',
    title: 'Ritual de bienestar pirenaico',
    description:
      'Masaje con aceites de lavanda del Pirineo, baño termal y envoltura de barro mineral. Una experiencia sensorial completa.',
    duration: '90 min',
    badge: '80 €/persona',
    badgeColor: 'var(--color-terracotta)',
  },
]

export default function ExperiencesSection() {
  return (
    <section
      className="py-20 md:py-28 px-6 md:px-14 lg:px-20"
      style={{ background: 'var(--color-midnight)' }}
      aria-labelledby="exp-heading"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-14 text-center">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: 'var(--color-terracotta-light)' }}
          >
            Experiencias
          </p>
          <h2
            id="exp-heading"
            className="font-serif text-3xl md:text-4xl font-bold text-white text-balance"
          >
            ¿Qué harás durante tu escapada?
          </h2>
        </div>

        {/* Alternating blocks */}
        <div className="space-y-12">
          {experiences.map((exp, i) => (
            <article
              key={i}
              className={`grid grid-cols-1 md:grid-cols-2 gap-0 rounded-xl overflow-hidden ${
                i % 2 === 0 ? '' : 'md:[&>*:first-child]:order-last'
              }`}
              style={{ boxShadow: '0 4px 32px oklch(0 0 0 / 0.35)' }}
            >
              {/* Image */}
              <div className="relative aspect-video md:aspect-auto min-h-[220px]">
                <Image
                  src={exp.image}
                  alt={exp.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              {/* Content */}
              <div
                className="flex flex-col justify-center p-8 md:p-10"
                style={{ background: 'var(--color-midnight-light)' }}
              >
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                    style={{ background: exp.badgeColor }}
                  >
                    <Tag size={10} />
                    {exp.badge}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs text-white/70"
                    style={{ background: 'oklch(1 0 0 / 0.08)' }}
                  >
                    <Clock size={10} />
                    {exp.duration}
                  </span>
                </div>

                <h3
                  className="font-serif text-xl md:text-2xl font-semibold text-white leading-snug mb-3"
                >
                  {exp.title}
                </h3>
                <p className="text-sm md:text-base leading-relaxed" style={{ color: 'oklch(0.80 0.02 250)' }}>
                  {exp.description}
                </p>
                <button
                  className="mt-6 self-start text-xs font-semibold tracking-wide uppercase underline underline-offset-4 transition-opacity hover:opacity-60"
                  style={{ color: 'var(--color-terracotta-light)' }}
                >
                  Más información
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export { ExperiencesSection }
