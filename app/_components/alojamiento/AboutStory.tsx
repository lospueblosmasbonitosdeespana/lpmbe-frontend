'use client'

import Image from 'next/image'
import { useLodgingSlice } from './lodging-config-context'

const DEFAULT_PARAGRAPHS = [
  'Enclavada en el corazón medieval de Aínsa, la Posada del Sobrarbe nació de la pasión de la familia Castán por preservar el patrimonio vivo del Pirineo. Lo que en el siglo XVIII fue una imponente casa señorial de piedra es hoy un refugio de ocho habitaciones donde cada recoveco guarda su propia historia.',
  'La rehabilitación, iniciada en 2017 y culminada en 2019, respetó escrupulosamente las bóvedas de sillería, las vigas originales de roble y los arcos de medio punto, añadiendo con mesura el confort que los viajeros contemporáneos merecen: calefacción radiante, ropa de cama de algodón egipcio y un pequeño spa de piedra que mana aguas termales del Pirineo.',
  'Desde la terraza panorámica, las cumbres del Cotiella y el Turbón marcan el horizonte al amanecer. En el comedor de vigas, el desayuno se convierte en un ceremonial con miel del Sobrarbe, pan de masa madre y quesos artesanos de las queserías vecinas.',
]

export default function AboutStory() {
  const slice = useLodgingSlice('story')
  const eyebrow = slice?.eyebrow || 'Nuestra historia'
  const title = slice?.title || 'Una casona del siglo XVIII\ndevuelta a la vida'
  const paragraphs = slice?.paragraphs && slice.paragraphs.length > 0 ? slice.paragraphs : DEFAULT_PARAGRAPHS
  const pullQuote = slice?.pullQuote || '“Donde el tiempo se detiene y la naturaleza susurra en cada piedra.”'

  return (
    <section
      className="py-20 md:py-28 px-6 md:px-14 lg:px-20"
      style={{ background: 'var(--color-cream)' }}
      aria-labelledby="story-heading"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        {/* Text side */}
        <div className="order-2 lg:order-1">
          {/* Eyebrow */}
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: 'var(--color-terracotta)' }}
          >
            {eyebrow}
          </p>

          <h2
            id="story-heading"
            className="font-serif text-3xl md:text-4xl font-bold leading-snug text-balance mb-6 whitespace-pre-line"
            style={{ color: 'var(--color-midnight)' }}
          >
            {title}
          </h2>

          <div className="space-y-4 text-base leading-relaxed" style={{ color: 'oklch(0.38 0.02 250)' }}>
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {/* Pull quote */}
          {pullQuote && (
            <blockquote
              className="mt-8 pl-5 border-l-2 italic font-serif text-lg md:text-xl leading-snug"
              style={{ borderColor: 'var(--color-terracotta)', color: 'var(--color-midnight)' }}
            >
              {pullQuote}
            </blockquote>
          )}

          {/* Decorative rule */}
          <div className="mt-10 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: 'oklch(0.86 0.008 80)' }} />
            <span className="font-serif text-xl" style={{ color: 'var(--color-terracotta)' }}>✦</span>
            <div className="h-px flex-1" style={{ background: 'oklch(0.86 0.008 80)' }} />
          </div>
        </div>

        {/* Images side — stacked, slightly overlapping */}
        <div className="order-1 lg:order-2 relative flex justify-center lg:justify-end">
          <div className="relative w-full max-w-sm lg:max-w-none">
            {/* Back image */}
            <div
              className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-xl"
              style={{ marginRight: '2rem' }}
            >
              <Image
                src="/images/about-1.jpg"
                alt="Patio interior de piedra del hotel con arcos medievales"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 90vw, 50vw"
              />
            </div>
            {/* Front image, overlapping */}
            <div
              className="absolute bottom-[-2.5rem] right-0 w-[62%] aspect-[4/3] rounded-xl overflow-hidden shadow-2xl border-4 border-white"
            >
              <Image
                src="/images/about-2.jpg"
                alt="Rincón con chimenea y sillones de cuero del salón del hotel"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 60vw, 30vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export { AboutStory }
