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
    <section className="py-16 md:py-24 px-6 md:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-gold text-sm tracking-[0.2em] uppercase mb-3">
            {t('servicesSubtitle')}
          </p>
          <h2 className="text-3xl md:text-4xl font-serif text-foreground">
            {t('servicesTitle')}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {servicios.map((servicio) => {
            const Icon = ICON_MAP[servicio.icon] ?? Sparkles;
            return (
              <div
                key={servicio.key}
                className="group flex flex-col items-center gap-3 p-6 bg-card rounded-lg border border-border hover:border-gold/30 transition-all duration-300 hover:shadow-lg text-center"
              >
                <div className="size-14 rounded-full bg-muted flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                  <Icon className="size-7 text-primary group-hover:text-gold transition-colors" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {servicio.label}
                </h3>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
