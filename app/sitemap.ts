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

/** Segmento URL temática → clave API (GASTRONOMIA, …). Debe coincidir con CATEGORY_API_KEYS del frontend. */
const TEMATICA_SITEMAP_SEGMENTS: Record<string, string> = {
  'que-comer': 'GASTRONOMIA',
  naturaleza: 'NATURALEZA',
  cultura: 'CULTURA',
  'en-familia': 'EN_FAMILIA',
  petfriendly: 'PETFRIENDLY',
  patrimonio: 'PATRIMONIO',
};

const EXPERIENCIAS_SEGMENT_BY_TEMATICA_SEGMENT: Record<string, string> = {
  'que-comer': 'gastronomia',
  naturaleza: 'naturaleza',
  cultura: 'cultura',
  'en-familia': 'en-familia',
  petfriendly: 'petfriendly',
  patrimonio: 'patrimonio',
};

type TematicaItem = {
  /** URL path, ej. /en-familia/ainsa o /en-familia/ainsa/bisontere */
  path: string;
  imageUrl?: string | null;
  updatedAt?: string | null;
  /** true = página de listado de categoría; false = página individual de contenido */
  isListing: boolean;
};

/**
 * Rutas temáticas para un pueblo: devuelve TANTO la página de listado de categoría
 * COMO cada página individual publicada (las que se crean a diario).
 */
