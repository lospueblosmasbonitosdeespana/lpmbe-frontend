import { Card } from '@/app/components/ui/card';
import { Leaf, CalendarDays, Wine, Flame, Sprout, Utensils } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const PILLAR_ICONS: Record<string, LucideIcon> = {
  leaf: Leaf,
  calendar: CalendarDays,
  wine: Wine,
  flame: Flame,
  sprout: Sprout,
  utensils: Utensils,
};

export interface PhilosophyPillar {
  icon: string;
  title: string;
  desc: string;
}

interface Props {
  eyebrow: string;
  title: string;
  pillars: PhilosophyPillar[];
}

export default function RestauranteCuisinePhilosophy({ eyebrow, title, pillars }: Props) {
  return (
    <section className="py-16 md:py-24 bg-muted/40">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-gold uppercase tracking-[0.2em] text-xs font-semibold mb-3">
            {eyebrow}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-foreground text-balance">{title}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map((p) => {
            const Icon = PILLAR_ICONS[p.icon] ?? Leaf;
            return (
              <Card
                key={p.title}
                className="p-8 border border-border bg-card hover:border-gold/30 transition-all duration-300 group"
              >
                <div className="size-12 rounded-full border border-gold/40 bg-gold/10 flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors">
                  <Icon className="size-5 text-gold" />
                </div>
                <h3 className="font-serif text-xl text-foreground mb-3">{p.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{p.desc}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
