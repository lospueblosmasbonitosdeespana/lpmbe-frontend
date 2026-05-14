import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface SignatureDish {
  fotoUrl: string;
  nombre: string;
  precio?: string | null;
  wide?: boolean;
}

interface Props {
  eyebrow: string;
  title: string;
  dishes: SignatureDish[];
}

export default function RestauranteSignatureDishes({ eyebrow, title, dishes }: Props) {
  if (dishes.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-muted/40">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10">
          <p className="text-gold uppercase tracking-[0.2em] text-xs font-semibold mb-3">
            {eyebrow}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-foreground text-balance">{title}</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[220px] md:auto-rows-[260px]">
          {dishes.map((dish, i) => (
            <div
              key={`${dish.nombre}-${i}`}
              className={cn(
                'relative rounded-xl overflow-hidden group',
                dish.wide && 'col-span-2',
                i === 0 && 'row-span-2',
              )}
            >
              <Image
                src={dish.fotoUrl}
                alt={dish.nombre}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="font-serif text-white text-base leading-snug mb-1">{dish.nombre}</p>
                {dish.precio && dish.precio !== '—' && (
                  <p className="text-gold text-sm font-semibold">{dish.precio}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
