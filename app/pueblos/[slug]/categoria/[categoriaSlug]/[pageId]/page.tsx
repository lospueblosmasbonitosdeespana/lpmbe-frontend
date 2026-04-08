import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getApiUrl } from "@/lib/api";
import { stripHtml } from "@/app/_lib/html";
import {
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoTitle,
  seoDescription,
  uniqueH1ForLocale,
  type SupportedLocale,
} from "@/lib/seo";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Eyebrow } from "@/app/components/ui/typography";
import SafeHtml from "@/app/_components/ui/SafeHtml";
import ContenidoImageCarousel from "@/app/components/ContenidoImageCarousel";

export const revalidate = 60;
const CATEGORIA_LABELS: Record<string, string> = {
  naturaleza: "Naturaleza",
  cultura: "Cultura",
  "en-familia": "En familia",
  patrimonio: "Patrimonio",
  petfriendly: "Petfriendly",
  gastronomia: "Gastronomía",
};

const CATEGORIA_SLUG_TO_KEY: Record<string, string> = {
  naturaleza: "NATURALEZA",
  cultura: "CULTURA",
  "en-familia": "EN_FAMILIA",
  patrimonio: "PATRIMONIO",
  petfriendly: "PETFRIENDLY",
  gastronomia: "GASTRONOMIA",
};

type PageData = {
  id: number;
  slug?: string;
  titulo: string;
  resumen?: string | null;
  contenido: string;
  coverUrl?: string | null;
  galleryUrls?: string[];
  category: string;
  updatedAt?: string;
};

async function getAllPages(
  puebloSlug: string,
  categoriaKey: string,
  locale?: string
): Promise<PageData[]> {
  try {
    const qs = locale ? `?lang=${encodeURIComponent(locale)}` : "";
    const res = await fetch(
      `${getApiUrl()}/public/pueblos/${puebloSlug}/pages${qs}`);
    if (!res.ok) return [];
    const data = await res.json();
    const pages: PageData[] = Array.isArray(data[categoriaKey])
      ? data[categoriaKey]
      : [];
    return pages;
  } catch {
    return [];
  }
}

function findPageBySlugOrId(pages: PageData[], segment: string): PageData | null {
  const asNum = Number(segment);
  if (!Number.isNaN(asNum) && String(asNum) === segment) {
    return pages.find((p) => p.id === asNum) ?? null;
  }
  return pages.find((p) => p.slug === segment) ?? null;
}

function isNumericSegment(segment: string): boolean {
  const asNum = Number(segment);
  return !Number.isNaN(asNum) && String(asNum) === segment;
}

function slugToNombre(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; categoriaSlug: string; pageId: string }>;
}): Promise<Metadata> {
  const { slug, categoriaSlug, pageId } = await params;
  const locale = await getLocale();
  const categoriaKey = CATEGORIA_SLUG_TO_KEY[categoriaSlug];
  const pages = categoriaKey ? await getAllPages(slug, categoriaKey, locale) : [];
  const page = findPageBySlugOrId(pages, pageId);

  if (page && isNumericSegment(pageId) && page.slug) {
    return { robots: { index: false, follow: true } };
  }

  const label = CATEGORIA_LABELS[categoriaSlug] ?? "Experiencia";
  const puebloNombre = slugToNombre(slug);
  const title = page?.titulo ?? label;
  const pageSlug = page?.slug ?? pageId;
  const path = `/pueblos/${slug}/categoria/${categoriaSlug}/${pageSlug}`;

  const titleFull = seoTitle(`${title} · ${puebloNombre}`);
  const descFull = seoDescription(
    page?.resumen ??
      `${label} en ${puebloNombre} — Los Pueblos Más Bonitos de España`
  );
  return {
    title: titleFull,
    description: descFull,
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: false, follow: true },
    openGraph: {
      title: titleFull,
      description: descFull,
      url: getCanonicalUrl(path, locale as SupportedLocale),
      ...(page?.coverUrl ? { images: [{ url: page.coverUrl }] } : {}),
      type: "article",
      locale: getOGLocale(locale as SupportedLocale),
    },
  };
}

