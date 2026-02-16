import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getLocale } from "next-intl/server";
import { getPuebloBySlug, getApiUrl } from "@/lib/api";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Title, Body, Eyebrow } from "@/app/components/ui/typography";
import { PointsOfInterest } from "@/app/components/pueblos/PointsOfInterest";

export const dynamic = "force-dynamic";

const CATEGORY_TO_SLUG: Record<string, string> = {
  GASTRONOMIA: "gastronomia",
  NATURALEZA: "naturaleza",
  CULTURA: "cultura",
  PATRIMONIO: "patrimonio",
  EN_FAMILIA: "en-familia",
  PETFRIENDLY: "petfriendly",
};

const CATEGORIA_LABEL: Record<string, string> = {
  NATURALEZA: "NATURALEZA",
  CULTURA: "CULTURA",
  PATRIMONIO: "PATRIMONIO",
  GASTRONOMIA: "GASTRONOMÍA",
  EN_FAMILIA: "EN FAMILIA",
  PETFRIENDLY: "PETFRIENDLY",
};

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
    title: `Lugares a visitar en ${pueblo.nombre} – Los Pueblos Más Bonitos de España`,
    description: `Puntos de interés, rutas y experiencias para descubrir ${pueblo.nombre}.`,
  };
}

export default async function LugaresPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const API_BASE = getApiUrl();
  const langQs = locale ? `?lang=${encodeURIComponent(locale)}` : "";
  const [pueblo, pagesRes] = await Promise.all([
    getPuebloBySlug(slug, locale),
    fetch(`${API_BASE}/public/pueblos/${slug}/pages${langQs}`, { cache: "no-store" }).catch(() => null),
  ]);

  const pois = (pueblo.pois ?? []).filter((p: any) => p.categoria === "POI");
  let paginasTematicas: Array<{ id: number; titulo: string; coverUrl: string | null; category: string }> = [];
  if (pagesRes?.ok) {
    try {
      const pagesData = await pagesRes.json();
      paginasTematicas = Object.entries(pagesData)
        .filter(([, v]) => v && typeof v === "object" && "titulo" in v)
        .map(([cat, p]) => {
          const page = p as { id: number; titulo: string; coverUrl?: string | null };
          return {
            id: page.id,
            titulo: page.titulo,
            coverUrl: page.coverUrl ?? null,
            category: cat,
          };
        });
    } catch {
      // ignorar
    }
  }

  const tieneContenido = pois.length > 0 || paginasTematicas.length > 0;

  if (!tieneContenido) {
    return (
      <main className="bg-background min-h-screen">
        <Section spacing="md">
          <Container>
            <nav className="mb-6 text-sm text-muted-foreground">
              <Link href="/pueblos" className="hover:text-foreground">Pueblos</Link>
              <span className="mx-2">/</span>
              <Link href={`/pueblos/${slug}`} className="hover:text-foreground">{pueblo.nombre}</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">Lugares a visitar</span>
            </nav>
            <div className="mb-10">
              <Eyebrow className="mb-2">Qué ver</Eyebrow>
              <Title as="h2">Lugares a visitar en {pueblo.nombre}</Title>
              <Body className="mt-2 text-muted-foreground">
                Puntos de interés y rutas para descubrir el pueblo.
              </Body>
            </div>
            <div className="rounded-xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
              <p className="text-muted-foreground">
                No hay lugares disponibles para este pueblo.
              </p>
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

  return (
    <main className="bg-background min-h-screen">
      <Section spacing="md">
        <Container>
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link href="/pueblos" className="hover:text-foreground">Pueblos</Link>
            <span className="mx-2">/</span>
            <Link href={`/pueblos/${slug}`} className="hover:text-foreground">{pueblo.nombre}</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Lugares a visitar</span>
          </nav>

          <div className="mb-10">
            <Eyebrow className="mb-2">Qué ver</Eyebrow>
            <Title as="h2">Lugares a visitar en {pueblo.nombre}</Title>
            <Body className="mt-2 text-muted-foreground">
              Puntos de interés, rutas y experiencias para descubrir el pueblo.
            </Body>
          </div>

          {/* Páginas temáticas */}
          {paginasTematicas.length > 0 && (
            <div className="mb-16">
              <h3 className="mb-4 font-serif text-xl font-medium">Páginas temáticas</h3>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {paginasTematicas.map((p) => (
                  <Link
                    key={p.id}
                    href={`/pueblos/${slug}/categoria/${CATEGORY_TO_SLUG[p.category] || p.category.toLowerCase()}`}
                    className="group block"
                  >
                    <article>
                      {p.coverUrl && (
                        <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-muted">
                          <Image
                            src={p.coverUrl}
                            alt={p.titulo}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="mt-3">
                        <span className="mb-0.5 block text-xs uppercase tracking-wider text-muted-foreground">
                          {CATEGORIA_LABEL[p.category] ?? p.category}
                        </span>
                        <h4 className="font-serif text-lg leading-snug transition-colors group-hover:text-primary">
                          {p.titulo}
                        </h4>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Lugares de interés (POIs) */}
          {pois.length > 0 && (
            <>
              {paginasTematicas.length > 0 && (
                <h3 className="mb-4 font-serif text-xl font-medium">Lugares de interés</h3>
              )}
              <PointsOfInterest
                hideHeader={paginasTematicas.length > 0}
                maxItems={0}
              points={pois.map((poi: any) => ({
                id: poi.id,
                name: poi.nombre,
                type: CATEGORIA_TEMATICA_LABELS[poi.categoriaTematica ?? ""] ?? poi.categoria ?? "Punto de interés",
                description: poi.descripcion_corta ?? poi.descripcion_larga?.replace(/<[^>]*>/g, "").slice(0, 120) ?? "",
                image: poi.foto,
                rotation: poi.rotation,
                href: `/pueblos/${slug}/pois/${poi.id}`,
              }))}
              />
            </>
          )}

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
