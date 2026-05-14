import Image from 'next/image';
import { Star } from 'lucide-react';

interface Props {
  descripcion: string;
  secondaryImage?: string;
  nombre: string;
  ratingVerificado?: { rating: number | null; reviews: number | null } | null;
  puntosClub?: number | null;
  t: (key: string) => string;
}

export default function PremiumDescription({ descripcion, secondaryImage, nombre, ratingVerificado, puntosClub, t }: Props) {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className={`grid ${secondaryImage ? 'lg:grid-cols-2' : ''} gap-12 lg:gap-20 items-start`}>
          <div>
            <p className="text-gold text-sm tracking-[0.2em] uppercase mb-3">
              {t('aboutSubtitle')}
            </p>
            <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-8">
              {t('aboutTitle')}
            </h2>
            <div
              className="prose prose-lg max-w-none text-muted-foreground leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: descripcion }}
            />

            {(ratingVerificado?.rating || puntosClub) && (
              <div className="flex flex-wrap gap-8 mt-10 pt-10 border-t border-border">
                {ratingVerificado?.rating && (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Star className="size-5 text-gold" fill="currentColor" />
                      <p className="text-3xl md:text-4xl font-serif text-gold">
                        {ratingVerificado.rating.toFixed(1)}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Google{ratingVerificado.reviews ? ` (${ratingVerificado.reviews})` : ''}
                    </p>
                  </div>
                )}
                {puntosClub != null && puntosClub > 0 && (
                  <div>
                    <p className="text-3xl md:text-4xl font-serif text-gold">{puntosClub}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('clubPoints')}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {secondaryImage && (
            <div className="relative hidden lg:block">
              <div className="aspect-[4/5] rounded-lg overflow-hidden">
                <Image
                  src={secondaryImage}
                  alt={nombre}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 40vw, 0"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 w-full h-full border-2 border-gold/20 rounded-lg -z-10" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