export default async function ExperienciaPuebloPage({
  params,
}: {
  params: Promise<{ slug: string; categoriaSlug: string; pageId: string }>;
}) {
  const { slug, categoriaSlug, pageId } = await params;
  const locale = await getLocale();
  const categoriaKey = CATEGORIA_SLUG_TO_KEY[categoriaSlug];
  const label = CATEGORIA_LABELS[categoriaSlug] ?? "Experiencia";
  const puebloNombre = slugToNombre(slug);

  if (!categoriaKey) {
    return (
      <main className="bg-background min-h-screen">
        <Section spacing="md">
          <Container>
            <p className="text-muted-foreground">Categoría no encontrada.</p>
            <Link
              href={`/pueblos/${slug}`}
              className="mt-4 inline-block text-sm text-primary hover:underline"
            >
              ← Volver al pueblo
            </Link>
          </Container>
        </Section>
      </main>
    );
  }

  const pages = await getAllPages(slug, categoriaKey, locale);
  const page = findPageBySlugOrId(pages, pageId);

  if (page && isNumericSegment(pageId) && page.slug) {
    redirect(`/pueblos/${slug}/categoria/${categoriaSlug}/${page.slug}`);
  }

  if (!page) {
    return (
      <main className="bg-background min-h-screen">
        <Section spacing="md">
          <Container>
            <nav className="mb-6 text-sm text-muted-foreground">
              <Link href="/pueblos" className="hover:text-foreground">
                Pueblos
              </Link>
              <span className="mx-2">/</span>
              <Link href={`/pueblos/${slug}`} className="hover:text-foreground">
                {puebloNombre}
              </Link>
              <span className="mx-2">/</span>
              <Link
                href={`/pueblos/${slug}/categoria/${categoriaSlug}`}
                className="hover:text-foreground"
              >
                {label}
              </Link>
            </nav>
            <div className="rounded-xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
              <p className="text-muted-foreground">
                Este contenido no está disponible.
              </p>
              <Link
                href={`/pueblos/${slug}/categoria/${categoriaSlug}`}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Ver {label.toLowerCase()} en {puebloNombre}
              </Link>
            </div>
          </Container>
        </Section>
      </main>
    );
  }

  return (
    <main className="bg-background min-h-screen">
      {page.coverUrl && page.coverUrl.trim() ? (
        <div className="relative h-[50vh] min-h-[320px] max-h-[520px] w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={page.coverUrl.trim()}
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
                <p className="mt-3 text-base md:text-lg text-white/80 max-w-2xl leading-relaxed line-clamp-3">
                  {stripHtml(page.resumen).slice(0, 220)}
                </p>
              )}
            </Container>
          </div>
        </div>
      ) : null}

      <Section spacing="md">
        <Container>
          <nav className="mb-8 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/pueblos" className="hover:text-foreground">
              Pueblos
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/pueblos/${slug}`} className="hover:text-foreground">
              {puebloNombre}
            </Link>
            <span className="mx-2">/</span>
            <Link
              href={`/pueblos/${slug}/categoria/${categoriaSlug}`}
              className="hover:text-foreground"
            >
              {label}
            </Link>
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

            {/* Galería: carrusel con portada + fotos de galería */}
            {(() => {
              const allPhotos = [
                ...(page.coverUrl?.trim() ? [page.coverUrl.trim()] : []),
                ...(page.galleryUrls ?? []),
              ].filter(Boolean) as string[];
              if (allPhotos.length === 0) return null;
              return (
                <ContenidoImageCarousel images={allPhotos} alt={page.titulo} />
              );
            })()}

            {page.contenido ? (
              <div className="prose prose-gray prose-lg dark:prose-invert max-w-none [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-6 [&_h2]:font-serif [&_h3]:font-serif">
                <SafeHtml html={page.contenido} />
              </div>
            ) : (
              <p className="text-muted-foreground italic">
                Contenido próximamente.
              </p>
            )}
          </div>

          <div className="mt-16 border-t border-border pt-8 text-center">
            <Link
              href={`/pueblos/${slug}/categoria/${categoriaSlug}`}
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