async function fetchTematicaItemsForPueblo(puebloSlug: string, puebloImageUrl: string | null): Promise<TematicaItem[]> {
  try {
    const res = await fetch(`${API}/public/pueblos/${encodeURIComponent(puebloSlug)}/pages`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    const out: TematicaItem[] = [];
    for (const [segment, categoryKey] of Object.entries(TEMATICA_SITEMAP_SEGMENTS)) {
      const arr = data[categoryKey];
      if (!Array.isArray(arr) || arr.length === 0) continue;
      // Página de listado de la categoría para este pueblo
      out.push({ path: `/${segment}/${puebloSlug}`, imageUrl: puebloImageUrl, isListing: true });
      // Páginas individuales (el contenido valioso que se crea cada día)
      for (const page of arr) {
        if (!page.slug) continue;
        out.push({
          path: `/${segment}/${puebloSlug}/${page.slug}`,
          imageUrl: page.coverUrl ?? puebloImageUrl,
          updatedAt: page.updatedAt ?? null,
          isListing: false,
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}

function toExperienciaPuebloPath(tematicaPath: string): string | null {
  const parts = tematicaPath.split('/').filter(Boolean);
  if (parts.length !== 2) return null;
  const [segment, puebloSlug] = parts;
  const experienciaSegment = EXPERIENCIAS_SEGMENT_BY_TEMATICA_SEGMENT[segment];
  if (!experienciaSegment || !puebloSlug) return null;
  return `/experiencias/${experienciaSegment}/pueblos/${puebloSlug}`;
}

async function fetchExperienciasAsociacionPaths(): Promise<string[]> {
  const out: string[] = [];
  for (const [segment, category] of Object.entries(EXPERIENCIAS_SEGMENT_BY_TEMATICA_SEGMENT)) {
    const categoryKey = TEMATICA_SITEMAP_SEGMENTS[segment];
    if (!categoryKey) continue;
    try {
      const qs = new URLSearchParams({ category: categoryKey });
      const res = await fetch(`${API}/public/pages?${qs.toString()}`, { cache: 'no-store' });
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.asociacion) out.push(`/experiencias/${category}/asociacion`);
    } catch {
      // Ignorar error y continuar con la siguiente categoría.
    }
  }
  return out;
}

async function fetchParticipatingPuebloSlugs(endpoint: string): Promise<string[]> {
  try {
    const res = await fetch(`${API}${endpoint}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data) ? data : data?.items ?? [];
    return items
      .map((item: any) => item?.pueblo?.slug)
      .filter((slug: unknown): slug is string => typeof slug === 'string' && slug.trim().length > 0);
  } catch {
    return [];
  }
}

async function fetchFinDeSemanaPuebloSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API}/public/planifica/fin-de-semana`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const sources = ['asociacion', 'norte', 'sur', 'este', 'centro'] as const;
    const slugs = new Set<string>();
    for (const source of sources) {
      const events = Array.isArray(data?.[source]) ? data[source] : [];
      for (const event of events) {
        const slug = event?.pueblo?.slug;
        if (typeof slug === 'string' && slug.trim()) slugs.add(slug.trim());
      }
    }
    return Array.from(slugs);
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
  // Eliminados: /public/noticias y /public/eventos — sus rutas /noticias/[slug] y /eventos/[slug]
  // no existen en el router. Los contenidos (noticias+eventos+articulos) van todos por /c/[slug].
  const [pueblosWithImages, rutaSlugs, contenidoItems, semanaSantaPueblos] =
    await Promise.all([
      fetchPueblosWithImages(),
      fetchSlugs('/rutas'),
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
  // Todos los contenidos (noticias, eventos, artículos) viven en /c/[slug]
  const contenidos = contenidoItems.map((i) => entry(`/c/${i.slug}`, 0.75, 'weekly', undefined, i.updatedAt));
  const semanaSanta = semanaSantaPueblos.map((s) => entry(`/planifica/semana-santa/pueblo/${s}`, 0.6, 'weekly'));

  // Páginas temáticas: listado por categoría/pueblo + páginas individuales (alta prioridad, daily)
  const tematicaItemsByPueblo = await Promise.all(
    pueblosWithImages.map((p) => fetchTematicaItemsForPueblo(p.slug, p.imageUrl)),
  );
  const allTematicaItems = tematicaItemsByPueblo.flat();

  const paginasTematicasListado = allTematicaItems
    .filter((i) => i.isListing)
    .map(({ path, imageUrl }) =>
      entry(path, 0.7, 'weekly', imageUrl ? [imageUrl] : undefined),
    );

  // Las páginas individuales son el contenido fresco más valioso: prioridad alta, daily
  const paginasTematicasIndividuales = allTematicaItems
    .filter((i) => !i.isListing)
    .map(({ path, imageUrl, updatedAt }) =>
      entry(path, 0.85, 'daily', imageUrl ? [imageUrl] : undefined, updatedAt),
    );

  // Páginas Club por pueblo
  const paginasClub = pueblosWithImages.flatMap((p) => [
    entry(`/donde-comer/${p.slug}`, 0.75, 'monthly'),
    entry(`/donde-dormir/${p.slug}`, 0.75, 'monthly'),
    entry(`/donde-comprar/${p.slug}`, 0.75, 'monthly'),
  ]);

  // /pueblos/*/categoria/* son noindex (duplican las temáticas SEO /que-comer/*, /patrimonio/*, etc.)
  // No se incluyen en el sitemap.

  const experienciasAsociacionPaths = await fetchExperienciasAsociacionPaths();
  const experienciasAsociacion = experienciasAsociacionPaths.map((path) =>
    entry(path, 0.5, 'monthly'),
  );
  // Experiencias por pueblo: solo a partir de las páginas de listado (2 segmentos: /categoria/pueblo)
  const experienciasPueblo = allTematicaItems
    .filter((i) => i.isListing)
    .map(({ path, imageUrl }) => {
      const experienciaPath = toExperienciaPuebloPath(path);
      if (!experienciaPath) return null;
      return entry(experienciaPath, 0.5, 'monthly', imageUrl ? [imageUrl] : undefined);
    })
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item));

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

  const [navidadParticipantSlugs, finDeSemanaPuebloSlugs, nocheRomanticaParticipantSlugs] = await Promise.all([
    fetchParticipatingPuebloSlugs('/navidad/pueblos'),
    fetchFinDeSemanaPuebloSlugs(),
    fetchParticipatingPuebloSlugs('/noche-romantica/pueblos'),
  ]);
  const navidadPueblos = navidadParticipantSlugs.map((slug) =>
    entry(`/planifica/navidad/pueblo/${slug}`, 0.45, 'monthly'),
  );
  const finDeSemanaPueblos = finDeSemanaPuebloSlugs.map((slug) =>
    entry(`/planifica/fin-de-semana/pueblo/${slug}`, 0.45, 'monthly'),
  );
  const nocheRomanticaPueblos = nocheRomanticaParticipantSlugs.map((slug) =>
    entry(`/noche-romantica/pueblos-participantes/${slug}`, 0.45, 'monthly'),
  );

  return [
    ...staticPages, ...extraStatic,
    ...pueblos, ...rutas, ...contenidos,
    ...semanaSanta,
    ...paginasTematicasListado, ...paginasTematicasIndividuales,
    ...paginasClub,
    ...experienciasAsociacion, ...experienciasPueblo,
    ...productos, ...recursos, ...socios,
    ...navidadPueblos, ...finDeSemanaPueblos, ...nocheRomanticaPueblos,
  ];
}
