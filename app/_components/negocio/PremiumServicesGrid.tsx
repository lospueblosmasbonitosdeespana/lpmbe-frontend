import {
  Wifi, Car, Waves, Wind, Sun, TreePine, Dog, Accessibility,
  Coffee, UtensilsCrossed, Sparkles, Flame, CookingPot, WashingMachine,
  Tv, Heater,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  wifi: Wifi,
  parking: Car,
  pool: Waves,
  ac: Wind,
  terraza: Sun,
  jardin: TreePine,
  mascotas: Dog,
  accesible: Accessibility,
  desayuno: Coffee,
  media_pension: UtensilsCrossed,
  spa: Sparkles,
  chimenea: Flame,
  cocina: CookingPot,
  lavadora: WashingMachine,
  tv: Tv,
  calefaccion: Heater,
};

interface Props {
  servicios: { key: string; label: string; icon: string }[];
  t: (key: string) => string;
}

export default function PremiumServicesGrid({ servicios, t }: Props) {
  return (
    <section className="py-16 md:py-20 px-6 md:px-12 lg:px-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <p className="text-gold text-xs tracking-[0.2em] uppercase mb-2">
            {t('servicesSubtitle')}
          </p>
          <h2 className="text-3xl md:text-4xl font-serif text-foreground">
            {t('servicesTitle')}
          </h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
          {servicios.map((servicio) => {
            const Icon = ICON_MAP[servicio.icon] ?? Sparkles;
            return (
              <div
                key={servicio.key}
                className="group flex flex-col items-center gap-2 px-2 py-4 bg-card rounded-lg border border-border hover:border-gold/30 transition-all text-center"
              >
                <div className="size-9 rounded-full bg-muted flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                  <Icon className="size-4 text-primary group-hover:text-gold transition-colors" />
                </div>
                <span className="text-xs font-medium text-foreground leading-tight">
                  {servicio.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
