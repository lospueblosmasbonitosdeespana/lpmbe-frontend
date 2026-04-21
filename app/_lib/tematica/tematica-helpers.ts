/**
 * Helpers compartidos para las páginas SEO temáticas:
 * /gastronomia, /naturaleza, /cultura, /en-familia, /petfriendly, /patrimonio
 */
import type { Metadata } from "next";
import { getApiUrl } from "@/lib/api";
import {
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoTitle,
  seoDescription,
  type SupportedLocale,
} from "@/lib/seo";

export const CATEGORY_API_KEYS: Record<string, string> = {
  gastronomia: "GASTRONOMIA",
  "que-comer": "GASTRONOMIA",
  naturaleza: "NATURALEZA",
  cultura: "CULTURA",
  "en-familia": "EN_FAMILIA",
  petfriendly: "PETFRIENDLY",
  patrimonio: "PATRIMONIO",
};

/** Etiqueta localizada por categoría */
export const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  gastronomia: {
    es: "Gastronomía",
    en: "Gastronomy",
    fr: "Gastronomie",
    de: "Gastronomie",
    pt: "Gastronomia",
    it: "Gastronomia",
    ca: "Gastronomia",
  },
  "que-comer": {
    es: "Gastronomía",
    en: "Gastronomy",
    fr: "Gastronomie",
    de: "Gastronomie",
    pt: "Gastronomia",
    it: "Gastronomia",
    ca: "Gastronomia",
  },
  naturaleza: {
    es: "Naturaleza",
    en: "Nature",
    fr: "Nature",
    de: "Natur",
    pt: "Natureza",
    it: "Natura",
    ca: "Natura",
  },
  cultura: {
    es: "Cultura",
    en: "Culture",
    fr: "Culture",
    de: "Kultur",
    pt: "Cultura",
    it: "Cultura",
    ca: "Cultura",
  },
  "en-familia": {
    es: "En Familia",
    en: "Family",
    fr: "En Famille",
    de: "Familien",
    pt: "Em Família",
    it: "In Famiglia",
    ca: "En Família",
  },
  petfriendly: {
    es: "Pet Friendly",
    en: "Pet Friendly",
    fr: "Animaux Bienvenus",
    de: "Tierfreundlich",
    pt: "Pet Friendly",
    it: "Pet Friendly",
    ca: "Pet Friendly",
  },
  patrimonio: {
    es: "Patrimonio",
    en: "Heritage",
    fr: "Patrimoine",
    de: "Kulturerbe",
    pt: "Património",
    it: "Patrimonio",
    ca: "Patrimoni",
  },
};

