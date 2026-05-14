'use client';

import * as React from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Star, Award, MapPin } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, useCarousel, type CarouselApi } from '@/app/components/ui/carousel';
import { cn } from '@/lib/utils';

type Imagen = { id: number; url: string; alt: string | null; orden: number };

interface Props {
  images: Imagen[];
  nombre: string;
  tipoLabel: string;
  tagline?: string;
  pueblo?: { id: number; nombre: string; slug: string } | null;
  imprescindible?: boolean;
  ratingVerificado?: { rating: number | null; reviews: number | null } | null;
  cerradoTemporal?: boolean;
  t: (key: string) => string;
}

export default function PremiumHeroGallery({ images, nombre, tipoLabel, tagline, pueblo, imprescindible, ratingVerificado, cerradoTemporal, t }: Props) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on('select', () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  if (images.length === 0) {
    return (
      <section className="relative w-full bg-muted aspect-[16/9] md:aspect-[21/9] flex items-center justify-center">
        <p className="text-muted-foreground">{t('noPhotos')}</p>
      </section>
    );
  }

  return (
    <section className="relative w-full">
      <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
        <CarouselContent className="ml-0">
          {images.map((image, index) => (
            <CarouselItem key={image.id} className="pl-0">
              <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden">
                <Image
                  src={image.url}
                  alt={image.alt || nombre}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {images.length > 1 && (
          <>
            <button
              onClick={() => api?.scrollPrev()}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 size-12 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-card transition-colors"
              aria-label={t('prevImage')}
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              onClick={() => api?.scrollNext()}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 size-12 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-card transition-colors"
              aria-label={t('nextImage')}
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}

        {/* Hero overlay content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="text-gold text-sm md:text-base tracking-[0.15em] uppercase font-medium">
                {tipoLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/90 px-3 py-1 text-xs font-bold text-foreground">
                <Award className="size-3.5" />
                Premium Club LPMBE
              </span>
              {imprescindible && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-3 py-1 text-xs font-bold text-white">
                  <Star className="size-3.5" fill="currentColor" />
                  {t('imprescindible')}
                </span>
              )}
              {cerradoTemporal && (
                <span className="rounded-full bg-red-500/90 px-3 py-1 text-xs font-bold text-white">
                  {t('cerradoTemporal')}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif text-card leading-tight">
              {nombre}
            </h1>
            {tagline && (
              <p className="text-card/85 mt-4 text-base md:text-lg italic max-w-2xl">
                {tagline}
              </p>
            )}
            {pueblo && (
              <p className="text-card/80 mt-3 text-base md:text-lg flex items-center gap-2">
                <MapPin className="size-4 md:size-5" />
                {pueblo.nombre}
              </p>
            )}
            {ratingVerificado?.rating && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1 rounded-full bg-card/20 backdrop-blur-sm px-3 py-1">
                  <Star className="size-4 text-gold" fill="currentColor" />
                  <span className="text-card text-sm font-semibold">{ratingVerificado.rating.toFixed(1)}</span>
                  {ratingVerificado.reviews && (
                    <span className="text-card/70 text-sm">({ratingVerificado.reviews})</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dots indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-6 right-6 md:right-12 flex items-center gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  'size-2 rounded-full transition-all',
                  current === index ? 'bg-gold w-6' : 'bg-card/50 hover:bg-card/80',
                )}
                aria-label={`${t('goToSlide')} ${index + 1}`}
              />
            ))}
          </div>
        )}
      </Carousel>
    </section>
  );
}
