import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { getPuebloBySlug } from "@/lib/api";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Title, Body, Eyebrow } from "@/app/components/ui/typography";
import { PointsOfInterest } from "@/app/components/pueblos/PointsOfInterest";
import ParadasMap from "@/app/_components/ParadasMap";

export const dynamic = "force-dynamic";

const CATEGORIA_TEMATICA_LABELS: Record<string, string> = {
  GASTRONOMIA: "Gastronomía",
  NATURALEZA: "Naturaleza",
  CULTURA: "Cultura",
  PATRIMONIO: "Patrimonio",
  EN_FAMILIA: "En familia",
  PETFRIENDLY: "Petfriendly",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const pueblo = await getPuebloBySlug(slug, locale);
  return {
    title: `Lugares de interés en ${pueblo.nombre} – Los Pueblos Más Bonitos de España`,
    description: `Descubre los puntos de interés y lugares que no te puedes perder en ${pueblo.nombre}.`,
  };
}

export default async function LugaresDeInteresPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const pueblo = await getPuebloBySlug(slug, locale);

  const pois = (pueblo.pois ?? []).filter((p: { categoria?: string }) => p.categoria === "POI");

  if (pois.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <Section spacing="md">
          <Container>
            <nav className="mb-6 text-sm text-muted-foreground">
              <Link href="/pueblos" className="hover:text-foreground">Pueblos</Link>
              <span className="mx-2">/</span>
              <Link href={`/pueblos/${slug}`} className="hover:text-foreground">{pueblo.nombre}</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">Lugares de interés</span>
            </nav>
            <div className="mb-10">
              <Eyebrow className="mb-2">Qué ver</Eyebrow>
              <Title as="h2">Lugares de interés en {pueblo.nombre}</Title>
              <Body className="mt-2 text-muted-foreground">
                No hay lugares de interés disponibles para este pueblo.
              </Body>
            </div>
            <div className="rounded-xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
              <p className="text-muted-foreground">No hay puntos de interés registrados.</p>
              <Link
                href={`/pueblos/${slug}`}
                className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
              >
                ← Volver a {pueblo.nombre}
              </Link>
            </div>
          </Container>
        </Section>
      </main>
    );
  }

  const paradasParaMapa = pois
    .filter((p: { lat?: number | null; lng?: number | null }) => p.lat != null && p.lng != null)
    .map((p: { id: number; nombre: string; lat: number; lng: number }) => ({
      titulo: p.nombre,
      lat: p.lat,
      lng: p.lng,
    }));

  const pointsForList = pois.map((poi: {
    id: number;
    nombre: string;
    descripcion_corta?: string | null;
    descripcion_larga?: string | null;
    foto?: string | null;
    rotation?: number | null;
    categoriaTematica?: string | null;
    categoria?: string | null;
  }) => {
    const descLimpia = (poi.descripcion_corta ?? poi.descripcion_larga?.replace(/<[^>]*>/g, "") ?? "").trim();
    return {
      id: poi.id,
      name: poi.nombre,
      type: CATEGORIA_TEMATICA_LABELS[poi.categoriaTematica ?? ""] ?? poi.categoria ?? "Punto de interés",
      description: descLimpia || "",
      image: poi.foto,
      rotation: poi.rotation,
      href: `/pueblos/${slug}/pois/${poi.id}`,
    };
  });

  return (
    <main className="min-h-screen bg-background">
      <Section spacing="md">
        <Container>
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link href="/pueblos" className="hover:text-foreground">Pueblos</Link>
            <span className="mx-2">/</span>
            <Link href={`/pueblos/${slug}`} className="hover:text-foreground">{pueblo.nombre}</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Lugares de interés</span>
          </nav>

          <div className="mb-10">
            <Eyebrow className="mb-2">Qué ver</Eyebrow>
            <Title as="h2">Lugares de interés en {pueblo.nombre}</Title>
            <Body className="mt-2 text-muted-foreground">
              {pois.length} {pois.length === 1 ? "punto de interés" : "puntos de interés"} para descubrir
            </Body>
          </div>

          {/* Mapa con todos los POIs */}
          {paradasParaMapa.length > 0 && (
            <div className="mb-12">
              <h3 className="mb-4 font-serif text-xl font-medium">Mapa de lugares</h3>
              <ParadasMap paradas={paradasParaMapa} puebloNombre={pueblo.nombre} />
            </div>
          )}

          {/* Listado de POIs con descripción completa */}
          <div className="mt-12">
            <h3 className="mb-4 font-serif text-xl font-medium">Descripción de cada lugar</h3>
            <PointsOfInterest
              hideHeader
              maxItems={0}
              showFullDescription
              points={pointsForList}
            />
          </div>

          <div className="mt-12 text-center">
            <Link
              href={`/pueblos/${slug}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              ← Volver a {pueblo.nombre}
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
