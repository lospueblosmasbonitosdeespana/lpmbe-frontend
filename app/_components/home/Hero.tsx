import { homeConfig } from "./home.config";
import { HeroSlider } from "./HeroSlider";
import type { HomeConfig } from "@/lib/homeApi";

type HeroProps = {
  configHero?: HomeConfig["hero"];
  floating?: React.ReactNode;
};

export function Hero({ configHero, floating }: HeroProps) {
  // Usar config del backend o fallback local
  const hero = configHero ?? homeConfig.hero;

  // Convertir slides a formato para HeroSlider
  // En admin se muestran todas (incluso hidden)
  // En público el backend ya filtra
  const slides = (hero?.slides || [])
    .filter((s) => typeof s.image === 'string' && s.image.length > 0)
    .map((s) => ({ image: s.image, alt: s.alt || '' }));

  return (
    <section className="relative h-[420px] md:h-[520px] overflow-hidden">
      <HeroSlider
        slides={slides}
        intervalMs={hero?.intervalMs ?? 6000}
        showControls
      />

      {/* Overlay en 2 capas: base + degradado inferior */}
      <div className="pointer-events-none absolute inset-0 bg-black/35" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center px-4">
        <h1 className="font-display text-3xl font-semibold text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)] md:text-5xl">
          {hero?.title ?? "Los Pueblos Más Bonitos de España"}
        </h1>
        <p className="mt-4 max-w-xl text-sm text-white/85 md:text-base">
          {hero?.subtitle ?? ""}
        </p>
      </div>

      {/* Panel flotante existente: NO CAMBIAR lógica */}
      {floating ? (
        <div className="absolute z-50 left-1/2 bottom-[-48px] w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2">
          {floating}
        </div>
      ) : null}
    </section>
  );
}

