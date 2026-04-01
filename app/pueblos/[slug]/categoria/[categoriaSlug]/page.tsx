import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getApiUrl, getPuebloBySlug } from "@/lib/api";
import { stripHtml } from "@/app/_lib/html";
import {
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoTitle,
  seoDescription,
  slugToTitle,
  uniqueH1ForLocale,
  type SupportedLocale,
} from "@/lib/seo";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Eyebrow, Body } from "@/app/components/ui/typography";
import { PointsOfInterest } from "@/app/components/pueblos/PointsOfInterest";

export const revalidate = 60;
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

const CATEGORIA_SEO_URL: Record<string, string> = {
  naturaleza: "naturaleza",
  cultura: "cultura",
  "en-familia": "en-familia",
  patrimonio: "patrimonio",
  petfriendly: "petfriendly",
  gastronomia: "que-comer",
};

const CATEGORIA_DESCRIPTIONS: Record<string, string> = {
  naturaleza: "Senderismo, paisajes y espacios naturales",
  cultura: "Monumentos, museos y patrimonio histórico",
  "en-familia": "Actividades para todas las edades",
  patrimonio: "Bienes de interés cultural y arquitectura histórica",
  petfriendly: "Espacios y actividades para ir con tu mascota",
  gastronomia: "Restaurantes, productos locales y tradición culinaria",
};

const CATEGORIA_TEMATICA_LABELS: Record<string, string> = {
  GASTRONOMIA: "Gastronomía",
  NATURALEZA: "Naturaleza",
  CULTURA: "Cultura",
  PATRIMONIO: "Patrimonio",
  EN_FAMILIA: "En familia",
  PETFRIENDLY: "Petfriendly",
};

type TematicaPage = {
  id: number;
  titulo: string;
  resumen?: string | null;
  contenido: string;
  coverUrl?: string | null;
};

type Poi = {
  id: number;
  slug?: string | null;
  nombre: string;
  descripcion_corta: string | null;
  descripcion_larga: string | null;
  foto: string | null;
  rotation?: number | null;
  categoria: string | null;
  categoriaTematica: string | null;
};

type MultiexperienciaEntry = {
  multiexperiencia?: {
    id?: number;
    slug?: string | null;
    titulo?: string | null;
    descripcion?: string | null;
    foto?: string | null;
    categoria?: string | null;
  } | null;
};

type PuebloTematicasData = Record<string, TematicaPage[]>;

function normalizeCategoryKey(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, "_");
}

