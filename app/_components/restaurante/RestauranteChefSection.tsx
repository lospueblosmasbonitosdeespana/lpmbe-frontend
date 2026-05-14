import Image from 'next/image';
import { Card } from '@/app/components/ui/card';
import { ChefHat, Award, MapPin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const STAT_ICONS: Record<string, LucideIcon> = {
  'chef-hat': ChefHat,
  award: Award,
  'map-pin': MapPin,
};

export interface ChefStat {
  icon: string;
  label: string;
  value: string;
}

interface Props {
  eyebrow: string;
  nombre: string;
  fotoUrl: string;
  fotoAlt: string;
  bio: string[];
  stats?: ChefStat[];
}

export default function RestauranteChefSection({ eyebrow, nombre, fotoUrl, fotoAlt, bio, stats }: Props) {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden border border-border relative">
              <Image
                src={fotoUrl}
                alt={fotoAlt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b-2 border-r-2 border-gold rounded-br-2xl pointer-events-none" />
            <div className="absolute -top-4 -left-4 w-24 h-24 border-t-2 border-l-2 border-gold rounded-tl-2xl pointer-events-none" />
          </div>

          <div>
            <p className="text-gold uppercase tracking-[0.2em] text-xs font-semibold mb-3">
              {eyebrow}
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-5 text-balance">
              {nombre}
            </h2>
            <div className="w-12 h-px bg-gold mb-6" />
            {bio.map((parrafo, i) => (
              <p
                key={i}
                className={`text-muted-foreground leading-relaxed ${i < bio.length - 1 ? 'mb-4' : 'mb-8'}`}
              >
                {parrafo}
              </p>
            ))}

            {stats && stats.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {stats.map((stat) => {
                  const Icon = STAT_ICONS[stat.icon] ?? Award;
                  return (
                    <Card
                      key={stat.label}
                      className="p-4 border border-border bg-card hover:border-gold/30 transition-colors text-center"
                    >
                      <Icon className="size-5 text-gold mx-auto mb-2" />
                      <p className="font-serif text-base font-semibold text-foreground leading-tight mb-0.5">
                        {stat.value}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        {stat.label}
                      </p>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
