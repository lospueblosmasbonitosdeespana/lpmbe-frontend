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

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  WIFI: 'Conexión Wi-Fi gratuita y de alta velocidad en todas las áreas',
  PARKING: 'Aparcamiento privado disponible para huéspedes',
  PISCINA: 'Piscina exterior con zona de relax y tumbonas',
  AC: 'Aire acondicionado en todas las habitaciones y zonas comunes',
  TERRAZA: 'Terraza con vistas para disfrutar del entorno',
  JARDIN: 'Jardín cuidado para pasear y desconectar',
  MASCOTAS: 'Admitimos mascotas para que viajes con tu compañero peludo',
  ACCESIBLE: 'Instalaciones adaptadas para movilidad reducida',
  DESAYUNO: 'Desayuno casero con productos locales incluido',
  MEDIA_PENSION: 'Cena artesanal de cocina tradicional',
  SPA: 'Spa con tratamientos de bienestar y relajación',
  CHIMENEA: 'Chimenea encendida los meses fríos para acogedoras veladas',
  COCINA: 'Cocina equipada para preparar tus propias comidas',
  LAVADORA: 'Lavadora a disposición para estancias largas',
  TV: 'Televisión con canales nacionales e internacionales',
  CALEFACCION: 'Calefacción central para el confort en cualquier estación',
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicios.map((servicio) => {
            const Icon = ICON_MAP[servicio.icon] ?? Sparkles;
            const description = SERVICE_DESCRIPTIONS[servicio.key] ?? '';
            return (
              <div
                key={servicio.key}
                className="group flex gap-4 p-6 bg-card rounded-lg border border-border hover:border-gold/30 transition-all duration-300"
              >
                <div className="size-10 shrink-0 rounded-full bg-muted flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                  <Icon className="size-5 text-primary group-hover:text-gold transition-colors" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground mb-1.5">
                    {servicio.label}
                  </h3>
                  {description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
