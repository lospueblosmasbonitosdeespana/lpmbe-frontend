import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Display, Muted } from "@/app/components/ui/typography";

const PueblosMap = dynamic(
  () => import("@/app/_components/map/PueblosMap"),
  { ssr: false },
);

export const metadata: Metadata = {
  title: "Mapa interactivo | Los Pueblos Más Bonitos de España",
  description:
    "Explora el mapa interactivo con todos los pueblos más bonitos de España. Descubre su ubicación y planifica tu próxima escapada.",
};

export default function MapaPage() {
  return (
    <main>
      <Section spacing="md" background="default">
        <Container>
          <div className="mb-6 text-center">
            <Display className="mb-2">Mapa interactivo</Display>
            <Muted className="mx-auto max-w-xl text-base">
              Explora los 126 pueblos de nuestra red. Pulsa sobre un marcador
              para ver su nombre, provincia y acceder a su ficha.
            </Muted>
          </div>
          <PueblosMap />
        </Container>
      </Section>
    </main>
  );
}
