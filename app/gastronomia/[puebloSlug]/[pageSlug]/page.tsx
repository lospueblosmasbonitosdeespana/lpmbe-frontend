import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { stripHtml } from "@/app/_lib/html";
import {
  getCanonicalUrl,
  getLocaleAlternates,
  seoTitle,
  seoDescription,
  uniqueH1ForLocale,
  getLocaleFromRequestHeaders,
  type SupportedLocale,
} from "@/lib/seo";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Eyebrow } from "@/app/components/ui/typography";
import SafeHtml from "@/app/_components/ui/SafeHtml";
import ContenidoImageCarousel from "@/app/_components/ui/ContenidoImageCarousel";
import {
  CATEGORY_LABELS,
  CATEGORY_API_KEYS,
  getPaginaTematicaBySlug,
  slugToTitle,
} from "@/app/_lib/tematica/tematica-helpers";

export const dynamic = "force-dynamic";

const SLUG = "gastronomia";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ puebloSlug: string; pageSlug: string }>;
}): Promise<Metadata> {
  const { puebloSlug, pageSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  const label = CATEGORY_LABELS[SLUG]?.[locale] ?? CATEGORY_LABELS[SLUG].es;
  const puebloNombre = slugToTitle(puebloSlug);
  const page = await getPaginaTematicaBySlug(
    puebloSlug,
    CATEGORY_API_KEYS[SLUG],
    pageSlug,
    locale
  );
  const titulo = page?.titulo ?? slugToTitle(pageSlug);
  const path = `/${SLUG}/${puebloSlug}/${pageSlug}`;

  return {
    title: seoTitle(`${titulo} en ${puebloNombre}`),
    description: seoDescription(
      page?.resumen
        ? stripHtml(page.resumen)
        : `${titulo} — ${label} en ${puebloNombre}. Los Pueblos Más Bonitos de España`
    ),
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: seoTitle(`${titulo} en ${puebloNombre}`),
      ...(page?.coverUrl ? { images: [{ url: page.coverUrl }] } : {}),
      type: "article",
    },
    other: { "article:section": label },
  };
}

export default async function GastronomiaDetailPage({
  params,
}: {
  params: Promise<{ puebloSlug: string; pageSlug: string }>;
}) {
  const { puebloSlug, pageSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  const label = CATEGORY_LABELS[SLUG]?.[locale] ?? CATEGORY_LABELS[SLUG].es;
  const page = await getPaginaTematicaBySlug(
    puebloSlug,
    CATEGORY_API_KEYS[SLUG],
    pageSlug,
    locale
  );
  const puebloNombre = slugToTitle(puebloSlug);

  if (!page) return notFound();

  const allImages = [
    ...(page.coverUrl ? [page.coverUrl] : []),
    ...(page.galleryUrls ?? []),
  ].filter(Boolean) as string[];

  return (
    <main className="bg-background min-h-screen">
      {page.coverUrl && (
        <div className="relative h-[50vh] min-h-[320px] max-h-[520px] w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={page.coverUrl}
            alt={page.titulo}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <Container>
              <Eyebrow className="text-white/80 mb-2">{label} · {puebloNombre}</Eyebrow>
              <h1 className="font-serif text-3xl md:text-5xl font-medium text-white tracking-tight leading-tight max-w-3xl">
                {uniqueH1ForLocale(page.titulo, locale)}
              </h1>
              {page.resumen && (
                <p className="mt-3 text-base md:text-lg text-white/80 max-w-2xl leading-relaxed">
                  {stripHtml(page.resumen)}
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
            <Link href={`/${SLUG}/${puebloSlug}`} className="hover:text-foreground">{label}</Link>
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
                <SafeHtml html={page.contenido} />
              </div>
            ) : (
              <p className="text-muted-foreground italic">Contenido próximamente.</p>
            )}
          </div>

          <div className="mt-16 border-t border-border pt-8 text-center">
            <Link
              href={`/${SLUG}/${puebloSlug}`}
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
