import type { MetadataRoute } from "next";
import { getBaseUrl, pathForLocale, SUPPORTED_LOCALES } from "@/lib/seo";

/** Rutas estáticas que se incluyen en el sitemap (sin segmentos dinámicos). */
const STATIC_PATHS = [
  "",
  "/experiencias",
  "/experiencias/gastronomia",
  "/experiencias/naturaleza",
  "/experiencias/cultura",
  "/experiencias/en-familia",
  "/experiencias/petfriendly",
  "/pueblos",
  "/rutas",
  "/notificaciones",
  "/mapa",
  "/planifica",
] as const;

function toSitemapEntry(
  path: string,
  priority: number,
  changeFrequency: "yearly" | "monthly" | "weekly" | "daily" = "weekly"
): MetadataRoute.Sitemap[number] {
  const base = getBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return {
    url: normalized ? `${base}${normalized}` : base,
    lastModified: new Date(),
    changeFrequency,
    priority,
  };
}

/**
 * Genera entradas de sitemap para una path: una por idioma (SEO internacional).
 * Español = path sin query; resto = path?lang=xx
 */
function expandPathByLocales(path: string): string[] {
  return SUPPORTED_LOCALES.map((locale) => {
    const p = pathForLocale(path, locale);
    return p.startsWith("/") ? p : `/${p}`;
  });
}

/** Fetch con caché de 24h, compatible con generación estática del sitemap */
async function fetchForSitemap<T>(fetcher: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fetcher();
  } catch {
    return fallback;
  }
}

async function getPueblosSitemap(): Promise<Array<{ slug: string }>> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://lpmbe-backend-production.up.railway.app';
  const res = await fetch(`${backendUrl}/pueblos?lang=es`, {
    next: { revalidate: 86400 }, // 24h
  }).catch(() => null);
  if (!res?.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

async function getRutasSitemap(): Promise<Array<{ slug: string }>> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://lpmbe-backend-production.up.railway.app';
  const res = await fetch(`${backendUrl}/rutas?lang=es`, {
    next: { revalidate: 86400 }, // 24h
  }).catch(() => null);
  if (!res?.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

export const revalidate = 86400; // regenerar sitemap cada 24h

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // 1) Home y estáticas: una URL por idioma
  for (const path of STATIC_PATHS) {
    const paths = expandPathByLocales(path || "/");
    const priority = path === "" ? 1 : path === "/experiencias" ? 0.95 : 0.8;
    for (const p of paths) {
      entries.push(toSitemapEntry(p, priority));
    }
  }

  // 2) Pueblos: /pueblos/[slug] × 6 idiomas
  const pueblos = await fetchForSitemap(getPueblosSitemap, []);
  for (const pueblo of pueblos) {
    const pathBase = `/pueblos/${pueblo.slug}`;
    const paths = expandPathByLocales(pathBase);
    for (const p of paths) {
      entries.push(toSitemapEntry(p, 0.9, "weekly"));
    }
  }

  // 3) Rutas: /rutas/[slug] × 6 idiomas
  const rutas = await fetchForSitemap(getRutasSitemap, []);
  for (const r of rutas) {
    const pathBase = `/rutas/${r.slug}`;
    const paths = expandPathByLocales(pathBase);
    for (const p of paths) {
      entries.push(toSitemapEntry(p, 0.85, "weekly"));
    }
  }

  return entries;
}
