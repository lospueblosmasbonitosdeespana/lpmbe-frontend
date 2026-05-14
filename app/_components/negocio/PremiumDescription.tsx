import Image from 'next/image';

interface Stat {
  value: string;
  label: string;
}

interface Props {
  descripcion: string;
  secondaryImage?: string;
  nombre: string;
  stats?: Stat[];
  t: (key: string) => string;
}

export default function PremiumDescription({ descripcion, secondaryImage, nombre, stats, t }: Props) {
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

            {stats && stats.length > 0 && (
              <div className={`grid ${stats.length === 3 ? 'grid-cols-3' : stats.length === 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-6 mt-10 pt-10 border-t border-border`}>
                {stats.map((stat, i) => (
                  <div key={i}>
                    <p className="text-3xl md:text-4xl font-serif text-gold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {secondaryImage && (
            <div className="relative hidden lg:block">
              <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
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
