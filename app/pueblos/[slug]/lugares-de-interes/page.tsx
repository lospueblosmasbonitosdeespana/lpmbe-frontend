import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { getPuebloBySlug, getPuebloBySlugFast } from "@/lib/api";
import { getCanonicalUrl, getLocaleAlternates, seoDescription, seoTitle, slugToTitle, type SupportedLocale } from "@/lib/seo";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Body, Eyebrow } from "@/app/components/ui/typography";
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
  const fallbackName = slugToTitle(slug) || "Pueblo";
  const fallbackPath = `/pueblos/${slug}/lugares-de-interes`;
  const locale = await getLocale();
  const localeSuffix = locale === "es" ? "" : ` (${locale.toUpperCase()})`;
  const pueblo = await getPuebloBySlugFast(slug, locale);
  const safeSlug = pueblo?.slug ?? slug;
  const safeName = pueblo?.nombre ?? fallbackName;
  const path = `/pueblos/${safeSlug}/lugares-de-interes`;
  return {
    title: seoTitle(`Lugares de interés en ${safeName}${localeSuffix}`),
    description: seoDescription(`Descubre los puntos de interés y lugares que no te puedes perder en ${safeName}.${localeSuffix}`),
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: true, follow: true },
  };
}

export default async function LugaresDeInteresPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const pueblo = await getPuebloBySlug(slug, locale).catch(() => null);
  if (!pueblo) {
    return (
      <main className="min-h-screen bg-background">
        <Section spacing="md">
          <Container>
            <div className="rounded-xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
              <h1 className="font-serif text-2xl font-medium text-foreground">Lugares de interés</h1>
              <p className="mt-3 text-muted-foreground">
                No se ha podido cargar este pueblo en este momento.
              </p>
              <Link
                href="/pueblos"
                className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
              >
                Volver a pueblos
              </Link>
            </div>
          </Container>
        </Section>
      </main>
    );
  }

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
              <h1 className="font-serif text-2xl font-medium tracking-tight sm:text-3xl">
                Lugares de interés en {pueblo.nombre}
              </h1>
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
    slug?: string | null;
    nombre: string;
    descripcion_corta?: string | null;
    descripcion_larga?: string | null;
    foto?: string | null;
    rotation?: number | null;
    categoriaTematica?: string | null;
    categoria?: string | null;
  }) => {
    const descLimpia = (poi.descripcion_larga?.replace(/<[^>]*>/g, "") ?? poi.descripcion_corta ?? "").trim();
    return {
      id: poi.id,
      name: poi.nombre,
      type: CATEGORIA_TEMATICA_LABELS[poi.categoriaTematica ?? ""] ?? poi.categoria ?? "Punto de interés",
      description: descLimpia || "",
      image: poi.foto,
      rotation: poi.rotation,
      href: `/pueblos/${slug}/pois/${poi.slug || poi.id}`,
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
            <h1 className="font-serif text-2xl font-medium tracking-tight sm:text-3xl">
              Lugares de interés en {pueblo.nombre}
            </h1>
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
