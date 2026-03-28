/**
 * Helpers compartidos para las páginas SEO temáticas:
 * /gastronomia, /naturaleza, /cultura, /en-familia, /petfriendly, /patrimonio
 */
import { getApiUrl } from "@/lib/api";

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

/** Obtiene una página por slug (o fallback slugify del título) */
export async function getPaginaTematicaBySlug(
  puebloSlug: string,
  categoryKey: string,
  pageSlug: string,
  locale: string
): Promise<TematicaPageData | null> {
  const pages = await getPaginasTematicasByPueblo(puebloSlug, categoryKey, locale);
  return (
    pages.find((p) => p.slug === pageSlug || slugify(p.titulo) === pageSlug) ??
    null
  );
}
