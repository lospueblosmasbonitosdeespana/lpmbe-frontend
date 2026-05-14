'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight, MapPin, Star, Crown } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { cn } from '@/lib/utils';

type Imagen = { id: number; url: string; alt: string | null; orden: number };

interface Props {
  images: Imagen[];
  nombre: string;
  tipoLabel: string;
  tagline?: string;
  badges?: string[];
  pueblo?: { id: number; nombre: string; slug: string } | null;
  ubicacionExtra?: string | null;
  imprescindible?: boolean;
  ratingVerificado?: { rating: number | null; reviews: number | null } | null;
  cerradoTemporal?: boolean;
  t: (key: string) => string;
}

export default function RestauranteHeroSection({
  images,
  nombre,
  tipoLabel,
  tagline,
  badges,
  pueblo,
  ubicacionExtra,
  imprescindible,
  ratingVerificado,
  cerradoTemporal,
  t,
}: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: true }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  if (images.length === 0) {
    return (
      <section className="relative w-full bg-muted aspect-[16/9] md:aspect-[21/9] flex items-center justify-center">
        <p className="text-muted-foreground">{t('noPhotos')}</p>
      </section>
    );
  }

  const ubicacionTexto = [pueblo?.nombre, ubicacionExtra].filter(Boolean).join(' · ');

  return (
    <section className="relative w-full overflow-hidden" aria-label={nombre}>
      <div className="overflow-hidden aspect-[4/3] md:aspect-[16/9]" ref={emblaRef}>
        <div className="flex h-full">
          {images.map((image, index) => (
            <div key={image.id} className="relative flex-none w-full h-full">
              <Image
                src={image.url}
                alt={image.alt ?? nombre}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="100vw"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 pb-8 md:pb-16">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="text-gold uppercase tracking-[0.2em] text-xs font-sans font-semibold">
              {tipoLabel}
            </span>
            <Badge className="bg-gold text-foreground border-0 rounded-full px-3 py-0.5 text-xs font-semibold">
              <Crown className="size-3 mr-1" />
              Premium Club LPMBE
            </Badge>
            {imprescindible && (
              <Badge className="bg-amber-500/90 text-white border-0 rounded-full px-3 py-0.5 text-xs font-semibold">
                {t('imprescindible')}
              </Badge>
            )}
            {(badges ?? []).map((b) => (
              <Badge
                key={b}
                className="bg-white/15 text-white border border-white/30 rounded-full px-3 py-0.5 text-xs font-semibold backdrop-blur-sm"
              >
                {b}
              </Badge>
            ))}
            {cerradoTemporal && (
              <Badge className="bg-red-500/90 text-white border-0 rounded-full px-3 py-0.5 text-xs font-semibold">
                {t('cerradoTemporal')}
              </Badge>
            )}
          </div>

          <h1 className="font-serif text-5xl md:text-6xl text-white text-balance leading-tight mb-2">
            {nombre}
          </h1>

          {tagline && (
            <p className="font-serif italic text-white/80 text-lg md:text-xl mb-4">{tagline}</p>
          )}

          <div className="flex flex-wrap items-center gap-5">
            {ubicacionTexto && (
              <span className="flex items-center gap-1.5 text-white/70 text-sm">
                <MapPin className="size-4 text-gold" />
                {ubicacionTexto}
              </span>
            )}
            {ratingVerificado?.rating != null && (
              <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1">
                <Star className="size-3.5 fill-gold text-gold" />
                <span className="text-white text-sm font-semibold">
                  {ratingVerificado.rating.toFixed(1)}
                </span>
                {ratingVerificado.reviews != null && (
                  <span className="text-white/60 text-xs">({ratingVerificado.reviews} {t('reviews')})</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            aria-label={t('prevImage')}
            className="absolute left-4 top-1/2 -translate-y-1/2 size-11 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={scrollNext}
            aria-label={t('nextImage')}
            className="absolute right-4 top-1/2 -translate-y-1/2 size-11 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="absolute bottom-6 right-6 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`${t('goToSlide')} ${i + 1}`}
                className={cn(
                  'rounded-full transition-all duration-300',
                  i === selectedIndex ? 'bg-gold w-6 h-2' : 'bg-white/40 w-2 h-2 hover:bg-white/70',
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