async function getPaginasTematicas(
  puebloSlug: string,
  categoriaKey: string,
  locale?: string
): Promise<TematicaPage[]> {
  try {
    const qs = locale ? `?lang=${encodeURIComponent(locale)}` : "";
    const res = await fetch(
      `${getApiUrl()}/public/pueblos/${puebloSlug}/pages${qs}`,
      { headers: locale ? { "Accept-Language": locale } : undefined }
    );
    if (!res.ok) return [];
    const data: PuebloTematicasData = await res.json();
    const pagesEntry = Object.entries(data).find(
      ([key]) => normalizeCategoryKey(key) === normalizeCategoryKey(categoriaKey)
    );
    const pages = pagesEntry?.[1];
    if (!pages) return [];
    return Array.isArray(pages) ? pages : [pages as unknown as TematicaPage];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; categoriaSlug: string }>;
}): Promise<Metadata> {
  const { slug, categoriaSlug } = await params;
  const locale = await getLocale();
  const tSeo = await getTranslations("seo");
  const name = slugToTitle(slug) || "Pueblo";
  const label = CATEGORIA_LABELS[categoriaSlug] ?? "Categoría";
  const path = `/pueblos/${slug}/categoria/${categoriaSlug}`;
  const title = seoTitle(tSeo("categoriaPuebloTitle", { categoria: label, pueblo: name }));
  const description = seoDescription(
    tSeo("categoriaPuebloDesc", { categoria: label.toLowerCase(), pueblo: name, detalle: CATEGORIA_DESCRIPTIONS[categoriaSlug] ?? "categoría temática" })
  );
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale as SupportedLocale),
      locale: getOGLocale(locale as SupportedLocale),
    },
  };
}

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string; categoriaSlug: string }>;
}) {
  const { slug, categoriaSlug } = await params;
  const locale = await getLocale();
  const tPueblo = await getTranslations("puebloPage");
  const categoriaKey = CATEGORIA_SLUG_TO_KEY[categoriaSlug];

  if (!categoriaKey) {
    return (
      <main className="bg-background min-h-screen">
        <Section spacing="md">
          <Container>
            <div className="rounded-xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
              <h1 className="font-serif text-2xl font-medium text-foreground">
                {uniqueH1ForLocale("Categoría", locale)}
              </h1>
              <p className="mt-3 text-muted-foreground">
                La categoría solicitada no está disponible.
              </p>
              <Link
                href={`/pueblos/${slug}`}
                className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
              >
                Volver al pueblo
              </Link>
            </div>
          </Container>
        </Section>
      </main>
    );
  }

  const pueblo = await getPuebloBySlug(slug, locale).catch(() => null);
  if (!pueblo) {
    return (
      <main className="bg-background min-h-screen">
        <Section spacing="md">
          <Container>
            <div className="rounded-xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
              <h1 className="font-serif text-2xl font-medium text-foreground">
                {uniqueH1ForLocale("Categoría", locale)}
              </h1>
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

  const pois = (pueblo.pois ?? []) as Poi[];
  const multiexperiencias = (
    (pueblo as { multiexperiencias?: MultiexperienciaEntry[] }).multiexperiencias ?? []
  );

  const poisFiltrados = pois.filter(
    (p) =>
      p.categoria === "POI" &&
      normalizeCategoryKey(p.categoriaTematica) === normalizeCategoryKey(categoriaKey)
  );
  const multiexFiltradas = multiexperiencias.filter(
    (m: MultiexperienciaEntry) =>
      normalizeCategoryKey(m.multiexperiencia?.categoria) ===
      normalizeCategoryKey(categoriaKey)
  );

  const paginasTematicas = await getPaginasTematicas(slug, categoriaKey, locale);

  const tieneContenido =
    poisFiltrados.length > 0 ||
    multiexFiltradas.length > 0 ||
    paginasTematicas.length > 0;

  const label = CATEGORIA_LABELS[categoriaSlug];
  const descripcion = CATEGORIA_DESCRIPTIONS[categoriaSlug];

  const CAT_I18N_KEY: Record<string, string> = {
    naturaleza: "catNaturaleza",
    cultura: "catCultura",
    "en-familia": "catEnFamilia",
    patrimonio: "catPatrimonio",
    petfriendly: "catPetfriendly",
    gastronomia: "catGastronomia",
  };
  const i18nCatLabel = CAT_I18N_KEY[categoriaSlug]
    ? tPueblo(CAT_I18N_KEY[categoriaSlug] as Parameters<typeof tPueblo>[0])
    : label;
  const h1Text = tPueblo("h1CategoriaEn", {
    categoria: i18nCatLabel,
    nombre: pueblo.nombre,
  });

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
            <span className="text-foreground">{i18nCatLabel}</span>
          </nav>

          {/* Header */}
          <div className="mb-10">
            <Eyebrow className="mb-2">Qué hacer</Eyebrow>
            <h1 className="font-serif text-4xl font-medium tracking-tight">
              {uniqueH1ForLocale(h1Text, locale)}
            </h1>
            <Body className="mt-2 text-muted-foreground">{descripcion}</Body>
          </div>

          {tieneContenido ? (
            <div className="space-y-16">
              {/* ── PÁGINAS TEMÁTICAS: tarjetas grandes con foto ── */}
              {paginasTematicas.length > 0 && (
                <section>
                  <div
                    className={
                      paginasTematicas.length === 1
                        ? "grid grid-cols-1 gap-8 max-w-2xl"
                        : "grid grid-cols-1 gap-8 sm:grid-cols-2"
                    }
                  >
                    {paginasTematicas.map((page) => (
                      <Link
                        key={page.id}
                        href={`/pueblos/${slug}/categoria/${categoriaSlug}/${page.id}`}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                      >
                        {/* Foto */}
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                          {page.coverUrl && page.coverUrl.trim() ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={page.coverUrl.trim()}
                              alt={page.titulo}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/60">
                              <span className="text-3xl text-muted-foreground opacity-40">
                                {categoriaSlug === "gastronomia"
                                  ? "🍽️"
                                  : categoriaSlug === "naturaleza"
                                  ? "🌿"
                                  : categoriaSlug === "cultura"
                                  ? "🏛️"
                                  : categoriaSlug === "patrimonio"
                                  ? "🏰"
                                  : categoriaSlug === "en-familia"
                                  ? "👨‍👩‍👧"
                                  : "🐾"}
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        </div>

                        {/* Info */}
                        <div className="flex flex-1 flex-col p-6">
                          <Eyebrow className="mb-2 text-xs">{label}</Eyebrow>
                          <h2 className="font-serif text-xl font-medium leading-snug text-foreground group-hover:text-primary transition-colors">
                            {page.titulo}
                          </h2>
                          {page.resumen && (
                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                              {stripHtml(page.resumen)}
                            </p>
                          )}
                          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                            <span>Ver experiencia</span>
                            <span className="transition-transform group-hover:translate-x-1">
                              →
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* ── POIS ── */}
              {poisFiltrados.length > 0 && (
                <section>
                  {paginasTematicas.length > 0 && (
                    <h2 className="mb-6 font-serif text-2xl font-medium text-foreground">
                      Lugares de interés
                    </h2>
                  )}
                  <PointsOfInterest
                    hideHeader
                    maxItems={0}
                    points={poisFiltrados.map((poi) => ({
                      id: poi.id,
                      name: poi.nombre,
                      type:
                        CATEGORIA_TEMATICA_LABELS[categoriaKey] ?? label,
                      description:
                        poi.descripcion_larga
                          ?.replace(/<[^>]*>/g, "")
                          .slice(0, 120) ??
                        poi.descripcion_corta ??
                        "",
                      image: poi.foto,
                      rotation: poi.rotation,
                      href: `/pueblos/${slug}/pois/${poi.slug || poi.id}`,
                    }))}
                  />
                </section>
              )}

              {/* ── MULTIEXPERIENCIAS ── */}
              {multiexFiltradas.length > 0 && (
                <section>
                  <h2 className="mb-6 font-serif text-2xl font-medium text-foreground">
                    Experiencias
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {multiexFiltradas.map((m: MultiexperienciaEntry) => (
                      <Link
                        key={m.multiexperiencia?.id}
                        href={`/pueblos/${slug}/experiencias/${m.multiexperiencia?.slug}`}
                        className="group flex gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30"
                      >
                        {m.multiexperiencia?.foto && (
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={m.multiexperiencia.foto}
                              alt={m.multiexperiencia.titulo ?? label}
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
                              {m.multiexperiencia.descripcion.length > 100
                                ? "…"
                                : ""}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            /* Estado vacío */
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
                Estamos trabajando para añadir contenidos de{" "}
                {label.toLowerCase()} en {pueblo.nombre}. Pronto podrás
                descubrir rutas, lugares y experiencias.
              </p>
              <Link
                href={`/pueblos/${slug}`}
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Volver a {pueblo.nombre}
              </Link>
            </div>
          )}

          {tieneContenido && CATEGORIA_SEO_URL[categoriaSlug] && (
            <div className="mt-12 rounded-xl border border-border bg-card/50 px-6 py-5 text-center">
              <p className="text-sm text-muted-foreground">
                Descubre más sobre {label.toLowerCase()} en {pueblo.nombre}:
              </p>
              <Link
                href={`/${CATEGORIA_SEO_URL[categoriaSlug]}/${slug}`}
                className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
              >
                {label} en {pueblo.nombre} →
              </Link>
            </div>
          )}

          {tieneContenido && (
            <div className="mt-6 text-center">
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
