import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { getPuebloBySlug } from "@/lib/api";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Headline, Eyebrow, Body } from "@/app/components/ui/typography";
import { PointsOfInterest } from "@/app/components/pueblos/PointsOfInterest";

export const dynamic = "force-dynamic";

const CATEGORIA_SLUG_TO_KEY: Record<string, string> = {
  naturaleza: "NATURALEZA",
  cultura: "CULTURA",
  "en-familia": "EN_FAMILIA",
  patrimonio: "PATRIMONIO",
  petfriendly: "PETFRIENDLY",
  gastronomia: "GASTRONOMIA",
};

const CATEGORIA_LABELS: Record<string, string> = {
  naturaleza: "Naturaleza",
  cultura: "Cultura",
  "en-familia": "En familia",
  patrimonio: "Patrimonio",
  petfriendly: "Petfriendly",
  gastronomia: "Gastronomía",
};

const CATEGORIA_DESCRIPTIONS: Record<string, string> = {
  naturaleza: "Senderismo, paisajes y espacios naturales",
  cultura: "Monumentos, museos y patrimonio histórico",
  "en-familia": "Actividades para todas las edades",
  patrimonio: "Bienes de interés cultural y arquitectura histórica",
  petfriendly: "Espacios y actividades para ir con tu mascota",
  gastronomia: "Restaurantes, productos locales y tradición culinaria",
};

type Poi = {
  id: number;
  nombre: string;
  descripcion_corta: string | null;
  descripcion_larga: string | null;
  foto: string | null;
  rotation?: number | null;
  categoria: string | null;
  categoriaTematica: string | null;
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
  params: Promise<{ slug: string; categoriaSlug: string }>;
}): Promise<Metadata> {
  const { slug, categoriaSlug } = await params;
  if (!CATEGORIA_SLUG_TO_KEY[categoriaSlug]) return { title: "Categoría" };
  const locale = await getLocale();
  const pueblo = await getPuebloBySlug(slug, locale);
  const label = CATEGORIA_LABELS[categoriaSlug];
  return {
    title: `${label} en ${pueblo.nombre} – Los Pueblos Más Bonitos de España`,
    description: `${CATEGORIA_DESCRIPTIONS[categoriaSlug]} en ${pueblo.nombre}.`,
  };
}

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string; categoriaSlug: string }>;
}) {
  const { slug, categoriaSlug } = await params;
  const locale = await getLocale();
  const categoriaKey = CATEGORIA_SLUG_TO_KEY[categoriaSlug];
  if (!categoriaKey) notFound();

  const pueblo = await getPuebloBySlug(slug, locale);
  const pois = (pueblo.pois ?? []) as Poi[];
  const multiexperiencias = (pueblo as any).multiexperiencias ?? [];

  const poisFiltrados = pois.filter(
    (p) => p.categoria === "POI" && (p.categoriaTematica ?? "").toUpperCase() === categoriaKey
  );
  const multiexFiltradas = multiexperiencias.filter(
    (m: any) => (m.multiexperiencia?.categoria ?? "").toUpperCase() === categoriaKey
  );

  const tieneContenido = poisFiltrados.length > 0 || multiexFiltradas.length > 0;
  const label = CATEGORIA_LABELS[categoriaSlug];
  const descripcion = CATEGORIA_DESCRIPTIONS[categoriaSlug];

  return (
    <main className="bg-background min-h-screen">
      <Section spacing="md">
        <Container>
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link href="/pueblos" className="hover:text-foreground">
              Pueblos
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/pueblos/${slug}`} className="hover:text-foreground">
              {pueblo.nombre}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{label}</span>
          </nav>

          <div className="mb-10">
            <Eyebrow className="mb-2">Qué hacer</Eyebrow>
            <Headline>{label} en {pueblo.nombre}</Headline>
            <Body className="mt-2 text-muted-foreground">{descripcion}</Body>
          </div>

          {tieneContenido ? (
            <>
              {/* POIs */}
              {poisFiltrados.length > 0 && (
                <PointsOfInterest
                  hideHeader
                  maxItems={0}
                  points={poisFiltrados.map((poi) => ({
                    id: poi.id,
                    name: poi.nombre,
                    type: CATEGORIA_TEMATICA_LABELS[categoriaKey] ?? label,
                    description:
                      poi.descripcion_corta ??
                      poi.descripcion_larga?.replace(/<[^>]*>/g, "").slice(0, 120) ??
                      "",
                    image: poi.foto,
                    rotation: poi.rotation,
                    href: `/pueblos/${slug}/pois/${poi.id}`,
                  }))}
                />
              )}

              {/* Multiexperiencias */}
              {multiexFiltradas.length > 0 && (
                <Section spacing="md" className="mt-8">
                  <h2 className="mb-4 font-serif text-xl font-medium">Experiencias</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {multiexFiltradas.map((m: any) => (
                      <Link
                        key={m.multiexperiencia?.id}
                        href={`/pueblos/${slug}/experiencias/${m.multiexperiencia?.slug}`}
                        className="group flex gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30"
                      >
                        {m.multiexperiencia?.foto && (
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm bg-muted">
                            <img
                              src={m.multiexperiencia.foto}
                              alt={m.multiexperiencia.titulo}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif font-medium text-foreground group-hover:text-primary">
                            {m.multiexperiencia?.titulo}
                          </h3>
                          {m.multiexperiencia?.descripcion && (
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {m.multiexperiencia.descripcion.slice(0, 100)}
                              {m.multiexperiencia.descripcion.length > 100 ? "…" : ""}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </Section>
              )}
            </>
          ) : (
            /* Estado vacío - mensaje bonito */
            <div className="rounded-xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <svg
                  className="h-8 w-8 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h2 className="font-serif text-xl font-medium text-foreground sm:text-2xl">
                En esta categoría todavía no tenemos información
              </h2>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                Estamos trabajando para añadir contenidos de {label.toLowerCase()} en {pueblo.nombre}.
                Pronto podrás descubrir rutas, lugares y experiencias.
              </p>
              <Link
                href={`/pueblos/${slug}`}
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Volver a {pueblo.nombre}
              </Link>
            </div>
          )}

          {/* Enlace volver siempre visible cuando hay contenido */}
          {tieneContenido && (
            <div className="mt-12 text-center">
              <Link
                href={`/pueblos/${slug}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                ← Volver a {pueblo.nombre}
              </Link>
            </div>
          )}
        </Container>
      </Section>
    </main>
  );
}
