import Link from "next/link";
import Breadcrumbs from "@/app/_components/ui/Breadcrumbs";
import { Container } from "@/app/components/ui/container";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "La Noche Romántica | Los Pueblos Más Bonitos de España",
  description:
    "Evento destacado de la asociación. Pueblos, hoteles y restaurantes participan en La Noche Romántica.",
};

const breadcrumbItems = [
  { label: "Planifica", href: "/planifica/fin-de-semana" },
  { label: "La Noche Romántica" },
];

export default function LaNocheRomanticaPage() {
  return (
    <main className="min-h-screen bg-background">
      <Container className="py-8 md:py-12">
        <Breadcrumbs items={breadcrumbItems} />

        <header className="mb-12">
          <h1 className="font-serif text-4xl font-medium text-foreground">
            La Noche Romántica
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Un evento muy especial de la asociación en el que participan nuestros
            pueblos, hoteles y restaurantes.
          </p>
        </header>

        {/* Placeholder: espacio para logo, contenido y diseño personalizado */}
        <section className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            Contenido en preparación. Aquí irá el logo, la marca y el diseño
            específico de La Noche Romántica.
          </p>
          <Link
            href="/planifica/fin-de-semana"
            className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
          >
            ← Volver a Planifica
          </Link>
        </section>
      </Container>
    </main>
  );
}