export type TematicaPageData = {
  id: number;
  titulo: string;
  slug?: string | null;
  resumen?: string | null;
  contenido: string;
  coverUrl?: string | null;
  galleryUrls?: string[];
  category: string;
  updatedAt?: string;
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Obtiene todas las páginas de una categoría para un pueblo */
export async function getPaginasTematicasByPueblo(
  puebloSlug: string,
  categoryKey: string,
  locale: string
): Promise<TematicaPageData[]> {
  try {
    const qs = locale !== "es" ? `?lang=${encodeURIComponent(locale)}` : "";
    const res = await fetch(
      `${getApiUrl()}/public/pueblos/${puebloSlug}/pages${qs}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data[categoryKey]) ? data[categoryKey] : [];
  } catch {
    return [];
  }
}

/**
 * Igual que getPaginasTematicasByPueblo pero, si el idioma pedido no tiene páginas,
 * usa español. Evita 404 en URLs ?lang=xx del sitemap/hreflang cuando solo existe ES.
 */
export async function getPaginasTematicasByPuebloWithEsFallback(
  puebloSlug: string,
  categoryKey: string,
  locale: string,
): Promise<TematicaPageData[]> {
  const pages = await getPaginasTematicasByPueblo(puebloSlug, categoryKey, locale);
  if (pages.length > 0) return pages;
  if (locale !== "es") {
    return getPaginasTematicasByPueblo(puebloSlug, categoryKey, "es");
  }
  return [];
}

/**
 * Genera el objeto `Metadata` de las páginas de listado temáticas por pueblo
 * (`/patrimonio/[puebloSlug]`, `/que-comer/[puebloSlug]`, …). Comparte lógica
 * para los 6 segmentos: canonical + hreflang, og:image con la primera cover
 * disponible y noindex cuando no hay contenido que mostrar.
 */
export async function buildTematicaListMetadata(params: {
  slug: string;
  puebloSlug: string;
  locale: SupportedLocale | string;
  titleText: string;
  descriptionText: string;
  pages: TematicaPageData[];
}): Promise<Metadata> {
  const { slug, puebloSlug, locale, titleText, descriptionText, pages } = params;
  const hasValidContent = pages.length > 0;
  const path = `/${slug}/${puebloSlug}`;
  const title = seoTitle(titleText);
  const description = seoDescription(descriptionText);
  const alternates = hasValidContent
    ? {
        canonical: getCanonicalUrl(path, locale as SupportedLocale),
        languages: getLocaleAlternates(path),
      }
    : undefined;
  const firstCover = pages.find((p) => p.coverUrl)?.coverUrl ?? null;
  const ogImages = firstCover ? [{ url: firstCover }] : undefined;
  return {
    title,
    description,
    alternates,
    robots: { index: hasValidContent, follow: true },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale as SupportedLocale),
      locale: getOGLocale(locale as SupportedLocale),
      type: "website",
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: ogImages ? "summary_large_image" : "summary",
      title,
      description,
      ...(firstCover ? { images: [firstCover] } : {}),
    },
  };
}

/**
 * Metadata para detalle de página temática (`/patrimonio/[puebloSlug]/[pageSlug]`,
 * `/cultura/...`, etc.). Normaliza OG/Twitter y usa la cover de la página
 * como imagen editorial.
 */
export async function buildTematicaDetailMetadata(params: {
  slug: string;
  puebloSlug: string;
  pageSlug: string;
  locale: SupportedLocale | string;
  titleText: string;
  descriptionText: string;
  coverUrl?: string | null;
  hasValidContent: boolean;
  articleSection?: string;
}): Promise<Metadata> {
  const {
    slug,
    puebloSlug,
    pageSlug,
    locale,
    titleText,
    descriptionText,
    coverUrl,
    hasValidContent,
    articleSection,
  } = params;
  const path = `/${slug}/${puebloSlug}/${pageSlug}`;
  const title = seoTitle(titleText);
  const description = seoDescription(descriptionText);
  const alternates = hasValidContent
    ? {
        canonical: getCanonicalUrl(path, locale as SupportedLocale),
        languages: getLocaleAlternates(path),
      }
    : undefined;
  const ogImages = coverUrl ? [{ url: coverUrl }] : undefined;
  return {
    title,
    description,
    alternates,
    robots: { index: hasValidContent, follow: true },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale as SupportedLocale),
      type: "article",
      locale: getOGLocale(locale as SupportedLocale),
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: coverUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(coverUrl ? { images: [coverUrl] } : {}),
    },
    ...(articleSection ? { other: { "article:section": articleSection } } : {}),
  };
}

/** Obtiene una página por slug (o fallback slugify del título) */
export async function getPaginaTematicaBySlug(
  puebloSlug: string,
  categoryKey: string,
  pageSlug: string,
  locale: string
): Promise<TematicaPageData | null> {
  const pages = await getPaginasTematicasByPueblo(puebloSlug, categoryKey, locale);
  const match =
    pages.find((p) => p.slug === pageSlug) ??
    pages.find((p) => slugify(p.titulo) === pageSlug);
  if (match) return match;

  if (locale !== "es") {
    const esPages = await getPaginasTematicasByPueblo(puebloSlug, categoryKey, "es");
    const esMatch = esPages.find((p) => p.slug === pageSlug || slugify(p.titulo) === pageSlug);
    if (esMatch) {
      const translated = pages.find((p) => p.id === esMatch.id);
      return translated ?? esMatch;
    }
  }

  return null;
}
