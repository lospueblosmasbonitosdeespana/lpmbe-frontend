/**
 * SEO nacional e internacional: base URL, alternates por idioma, hreflang.
 * Usar para metadataBase, canonical absoluto y alternates.languages.
 */

export const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'de', 'pt', 'it'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'es';

/** Códigos hreflang (es, en, fr, de, pt, it). x-default = español. */
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
