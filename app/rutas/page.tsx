import type { Metadata } from "next";
import { getRutas, type Ruta } from "@/lib/api";
import { createExcerpt } from "@/lib/sanitizeHtml";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Grid } from "@/app/components/ui/grid";
import { ListingCard } from "@/app/components/ui/listing-card";

export const metadata: Metadata = {
  title: "Rutas – Los Pueblos Más Bonitos de España",
  description: "Descubre rutas turísticas por los pueblos más bonitos de España",
};

export const dynamic = "force-dynamic";
export const revalidate = 300;

function mapRutaToCardData(ruta: Ruta) {
  const metadataParts: string[] = [];
  if (ruta.dificultad) metadataParts.push(ruta.dificultad);
  if (ruta.distancia != null) metadataParts.push(`${ruta.distancia} km`);
  if (ruta.tiempo != null) metadataParts.push(`${ruta.tiempo}h`);
  if (ruta.tipo) metadataParts.push(ruta.tipo);

  return {
    title: ruta.titulo,
    href: `/rutas/${ruta.slug}`,
    image: ruta.foto_portada || "/hero/1.jpg",
    imageAlt: ruta.titulo,
    metadata: metadataParts.length > 0 ? metadataParts.join(" • ") : undefined,
    description: ruta.descripcion ? createExcerpt(ruta.descripcion, 120) : undefined,
    badge: ruta.dificultad || undefined,
    aspect: "landscape" as const,
  };
}

export default async function RutasPage() {
  const rutas = await getRutas();
  const rutasActivas = rutas.filter((r) => r.activo);
  const items = rutasActivas.map(mapRutaToCardData);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg-section)" }}>
      {/* Header - diseño V0 (centered, igual que pueblos) */}
      <section className="bg-white/80 py-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-gray-500">
            Descubre
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-gray-900 md:text-4xl">
            Rutas
          </h1>
          <p className="mt-2 text-base text-gray-600">
            {rutasActivas.length}{" "}
            {rutasActivas.length === 1 ? "ruta" : "rutas"} para explorar los pueblos más bonitos
          </p>
        </div>
      </section>

      {/* Grid - preset routes: 3 cols, landscape, con descripción */}
      <Section background="muted" spacing="lg">
        <Container>
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">No hay rutas disponibles en este momento.</p>
            </div>
          ) : (
            <Grid columns={3} gap="lg">
              {items.map((item, index) => (
                <ListingCard
                  key={index}
                  data={item}
                  layout="vertical"
                  aspect="landscape"
                  size="default"
                  showDescription
                />
              ))}
            </Grid>
          )}
        </Container>
      </Section>
    </main>
  );
}
