import type { MetadataRoute } from 'next';
import { getBaseUrl, SUPPORTED_LOCALES, DEFAULT_LOCALE, pathForLocale } from '@/lib/seo';
import { getApiUrl } from '@/lib/api';

type SitemapEntry = MetadataRoute.Sitemap[number];

const BASE = getBaseUrl();
const API = getApiUrl();

async function fetchSlugs(endpoint: string, slugField = 'slug'): Promise<string[]> {
  try {
    const res = await fetch(`${API}${endpoint}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data) ? data : data?.items ?? [];
    return items.map((i: any) => i[slugField]).filter(Boolean);
  } catch {
    return [];
  }
}

function entry(path: string, priority: number, changeFrequency: SitemapEntry['changeFrequency'] = 'weekly'): SitemapEntry {
  const languages: Record<string, string> = {};
  for (const locale of SUPPORTED_LOCALES) {
    languages[locale] = `${BASE}${pathForLocale(path, locale)}`;
  }
  languages['x-default'] = `${BASE}${pathForLocale(path, DEFAULT_LOCALE)}`;

  return {
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: { languages },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [puebloSlugs, rutaSlugs, noticiaSlugs, eventoSlugs, contenidoSlugs] =
    await Promise.all([
      fetchSlugs('/pueblos'),
      fetchSlugs('/rutas'),
      fetchSlugs('/public/noticias?limit=1000'),
      fetchSlugs('/public/eventos?limit=1000'),
      fetchSlugs('/public/contenidos?limit=1000'),
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
    entry('/multiexperiencias', 0.6, 'weekly'),
    entry('/planifica/crea-mi-ruta', 0.7, 'monthly'),
    entry('/planifica/fin-de-semana', 0.7, 'monthly'),
    entry('/pueblos', 0.9, 'weekly'),
    entry('/pueblos/comunidades', 0.7, 'monthly'),
    entry('/pueblos/provincias', 0.7, 'monthly'),
    entry('/pueblos/ultimas-incorporaciones', 0.6, 'monthly'),
    entry('/rutas', 0.8, 'weekly'),
    entry('/noticias', 0.8, 'daily'),
    entry('/eventos', 0.8, 'daily'),
    entry('/recursos', 0.5, 'monthly'),
    entry('/redes-sociales', 0.3, 'yearly'),
    entry('/aviso-legal', 0.1, 'yearly'),
    entry('/privacidad', 0.1, 'yearly'),
    entry('/cookies', 0.1, 'yearly'),
  ];

  const pueblos = puebloSlugs.map((s) => entry(`/pueblos/${s}`, 0.9, 'weekly'));
  const rutas = rutaSlugs.map((s) => entry(`/rutas/${s}`, 0.8, 'weekly'));
  const noticias = noticiaSlugs.map((s) => entry(`/noticias/${s}`, 0.6, 'monthly'));
  const eventos = eventoSlugs.map((s) => entry(`/eventos/${s}`, 0.6, 'monthly'));
  const contenidos = contenidoSlugs.map((s) => entry(`/c/${s}`, 0.5, 'monthly'));

  return [...staticPages, ...pueblos, ...rutas, ...noticias, ...eventos, ...contenidos];
}
