import type { MetadataRoute } from 'next';
import { getBaseUrl, SUPPORTED_LOCALES, DEFAULT_LOCALE, pathForLocale } from '@/lib/seo';
import { getApiUrl, getPuebloMainPhoto } from '@/lib/api';

type SitemapEntry = MetadataRoute.Sitemap[number];

const BASE = getBaseUrl();
const TODAY = new Date();

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

type SlugWithDate = { slug: string; updatedAt?: string | null };

async function fetchSlugsWithDates(endpoint: string, slugField = 'slug', dateField = 'updatedAt'): Promise<SlugWithDate[]> {
  try {
    const res = await fetch(`${API}${endpoint}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data) ? data : data?.items ?? [];
    const readPath = (obj: any, path: string) =>
      path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
    return items.map((i: any) => ({
      slug: readPath(i, slugField),
      updatedAt: readPath(i, dateField) ?? readPath(i, 'publishedAt') ?? readPath(i, 'createdAt'),
    })).filter((i: SlugWithDate) => i.slug);
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
  images?: string[],
  lastMod?: string | Date | null,
): SitemapEntry {
  const languages: Record<string, string> = {};
  for (const locale of SUPPORTED_LOCALES) {
    languages[locale] = `${BASE}${pathForLocale(path, locale)}`;
  }
  languages['x-default'] = `${BASE}${pathForLocale(path, DEFAULT_LOCALE)}`;

  let resolved: Date = TODAY;
  if (lastMod) {
    const d = lastMod instanceof Date ? lastMod : new Date(lastMod);
    if (!Number.isNaN(d.getTime())) resolved = d;
  }

  const out: SitemapEntry = {
    url: `${BASE}${path}`,
    lastModified: resolved,
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
  const [pueblosWithImages, rutaSlugs, noticiaItems, eventoItems, contenidoItems, semanaSantaPueblos] =
    await Promise.all([
      fetchPueblosWithImages(),
      fetchSlugs('/rutas'),
      fetchSlugsWithDates('/public/noticias?limit=1000'),
      fetchSlugsWithDates('/public/eventos?limit=1000'),
      fetchSlugsWithDates('/public/contenidos?limit=2000'),
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
  const noticias = noticiaItems.map((i) => entry(`/noticias/${i.slug}`, 0.75, 'weekly', undefined, i.updatedAt));
  const eventos = eventoItems.map((i) => entry(`/eventos/${i.slug}`, 0.75, 'weekly', undefined, i.updatedAt));
  const contenidos = contenidoItems.map((i) => entry(`/c/${i.slug}`, 0.7, 'weekly', undefined, i.updatedAt));
  const semanaSanta = semanaSantaPueblos.map((s) => entry(`/planifica/semana-santa/pueblo/${s}`, 0.6, 'weekly'));

  // Páginas SEO temáticas por pueblo
  const CATEGORIAS_SEO = ['que-comer', 'naturaleza', 'cultura', 'en-familia', 'petfriendly', 'patrimonio'];
  const paginasTematicas = pueblosWithImages.flatMap((p) =>
    CATEGORIAS_SEO.map((cat) => entry(`/${cat}/${p.slug}`, 0.75, 'monthly'))
  );

  // Páginas Club por pueblo
  const paginasClub = pueblosWithImages.flatMap((p) => [
    entry(`/donde-comer/${p.slug}`, 0.75, 'monthly'),
    entry(`/donde-dormir/${p.slug}`, 0.75, 'monthly'),
    entry(`/donde-comprar/${p.slug}`, 0.75, 'monthly'),
  ]);

  const categoriasPueblo = ['naturaleza', 'cultura', 'en-familia', 'patrimonio', 'petfriendly', 'gastronomia'];
  const paginasCategoriaPueblo = pueblosWithImages.flatMap((p) =>
    categoriasPueblo.map((cat) => entry(`/pueblos/${p.slug}/categoria/${cat}`, 0.5, 'monthly'))
  );

  const experienciasCategorias = ['gastronomia', 'naturaleza', 'cultura', 'en-familia', 'petfriendly', 'patrimonio'];
  const experienciasAsociacion = experienciasCategorias.map((cat) =>
    entry(`/experiencias/${cat}/asociacion`, 0.5, 'monthly')
  );
  const experienciasPueblo = pueblosWithImages.flatMap((p) =>
    experienciasCategorias.map((cat) => entry(`/experiencias/${cat}/pueblos/${p.slug}`, 0.5, 'monthly'))
  );

  const extraStatic: MetadataRoute.Sitemap = [
    entry('/prensa', 0.5, 'monthly'),
    entry('/app/descargar', 0.4, 'yearly'),
    entry('/app', 0.4, 'monthly'),
    entry('/para-negocios', 0.4, 'monthly'),
    entry('/noche-romantica/pueblos-participantes', 0.5, 'monthly'),
    entry('/planifica/navidad', 0.6, 'monthly'),
    entry('/planifica/la-noche-romantica', 0.5, 'monthly'),
  ];

  const productoSlugs = await fetchSlugs('/products').catch(() => [] as string[]);
  const productos = productoSlugs.map((s) => entry(`/tienda/${s}`, 0.55, 'monthly'));

  const recursoSlugs = await fetchSlugs('/public/recursos?limit=500').catch(() => [] as string[]);
  const recursos = recursoSlugs.map((s) => entry(`/recursos/${s}`, 0.45, 'monthly'));

  const socioSlugs = await fetchSlugs('/public/sello/socios').catch(() => [] as string[]);
  const socios = socioSlugs.map((s) => entry(`/el-sello/socios/${s}`, 0.35, 'monthly'));

  const navidadPueblos = pueblosWithImages.map((p) =>
    entry(`/planifica/navidad/pueblo/${p.slug}`, 0.45, 'monthly')
  );
  const finDeSemanaPueblos = pueblosWithImages.map((p) =>
    entry(`/planifica/fin-de-semana/pueblo/${p.slug}`, 0.45, 'monthly')
  );
  const nocheRomanticaPueblos = pueblosWithImages.map((p) =>
    entry(`/noche-romantica/pueblos-participantes/${p.slug}`, 0.45, 'monthly')
  );

  return [
    ...staticPages, ...extraStatic,
    ...pueblos, ...rutas, ...noticias, ...eventos, ...contenidos,
    ...semanaSanta, ...paginasTematicas, ...paginasClub,
    ...paginasCategoriaPueblo, ...experienciasAsociacion, ...experienciasPueblo,
    ...productos, ...recursos, ...socios,
    ...navidadPueblos, ...finDeSemanaPueblos, ...nocheRomanticaPueblos,
  ];
}
