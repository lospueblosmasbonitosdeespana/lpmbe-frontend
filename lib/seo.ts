/**
 * SEO nacional e internacional: base URL, alternates por idioma, hreflang.
 * Usar para metadataBase, canonical absoluto y alternates.languages.
 */

export const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'de', 'pt', 'it', 'ca'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'es';

/** Códigos hreflang (es, en, fr, de, pt, it, ca). x-default = español. */
export const HREFLANG_LOCALES = [...SUPPORTED_LOCALES] as const;

/**
 * URL base del sitio (sin trailing slash).
 * Prioridad: NEXT_PUBLIC_SITE_URL > VERCEL_URL > localhost.
 * En producción (Vercel), definir NEXT_PUBLIC_SITE_URL al dominio canónico (ej. https://lospueblosmasbonitosdeespana.org).
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

/**
 * Path con query ?lang= para un idioma (para alternates).
 * path: sin query, ej. /pueblos/alarcon
 */
export function pathForLocale(path: string, locale: SupportedLocale): string {
  const clean = path.replace(/\?.*$/, '').replace(/\/$/, '') || '/';
  if (locale === DEFAULT_LOCALE) return clean;
  return `${clean}?lang=${locale}`;
}

/**
 * URLs absolutas por idioma para alternates.languages (Next.js Metadata).
 * Uso: alternates: { canonical, languages: getLocaleAlternates(path) }
 */
export function getLocaleAlternates(path: string): Record<string, string> {
  const base = getBaseUrl();
  const out: Record<string, string> = {};
  for (const locale of HREFLANG_LOCALES) {
    out[locale] = `${base}${pathForLocale(path, locale)}`;
  }
  out['x-default'] = `${base}${pathForLocale(path, DEFAULT_LOCALE)}`;
  return out;
}

/**
 * Canonical absoluto para una path (y opcional locale).
 * Para español no añade ?lang=; para el resto sí.
 */
export function getCanonicalUrl(path: string, locale?: SupportedLocale): string {
  const base = getBaseUrl();
  const p = path.replace(/\?.*$/, '').replace(/\/$/, '') || '/';
  const withLang =
    locale && locale !== DEFAULT_LOCALE ? `${p}?lang=${locale}` : p;
  return `${base}${withLang}`;
}

/** Nombre del sitio para títulos y Open Graph */
export const SITE_NAME = 'Los Pueblos Más Bonitos de España';

/** Descripción por defecto (es) para meta description y OG */
export const DEFAULT_DESCRIPTION =
  'Descubre los pueblos más bonitos de España: información, mapas, experiencias y rutas. Planifica tu visita.';

/** Códigos locale para Open Graph (es_ES, en_US, etc.) */
const OG_LOCALE_MAP: Record<SupportedLocale, string> = {
  es: 'es_ES',
  en: 'en_US',
  fr: 'fr_FR',
  de: 'de_DE',
  pt: 'pt_PT',
  it: 'it_IT',
  ca: 'ca_ES',
};

export function getOGLocale(locale: SupportedLocale): string {
  return OG_LOCALE_MAP[locale] ?? 'es_ES';
}

const TEMPLATE_SUFFIX_LEN = ` | ${SITE_NAME}`.length; // 37
const MAX_TITLE_TOTAL = 60;
const MAX_PAGE_TITLE = MAX_TITLE_TOTAL - TEMPLATE_SUFFIX_LEN; // 23

/**
 * Trunca un título de página para que al aplicar el template no exceda 60 chars.
 * Si cabe entero, lo devuelve tal cual. Si no, corta con "…".
 */
export function seoTitle(title: string): string {
  if (title.length <= MAX_PAGE_TITLE) return title;
  return title.slice(0, MAX_PAGE_TITLE - 1).trimEnd() + '…';
}

/**
 * Trunca una meta description a max chars (por defecto 155).
 */
export function seoDescription(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  const safeMax = Math.min(max, 155);
  if (clean.length <= safeMax) return clean;
  return clean.slice(0, safeMax - 1).trimEnd() + '…';
}

/** Convierte un slug URL en texto legible para fallbacks SEO. */
export function slugToTitle(slug: string): string {
  return decodeURIComponent(slug)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
