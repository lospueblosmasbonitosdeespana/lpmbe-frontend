import Image from 'next/image';

export interface AmbienteBlock {
  fotoUrl: string;
  alt?: string | null;
  title: string;
  body: string;
  imageLeft?: boolean;
}

interface Props {
  blocks: AmbienteBlock[];
}

export default function RestauranteAmbienteSection({ blocks }: Props) {
  if (blocks.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-6 space-y-16 md:space-y-24">
        {blocks.map((b, i) => {
          const imageLeft = b.imageLeft !== false ? i % 2 === 0 : false;
          return (
            <div
              key={`${b.title}-${i}`}
              className={`grid md:grid-cols-2 gap-10 lg:gap-16 items-center ${
                imageLeft ? '' : 'md:[&>:first-child]:order-last'
              }`}
            >
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border">
                <Image
                  src={b.fotoUrl}
                  alt={b.alt ?? b.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div>
                <div className="w-8 h-0.5 bg-gold mb-5" />
                <h3 className="font-serif text-2xl md:text-3xl text-foreground mb-5">{b.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{b.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
