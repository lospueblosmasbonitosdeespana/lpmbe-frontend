import { Hero } from "./_components/home/Hero";
import { NotificacionesFloating } from "./_components/home/NotificacionesFloating";
import { MapTeaser } from "./_components/home/MapTeaser";
import { ThemesSection } from "./_components/home/ThemesSection";
import { FeaturedPueblosSection } from "./_components/home/FeaturedPueblosSection";
import { ActualidadSection } from "./_components/home/ActualidadSection";
import { FinalCtaSection } from "./_components/home/FinalCtaSection";

export default function HomePage() {
  return (
    <main>
      <Hero floating={<NotificacionesFloating />} />
      <div className="pt-20">
        <MapTeaser />
        <ThemesSection />
        <FeaturedPueblosSection />
        <ActualidadSection />
        <FinalCtaSection />
      </div>
    </main>
  );
}

