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
 * URL absoluta a la imagen OG por defecto (logo de marca). Se usa como
 * fallback cuando una página editorial no tiene una imagen propia.
 */
export function getDefaultOgImage(): string {
  return `${getBaseUrl()}/brand/logo-lpbe-1.png`;
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
/** Un poco más de margen para títulos únicos (IDs de vídeo, POI, slugs) antes del truncado. */
const MAX_TITLE_TOTAL = 78;
const MAX_PAGE_TITLE = MAX_TITLE_TOTAL - TEMPLATE_SUFFIX_LEN; // 41

function decodeBasicHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'");
}

/**
 * Trunca un título de página para que al aplicar el template no exceda 60 chars.
 * Si cabe entero, lo devuelve tal cual. Si no, corta con "…".
 */
export function seoTitle(title: string): string {
  const normalized = decodeBasicHtmlEntities(title).replace(/\s+/g, " ").trim();
  if (!normalized) return "Contenido";
  if (normalized.length <= MAX_PAGE_TITLE) return normalized;
  if (MAX_PAGE_TITLE <= 8) return normalized.slice(0, MAX_PAGE_TITLE - 1).trimEnd() + "…";
  const headLen = Math.ceil((MAX_PAGE_TITLE - 1) * 0.6);
  const tailLen = (MAX_PAGE_TITLE - 1) - headLen;
  return `${normalized.slice(0, headLen).trimEnd()}…${normalized.slice(-tailLen).trimStart()}`;
}

const MAX_ABSOLUTE_TITLE = 70;

/**
 * For pages using title: { absolute }, the full title IS the final <title>.
 * Truncate at 70 chars (no template suffix will be appended).
 */
export function seoAbsoluteTitle(title: string): string {
  const normalized = decodeBasicHtmlEntities(title).replace(/\s+/g, " ").trim();
  if (!normalized) return SITE_NAME;
  if (normalized.length <= MAX_ABSOLUTE_TITLE) return normalized;
  return normalized.slice(0, MAX_ABSOLUTE_TITLE - 1).trimEnd() + "…";
}

/**
 * Título de página de vídeo: no trunca el ID del vídeo (YouTube u otro); solo acorta el nombre del pueblo si hace falta.
 */
export function seoTitleVideoWithId(
  videoId: string,
  puebloLabel: string,
  locSuf: string,
): string {
  const vid = videoId.trim();
  const prefix = `Video ${vid} · `;
  const tail = `${puebloLabel}${locSuf}`.replace(/\s+/g, " ").trim();
  const full = decodeBasicHtmlEntities(`${prefix}${tail}`)
    .replace(/\s+/g, " ")
    .trim();
  if (full.length <= MAX_PAGE_TITLE) return full;
  const room = MAX_PAGE_TITLE - prefix.length;
  if (room <= 4) {
    return `${prefix.slice(0, Math.max(0, MAX_PAGE_TITLE - 1)).trimEnd()}…`;
  }
  const cut = tail.length > room ? `${tail.slice(0, room - 1).trimEnd()}…` : tail;
  const out = `${prefix}${cut}`;
  return out.length <= MAX_PAGE_TITLE ? out : out.slice(0, MAX_PAGE_TITLE - 1) + "…";
}

/**
 * Título de página de POI: siempre incluye el nombre del pueblo para evitar colisiones entre
 * distintos pueblos que tengan un POI con el mismo nombre (ej. «Ermita del Humilladero» en Robledillo,
 * Guadalupe y Lerma). El stamp (ID numérico o sufijo del slug del pueblo) garantiza unicidad final.
 */
export function seoTitlePoiWithStamp(
  poiParam: string,
  isNumericParam: boolean,
  poiReadable: string,
  puebloName: string,
  locSuf: string,
  puebloSlug?: string,
): string {
  const poiStamp = isNumericParam
    ? poiParam
    : poiParam.replace(/[^a-zA-Z0-9]/g, "").slice(-10) || poiParam.slice(-10);
  const puebloStamp = puebloSlug
    ? puebloSlug.replace(/[^a-zA-Z0-9]/g, "").slice(-6)
    : "";
  const stamp = puebloStamp ? `${puebloStamp}-${poiStamp}` : poiStamp;
  return seoTitle(`${poiReadable} · ${puebloName}${locSuf} · ${stamp}`);
}

/** Sufijo visible en el título para diferenciar variantes ?lang= (evita duplicados en auditorías). */
export function titleLocaleSuffix(locale: SupportedLocale | string): string {
  const l = String(locale).toLowerCase();
  return l === "es" ? "" : ` (${l.toUpperCase()})`;
}

/**
 * Prefijo al inicio de meta description para idiomas no-ES.
 * Evita duplicados entre variantes ?lang= y que el truncado (155) elimine el sufijo final.
 */
export function metaLocaleLead(locale: SupportedLocale | string | undefined): string {
  const l = String(locale ?? "es").toLowerCase();
  if (l === "es") return "";
  return `[${l.toUpperCase()}] `;
}

/**
 * H1 distinto por variante de idioma (?lang=) para auditorías que marcan H1 duplicados entre URLs.
 * Añade " (CA)", " (IT)", etc. solo si no es español.
 */
export function uniqueH1ForLocale(base: string, locale: string | undefined): string {
  const l = String(locale ?? "es").toLowerCase();
  const trimmed = decodeBasicHtmlEntities(base).replace(/\s+/g, " ").trim();
  if (!trimmed) return "Contenido";
  if (l === "es") return trimmed;
  const tag = l.toUpperCase();
  if (trimmed.endsWith(`(${tag})`)) return trimmed;
  return `${trimmed} (${tag})`;
}

/**
 * Locale para `generateMetadata()` sin `await getLocale()` (next-intl puede retrasar
 * la resolución y provocar que auditorías marquen meta/título fuera de `<head>` con streaming).
 * El middleware ya envía `x-current-locale` en cada petición.
 */
export function getLocaleFromRequestHeaders(h: Headers): SupportedLocale {
  const raw = h.get("x-current-locale")?.toLowerCase();
  switch (raw) {
    case "en":
    case "fr":
    case "de":
    case "pt":
    case "it":
    case "ca":
      return raw;
    default:
      return "es";
  }
}

/**
 * Fragmento único a partir del slug del pueblo (p. ej. bonilla-de-la-sierra vs segura-de-la-sierra:
 * solo el sufijo "-sierra" colisionaba al truncar).
 */
export function slugDisambiguatorForTitle(slug: string): string {
  const s = slug.trim();
  if (s.length <= 14) return "";
  const head = s.slice(0, 6);
  const tail = s.slice(-6);
  if (!head || !tail || head === tail) return "";
  return ` · ${head}-${tail}`;
}

/**
 * Trunca una meta description a max chars (por defecto 155).
 */
export function seoDescription(text: string, max = 155): string {
  const clean = decodeBasicHtmlEntities(text).replace(/\s+/g, ' ').trim();
  if (!clean) return DEFAULT_DESCRIPTION;
  const safeMax = Math.min(max, 155);
  if (clean.length <= safeMax) return clean;
  return clean.slice(0, safeMax - 1).trimEnd() + '…';
}

/** Convierte un slug URL en texto legible para fallbacks SEO. */
export function slugToTitle(slug: string): string {
  const decoded = (() => {
    try {
      return decodeURIComponent(slug);
    } catch {
      // Preserve the raw slug when malformed percent-encoding appears.
      return slug;
    }
  })();
  return decoded
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
