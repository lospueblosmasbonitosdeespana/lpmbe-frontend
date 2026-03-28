import type { MetadataRoute } from 'next';
import { getBaseUrl, SUPPORTED_LOCALES, DEFAULT_LOCALE, pathForLocale } from '@/lib/seo';
import { getApiUrl, getPuebloMainPhoto } from '@/lib/api';

type SitemapEntry = MetadataRoute.Sitemap[number];

const BASE = getBaseUrl();

/** Solo URLs absolutas http(s) en image:image; evita basura y relativa inválida para Google. */
function normalizeSitemapImageUrls(images?: string[]): string[] | undefined {
  if (!images?.length) return undefined;
  const out: string[] = [];
  for (const raw of images) {
    if (typeof raw !== 'string') continue;
    const t = raw.trim();
    if (!t || t === '[object Object]') continue;
    const abs =
      t.startsWith('http://') || t.startsWith('https://')
        ? t
        : t.startsWith('/')
          ? `${BASE}${t}`
          : null;
    if (abs && (abs.startsWith('http://') || abs.startsWith('https://'))) out.push(abs);
  }
  return out.length ? out : undefined;
}
const API = getApiUrl();

async function fetchSlugs(endpoint: string, slugField = 'slug'): Promise<string[]> {
  try {
    const res = await fetch(`${API}${endpoint}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data) ? data : data?.items ?? [];
    const readPath = (obj: any, path: string) =>
      path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
    return items.map((i: any) => readPath(i, slugField)).filter(Boolean);
  } catch {
    return [];
  }
}

/** Para sitemap de imágenes: pueblos con slug + URL de foto principal (para indexación en Google). */
async function fetchPueblosWithImages(): Promise<{ slug: string; imageUrl: string | null }[]> {
  try {
    const res = await fetch(`${API}/pueblos`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data) ? data : data?.items ?? [];
    return items.map((p: any) => ({
      slug: p?.slug ?? '',
      imageUrl: getPuebloMainPhoto(p),
    })).filter((p: { slug: string }) => p.slug);
  } catch {
    return [];
  }
}

function entry(
  path: string,
  priority: number,
  changeFrequency: SitemapEntry['changeFrequency'] = 'weekly',
  images?: string[]
): SitemapEntry {
  const languages: Record<string, string> = {};
  for (const locale of SUPPORTED_LOCALES) {
    languages[locale] = `${BASE}${pathForLocale(path, locale)}`;
  }
  languages['x-default'] = `${BASE}${pathForLocale(path, DEFAULT_LOCALE)}`;

  const out: SitemapEntry = {
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: { languages },
  };
  const safeImages = normalizeSitemapImageUrls(images);
  if (safeImages?.length) {
    (out as { images?: string[] }).images = safeImages;
  }
  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pueblosWithImages, rutaSlugs, noticiaSlugs, eventoSlugs, contenidoSlugs, semanaSantaPueblos] =
    await Promise.all([
      fetchPueblosWithImages(),
      fetchSlugs('/rutas'),
      fetchSlugs('/public/noticias?limit=1000'),
      fetchSlugs('/public/eventos?limit=1000'),
      fetchSlugs('/public/contenidos?limit=2000'),
      fetchSlugs('/semana-santa/pueblos', 'pueblo.slug'),
    ]);

  const staticPages: MetadataRoute.Sitemap = [
    entry('/', 1.0, 'daily'),
    entry('/actualidad', 0.8, 'daily'),
    entry('/mapa', 0.7, 'weekly'),
    entry('/meteo', 0.5, 'daily'),
    entry('/contacto', 0.3, 'yearly'),
    entry('/newsletter', 0.3, 'yearly'),
    entry('/club', 0.6, 'monthly'),
    entry('/tienda', 0.6, 'weekly'),
    entry('/noche-romantica', 0.6, 'monthly'),
    entry('/el-sello', 0.5, 'monthly'),
    entry('/el-sello/quienes-somos', 0.5, 'monthly'),
    entry('/el-sello/criterios', 0.4, 'yearly'),
    entry('/el-sello/proceso', 0.4, 'yearly'),
    entry('/el-sello/como-se-obtiene', 0.4, 'yearly'),
    entry('/el-sello/internacional', 0.4, 'yearly'),
    entry('/el-sello/socios', 0.4, 'monthly'),
    entry('/el-sello/unete', 0.4, 'yearly'),
    entry('/experiencias', 0.7, 'weekly'),
    entry('/experiencias/gastronomia', 0.65, 'monthly'),
    entry('/experiencias/naturaleza', 0.65, 'monthly'),
    entry('/experiencias/cultura', 0.65, 'monthly'),
    entry('/experiencias/en-familia', 0.65, 'monthly'),
    entry('/experiencias/petfriendly', 0.65, 'monthly'),
    entry('/experiencias/patrimonio', 0.65, 'monthly'),
    entry('/multiexperiencias', 0.6, 'weekly'),
    entry('/planifica/crea-mi-ruta', 0.7, 'monthly'),
    entry('/planifica/fin-de-semana', 0.7, 'monthly'),
    entry('/planifica/semana-santa', 0.7, 'daily'),
    entry('/pueblos', 0.9, 'weekly'),
    entry('/pueblos/comunidades', 0.7, 'monthly'),
    entry('/pueblos/provincias', 0.7, 'monthly'),
    entry('/pueblos/ultimas-incorporaciones', 0.6, 'monthly'),
    entry('/rutas', 0.8, 'weekly'),
    entry('/recursos', 0.5, 'monthly'),
    entry('/redes-sociales', 0.3, 'yearly'),
    entry('/aviso-legal', 0.1, 'yearly'),
    entry('/privacidad', 0.1, 'yearly'),
    entry('/cookies', 0.1, 'yearly'),
  ];

  const pueblos = pueblosWithImages.map((p) =>
    entry(`/pueblos/${p.slug}`, 0.9, 'weekly', p.imageUrl ? [p.imageUrl] : undefined)
  );
  const rutas = rutaSlugs.map((s) => entry(`/rutas/${s}`, 0.8, 'weekly'));
  // Noticias, eventos y contenidos /c/ (lo que publican alcaldes): prioridad alta para que Google indexe
  const noticias = noticiaSlugs.map((s) => entry(`/noticias/${s}`, 0.75, 'weekly'));
  const eventos = eventoSlugs.map((s) => entry(`/eventos/${s}`, 0.75, 'weekly'));
  const contenidos = contenidoSlugs.map((s) => entry(`/c/${s}`, 0.7, 'weekly'));
  const semanaSanta = semanaSantaPueblos.map((s) => entry(`/planifica/semana-santa/pueblo/${s}`, 0.6, 'weekly'));

  // Páginas SEO temáticas por pueblo
  const CATEGORIAS_SEO = ['gastronomia', 'naturaleza', 'cultura', 'en-familia', 'petfriendly', 'patrimonio'];
  const paginasTematicas = pueblosWithImages.flatMap((p) =>
    CATEGORIAS_SEO.map((cat) => entry(`/${cat}/${p.slug}`, 0.75, 'monthly'))
  );

  // Páginas Club por pueblo
  const paginasClub = pueblosWithImages.flatMap((p) => [
    entry(`/donde-comer/${p.slug}`, 0.75, 'monthly'),
    entry(`/donde-dormir/${p.slug}`, 0.75, 'monthly'),
    entry(`/donde-comprar/${p.slug}`, 0.75, 'monthly'),
  ]);

  return [...staticPages, ...pueblos, ...rutas, ...noticias, ...eventos, ...contenidos, ...semanaSanta, ...paginasTematicas, ...paginasClub];
}
