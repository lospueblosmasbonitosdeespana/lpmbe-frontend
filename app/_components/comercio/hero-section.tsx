'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import type { HeroConfig } from './comercio-config'

interface HeroSectionProps {
  config: HeroConfig
}

export function HeroSection({ config }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const autoplayPlugin = Autoplay({
    delay: 6000,
    stopOnInteraction: false,
    stopOnMouseEnter: true,
  })

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    prefersReducedMotion ? [] : [autoplayPlugin]
  )

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCurrentSlide(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  )

  return (
    <section className="relative h-screen min-h-[600px] w-full overflow-hidden">
      {/* Carousel */}
      <div className="absolute inset-0" ref={emblaRef}>
        <div className="flex h-full">
          {config.slides.map((slide, index) => (
            <div key={index} className="relative h-full min-w-full flex-none">
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={index === 0}
                className={`object-cover ${
                  currentSlide === index && !prefersReducedMotion
                    ? 'animate-ken-burns'
                    : ''
                }`}
                sizes="100vw"
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
            </div>
          ))}
        </div>
      </div>

      {/* Content overlay */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center text-primary-foreground">
        {/* Eyebrow */}
        <span className="small-caps mb-4 inline-block rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-1.5 text-xs font-medium tracking-wider backdrop-blur-sm">
          {config.eyebrow}
        </span>

        {/* Title */}
        <h1 className="mb-4 max-w-4xl font-serif text-4xl font-bold leading-tight text-balance md:text-6xl lg:text-7xl">
          {config.title}
        </h1>

        {/* Tagline */}
        <p className="mb-6 max-w-2xl font-serif text-lg italic text-primary-foreground/90 md:text-xl">
          {config.tagline}
        </p>

        {/* Badges */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {config.badges.map((badge, index) => (
            <span
              key={index}
              className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium backdrop-blur-sm"
            >
              {badge.text}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button
            asChild
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <a href={config.ctaPrimary.href}>{config.ctaPrimary.text}</a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-primary-foreground/50 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
          >
            <a href={config.ctaSecondary.href}>{config.ctaSecondary.text}</a>
          </Button>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-24 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {config.slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            aria-label={`Ir a slide ${index + 1}`}
            className={`h-2 rounded-full transition-all ${
              currentSlide === index
                ? 'w-8 bg-primary-foreground'
                : 'w-2 bg-primary-foreground/50 hover:bg-primary-foreground/70'
            }`}
          />
        ))}
      </div>

      {/* Scroll hint pill */}
      <a
        href="#conocenos"
        className="absolute bottom-8 left-8 z-10 flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm text-primary-foreground backdrop-blur-sm transition-colors hover:bg-primary-foreground/20"
      >
        <ChevronDown className="h-4 w-4" />
        Conócenos
      </a>
    </section>
  )
}
