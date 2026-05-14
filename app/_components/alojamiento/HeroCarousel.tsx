'use client'

import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { MapPin, Star, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react'

const slides = [
  { src: '/images/hero-1.jpg', alt: 'Fachada exterior del Hotel La Posada del Sobrarbe' },
  { src: '/images/hero-2.jpg', alt: 'Habitación superior con vigas de madera y vistas a la montaña' },
  { src: '/images/hero-3.jpg', alt: 'Terraza panorámica con vistas al Pirineo' },
  { src: '/images/hero-4.jpg', alt: 'Spa y zona de bienestar con jacuzzi de piedra' },
]

export default function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 6000, stopOnInteraction: false }),
  ])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap())
    emblaApi.on('select', onSelect)
    onSelect()
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi])

  return (
    <section className="relative h-[92vh] min-h-[600px] overflow-hidden" aria-label="Galería de imágenes del hotel">
      <div className="h-full overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, i) => (
            <div key={i} className="relative flex-none w-full h-full">
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={i === 0}
                className="object-cover animate-kenburns"
                sizes="100vw"
              />
            </div>
          ))}
        </div>
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, oklch(0.12 0.04 250 / 0.92) 0%, oklch(0.12 0.04 250 / 0.45) 45%, transparent 100%)',
        }}
      />

      <div className="absolute inset-0 flex flex-col justify-end pb-16 px-6 md:px-14 lg:px-20 max-w-5xl">
        <div className="flex flex-wrap gap-2 mb-4">
          <span
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase"
            style={{ background: 'var(--color-terracotta)', color: '#fff' }}
          >
            Hotel Rural
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'oklch(1 0 0 / 0.15)', backdropFilter: 'blur(4px)', color: '#fff', border: '1px solid oklch(1 0 0 / 0.25)' }}
          >
            <ShieldCheck size={12} />
            Imprescindible LPMBE
          </span>
        </div>

        <h1
          className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight text-balance mb-3"
        >
          Hotel La Posada<br className="hidden md:block" /> del Sobrarbe
        </h1>

        <p className="text-white/80 text-lg md:text-xl italic font-serif mb-4 text-pretty">
          Donde el tiempo se detiene y el Pirineo susurra
        </p>

        <div className="flex flex-wrap items-center gap-4 text-white/90">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <MapPin size={14} className="opacity-70" />
            Aínsa · Huesca, Aragón
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold">
            <Star size={13} fill="currentColor" style={{ color: 'var(--color-terracotta-light)' }} />
            <span style={{ color: 'var(--color-terracotta-light)' }}>4.8</span>
            <span className="text-white/60 font-normal ml-0.5">· 127 reseñas</span>
          </span>
        </div>
      </div>

      <button
        onClick={scrollPrev}
        aria-label="Imagen anterior"
        className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full transition-all"
        style={{ background: 'oklch(1 0 0 / 0.18)', backdropFilter: 'blur(6px)', border: '1px solid oklch(1 0 0 / 0.3)', color: '#fff' }}
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={scrollNext}
        aria-label="Imagen siguiente"
        className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full transition-all"
        style={{ background: 'oklch(1 0 0 / 0.18)', backdropFilter: 'blur(6px)', border: '1px solid oklch(1 0 0 / 0.3)', color: '#fff' }}
      >
        <ChevronRight size={20} />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            aria-label={`Ir a imagen ${i + 1}`}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === selectedIndex ? '24px' : '8px',
              height: '8px',
              background: i === selectedIndex ? 'var(--color-terracotta)' : 'oklch(1 0 0 / 0.5)',
            }}
          />
        ))}
      </div>
    </section>
  )
}

export { HeroCarousel }
