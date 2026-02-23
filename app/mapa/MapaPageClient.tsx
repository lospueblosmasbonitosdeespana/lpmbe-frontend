"use client";

import dynamic from "next/dynamic";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Display, Muted } from "@/app/components/ui/typography";

const PueblosMap = dynamic(
  () => import("@/app/_components/map/PueblosMap"),
  { ssr: false },
);

export default function MapaPageClient() {
  return (
    <main>
      <Section spacing="md" background="default" className="dark:bg-neutral-950">
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
