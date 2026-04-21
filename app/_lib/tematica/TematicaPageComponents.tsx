/**
 * Componente Server reutilizable para páginas de detalle temáticas.
 * Usado por: gastronomia, naturaleza, cultura, en-familia, petfriendly, patrimonio
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { stripHtml } from "@/app/_lib/html";
import {
  getBaseUrl,
  uniqueH1ForLocale,
} from "@/lib/seo";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Eyebrow } from "@/app/components/ui/typography";
import SafeHtml from "@/app/_components/ui/SafeHtml";
import ContenidoImageCarousel from "@/app/components/ContenidoImageCarousel";
import JsonLd from "@/app/components/seo/JsonLd";
import {
  CATEGORY_LABELS,
  CATEGORY_API_KEYS,
  getPaginaTematicaBySlug,
  slugToTitle,
  type TematicaPageData,
} from "@/app/_lib/tematica/tematica-helpers";

interface TematicaDetailPageProps {
  slug: string;
  puebloSlug: string;
  pageSlug: string;
  locale: string;
}

export async function TematicaDetailPage({
  slug,
  puebloSlug,
  pageSlug,
  locale,
}: TematicaDetailPageProps) {
  const label = CATEGORY_LABELS[slug]?.[locale] ?? CATEGORY_LABELS[slug]?.es ?? slug;
  const page: TematicaPageData | null = await getPaginaTematicaBySlug(
    puebloSlug,
    CATEGORY_API_KEYS[slug],
    pageSlug,
    locale
  );
  const puebloNombre = slugToTitle(puebloSlug);

  if (!page) return notFound();

  const allImages = [
    ...(page.coverUrl ? [page.coverUrl] : []),
    ...(page.galleryUrls ?? []),
  ].filter(Boolean) as string[];

  const baseUrl = getBaseUrl();
  const pageUrl = `${baseUrl}/${slug}/${puebloSlug}/${pageSlug}`;
  const resumenText = page.resumen ? stripHtml(page.resumen) : "";
  const descriptionForLd =
    resumenText ||
    (page.contenido ? stripHtml(page.contenido).slice(0, 280) : `${label} · ${puebloNombre}`);

  const articleLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.titulo,
    description: descriptionForLd,
    url: pageUrl,
    inLanguage: locale,
    articleSection: label,
    ...(allImages.length > 0 ? { image: allImages.slice(0, 10) } : {}),
    ...(page.updatedAt ? { dateModified: page.updatedAt } : {}),
    mainEntityOfPage: pageUrl,
    about: {
      "@type": "TouristAttraction",
      name: puebloNombre,
      url: `${baseUrl}/pueblos/${puebloSlug}`,
    },
    publisher: {
      "@type": "Organization",
      name: "Los Pueblos Más Bonitos de España",
      url: baseUrl,
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Pueblos", item: `${baseUrl}/pueblos` },
      { "@type": "ListItem", position: 2, name: puebloNombre, item: `${baseUrl}/pueblos/${puebloSlug}` },
      { "@type": "ListItem", position: 3, name: label, item: `${baseUrl}/${slug}/${puebloSlug}` },
      { "@type": "ListItem", position: 4, name: page.titulo, item: pageUrl },
    ],
  };

  return (
    <main className="bg-background min-h-screen">
      <JsonLd data={articleLd} />
      <JsonLd data={breadcrumbLd} />
      {page.coverUrl && (
        <div className="relative h-[50vh] min-h-[320px] max-h-[520px] w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={page.coverUrl} alt={page.titulo} className="h-full w-full object-cover" fetchPriority="high" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <Container>
              <Eyebrow className="text-white/80 mb-2">{label} · {puebloNombre}</Eyebrow>
              <h1 className="font-serif text-3xl md:text-5xl font-medium text-white tracking-tight leading-tight max-w-3xl">
                {uniqueH1ForLocale(page.titulo, locale)}
              </h1>
              {page.resumen && (
                <p className="mt-3 text-base md:text-lg text-white/80 max-w-2xl leading-relaxed line-clamp-3">
                  {stripHtml(page.resumen).slice(0, 220)}
                </p>
              )}
            </Container>
          </div>
        </div>
      )}

      <Section spacing="md">
        <Container>
          <nav className="mb-8 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/pueblos" className="hover:text-foreground">Pueblos</Link>
            <span className="mx-2">/</span>
            <Link href={`/pueblos/${puebloSlug}`} className="hover:text-foreground">{puebloNombre}</Link>
            <span className="mx-2">/</span>
            <Link href={`/${slug}/${puebloSlug}`} className="hover:text-foreground">{label}</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{page.titulo}</span>
          </nav>

          <div className="mx-auto max-w-3xl">
            {!page.coverUrl && (
              <>
                <Eyebrow className="mb-3">{label} · {puebloNombre}</Eyebrow>
                <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground mb-4">
                  {uniqueH1ForLocale(page.titulo, locale)}
                </h1>
                {page.resumen && (
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                    {stripHtml(page.resumen)}
                  </p>
                )}
              </>
            )}

            {allImages.length > 0 && (
              <div className="mb-8 overflow-hidden rounded-2xl">
                <ContenidoImageCarousel images={allImages} alt={page.titulo} />
              </div>
            )}

            {page.contenido ? (
              <div className="prose prose-gray prose-lg dark:prose-invert max-w-none [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-6 [&_h2]:font-serif [&_h3]:font-serif">
                <SafeHtml html={page.contenido} altFallback={page.titulo} />
              </div>
            ) : (
              <p className="text-muted-foreground italic">Contenido próximamente.</p>
            )}
          </div>

          <div className="mt-16 border-t border-border pt-8 text-center">
            <Link
              href={`/${slug}/${puebloSlug}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              ← Ver toda la {label.toLowerCase()} en {puebloNombre}
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}

interface TematicaEmptyProps {
  slug: string;
  puebloSlug: string;
  locale: string;
}

export function TematicaEmptyUI({ slug, puebloSlug, locale }: TematicaEmptyProps) {
  const label = CATEGORY_LABELS[slug]?.[locale] ?? CATEGORY_LABELS[slug]?.es ?? slug;
  const puebloNombre = slugToTitle(puebloSlug);

  return (
    <main className="bg-background min-h-screen">
      <Section spacing="md">
        <Container>
          <nav className="mb-8 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/pueblos" className="hover:text-foreground">Pueblos</Link>
            <span className="mx-2">/</span>
            <Link href={`/pueblos/${puebloSlug}`} className="hover:text-foreground">{puebloNombre}</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{label}</span>
          </nav>

          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground mb-4">
            {label} — {puebloNombre}
          </h1>

          <div className="mt-8 rounded-2xl border border-border bg-muted/30 px-8 py-12 text-center">
            <p className="text-muted-foreground">
              Todav&iacute;a no hay contenido de {label.toLowerCase()} para {puebloNombre}.
            </p>
            <Link
              href={`/pueblos/${puebloSlug}`}
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              &larr; Volver a {puebloNombre}
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}

interface TematicaListPageProps {
  slug: string;
  puebloSlug: string;
  locale: string;
  pages: TematicaPageData[];
  slugify: (t: string) => string;
}

export function TematicaListPageUI({
  slug,
  puebloSlug,
  locale,
  pages,
  slugify,
}: TematicaListPageProps) {
  const label = CATEGORY_LABELS[slug]?.[locale] ?? CATEGORY_LABELS[slug]?.es ?? slug;
  const puebloNombre = slugToTitle(puebloSlug);

  const baseUrl = getBaseUrl();
  const pageUrl = `${baseUrl}/${slug}/${puebloSlug}`;
  const firstCover = pages.find((p) => p.coverUrl)?.coverUrl ?? null;

  const collectionLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${label} · ${puebloNombre}`,
    description: `${label} en ${puebloNombre}: contenidos, lugares y rutas seleccionadas.`,
    url: pageUrl,
    inLanguage: locale,
    ...(firstCover ? { image: firstCover } : {}),
    isPartOf: {
      "@type": "WebSite",
      name: "Los Pueblos Más Bonitos de España",
      url: baseUrl,
    },
    about: {
      "@type": "TouristAttraction",
      name: puebloNombre,
      url: `${baseUrl}/pueblos/${puebloSlug}`,
    },
    mainEntity: {
      "@type": "ItemList",
      name: `${label} · ${puebloNombre}`,
      numberOfItems: pages.length,
      itemListElement: pages.map((page, i) => {
        const pageSlug = page.slug ?? slugify(page.titulo);
        const itemUrl = `${baseUrl}/${slug}/${puebloSlug}/${pageSlug}`;
        return {
          "@type": "ListItem",
          position: i + 1,
          url: itemUrl,
          name: page.titulo,
          ...(page.coverUrl ? { image: page.coverUrl } : {}),
        };
      }),
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Pueblos", item: `${baseUrl}/pueblos` },
      { "@type": "ListItem", position: 2, name: puebloNombre, item: `${baseUrl}/pueblos/${puebloSlug}` },
      { "@type": "ListItem", position: 3, name: label, item: pageUrl },
    ],
  };

  return (
    <main className="bg-background min-h-screen">
      <JsonLd data={collectionLd} />
      <JsonLd data={breadcrumbLd} />
      <Section spacing="md">
        <Container>
          <nav className="mb-8 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/pueblos" className="hover:text-foreground">Pueblos</Link>
            <span className="mx-2">/</span>
            <Link href={`/pueblos/${puebloSlug}`} className="hover:text-foreground">{puebloNombre}</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{label}</span>
          </nav>

          <Eyebrow className="mb-3">{puebloNombre}</Eyebrow>
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground mb-4">
            {uniqueH1ForLocale(label, locale)}
          </h1>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => {
              const pageSlug = page.slug ?? slugify(page.titulo);
              return (
                <Link
                  key={page.id}
                  href={`/${slug}/${puebloSlug}/${pageSlug}`}
                  className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                  {page.coverUrl && (
                    <div className="aspect-[4/3] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={page.coverUrl}
                        alt={page.titulo}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h2 className="font-serif text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                      {page.titulo}
                    </h2>
                    {page.resumen && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {page.resumen}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-12 border-t border-border pt-8 text-center">
            <Link
              href={`/pueblos/${puebloSlug}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              ← Volver a {puebloNombre}
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
