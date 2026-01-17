import { Hero } from "./_components/home/Hero";
import { NotificacionesFloating } from "./_components/home/NotificacionesFloating";
import { MapTeaser } from "./_components/home/MapTeaser";
import { ThemesSection } from "./_components/home/ThemesSection";
import { RutasSection } from "./_components/home/RutasSection";
import { FeaturedPueblosSection } from "./_components/home/FeaturedPueblosSection";
import { ActualidadSection } from "./_components/home/ActualidadSection";
import { FinalCtaSection } from "./_components/home/FinalCtaSection";
import { getHomeConfig } from "@/lib/homeApi";

export default async function HomePage() {
  // Cargar configuración del home desde el backend
  const config = await getHomeConfig();

  return (
    <main>
      <Hero 
        configHero={config.hero}
        floating={<NotificacionesFloating />} 
      />
      <div className="pt-20">
        <MapTeaser />
        <ThemesSection themes={config.themes} />
        {config.homeRutas.enabled && (
          <RutasSection 
            count={config.homeRutas.count}
            enabled={config.homeRutas.enabled}
          />
        )}
        <FeaturedPueblosSection />
        <ActualidadSection limit={config.actualidad.limit} />
        <FinalCtaSection />
      </div>
    </main>
  );
}

