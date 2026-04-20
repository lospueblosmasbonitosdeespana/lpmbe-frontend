import type { MetadataRoute } from 'next';
import { getBaseUrl, SUPPORTED_LOCALES, DEFAULT_LOCALE, pathForLocale } from '@/lib/seo';
import { getApiUrl, getPuebloMainPhoto } from '@/lib/api';
import { getCanonicalVideoSegment } from '@/lib/video-seo';

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

function normalizePathSegment(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

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

async function fetchDescubreSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API}/public/descubre?lang=es`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data) ? data : [];
    return items
      .map((item: any) => String(item?.slug || '').trim())
      .filter(Boolean);
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
async function fetchPueblosWithImages(): Promise<{ id: number; slug: string; imageUrl: string | null }[]> {
  try {
    const res = await fetch(`${API}/pueblos`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data) ? data : data?.items ?? [];
    return items.map((p: any) => ({
      id: Number(p?.id ?? 0),
      slug: p?.slug ?? '',
      imageUrl: getPuebloMainPhoto(p),
    })).filter((p: { id: number; slug: string }) => p.id > 0 && p.slug);
  } catch {
    return [];
  }
}

type SitemapVideoItem = { id: number; titulo: string };

async function fetchVideosByPuebloId(puebloId: number): Promise<SitemapVideoItem[]> {
  try {
    const res = await fetch(`${API}/pueblos/${puebloId}/videos`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data) ? data : [];
    return items
      .map((v: any) => ({
        id: Number(v?.id ?? 0),
        titulo: String(v?.titulo ?? '').trim(),
      }))
      .filter((v: SitemapVideoItem) => v.id > 0 && v.titulo.length > 0);
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

type ExplorarCountsResult = {
  tags: Array<{ tag: string; slug: string; count: number }>;
  servicios: Array<{ tipo: string; slug: string; count: number }>;
};

async function fetchExplorarCounts(): Promise<ExplorarCountsResult> {
  try {
    const res = await fetch(`${API}/public/explorar/counts?soloColecciones=true`, { cache: 'no-store' });
    if (!res.ok) return { tags: [], servicios: [] };
    return await res.json();
  } catch {
    return { tags: [], servicios: [] };
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
  // Tres sistemas de contenido distintos:
  // - /noticias/[slug] → noticias de la ASOCIACIÓN (modelo Noticia, ruta app/noticias/[slug])
  // - /eventos/[slug]  → eventos de la ASOCIACIÓN  (modelo Evento,  ruta app/eventos/[slug])
  // - /c/[slug]        → contenidos de PUEBLOS     (modelo Contenido, incluye noticias+eventos+articulos de pueblos)
  const [pueblosWithImages, rutaSlugs, noticiaItems, eventoItems, contenidoItems, semanaSantaPueblos, descubreSlugs, explorarCounts] =
    await Promise.all([
      fetchPueblosWithImages(),
      fetchSlugs('/rutas'),
      fetchSlugsWithDates('/public/noticias?limit=1000'),
      fetchSlugsWithDates('/public/eventos?limit=1000'),
      fetchSlugsWithDates('/public/contenidos?limit=2000'),
      fetchSlugs('/semana-santa/pueblos', 'pueblo.slug'),
      fetchDescubreSlugs(),
      fetchExplorarCounts(),
    ]);

  const staticPages: MetadataRoute.Sitemap = [
    entry('/', 1.0, 'daily'),
    entry('/actualidad', 0.8, 'daily'),
    entry('/mapa', 0.7, 'weekly'),
    entry('/webcams', 0.6, 'daily'),
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
    entry('/planifica', 0.8, 'weekly'),
    entry('/planifica/crea-mi-ruta', 0.7, 'monthly'),
    entry('/planifica/fin-de-semana', 0.7, 'monthly'),
    entry('/planifica/semana-santa', 0.7, 'daily'),
    entry('/pueblos', 0.9, 'weekly'),
    entry('/pueblos/comunidades', 0.7, 'monthly'),
    entry('/pueblos/provincias', 0.7, 'monthly'),
    entry('/pueblos/ultimas-incorporaciones', 0.6, 'monthly'),
    entry('/rutas', 0.8, 'weekly'),
    entry('/recursos', 0.5, 'monthly'),
    entry('/descubre', 0.65, 'weekly'),
    entry('/redes-sociales', 0.3, 'yearly'),
    entry('/aviso-legal', 0.1, 'yearly'),
    entry('/privacidad', 0.1, 'yearly'),
    entry('/cookies', 0.1, 'yearly'),
  ];

  const pueblos = pueblosWithImages.map((p) =>
    entry(`/pueblos/${p.slug}`, 0.9, 'weekly', p.imageUrl ? [p.imageUrl] : undefined)
  );
  const videosList = pueblosWithImages.map((p) =>
    entry(`/pueblos/${p.slug}/videos`, 0.55, 'monthly', p.imageUrl ? [p.imageUrl] : undefined)
  );
  const videosByPueblo = await Promise.all(
    pueblosWithImages.map(async (p) => ({
      slug: p.slug,
      videos: await fetchVideosByPuebloId(p.id),
    })),
  );
  const videosDetail = videosByPueblo.flatMap((p) =>
    p.videos.map((v) =>
      entry(`/pueblos/${p.slug}/videos/${getCanonicalVideoSegment(v)}`, 0.5, 'monthly'),
    ),
  );
  const rutas = rutaSlugs.map((s) => entry(`/rutas/${s}`, 0.8, 'weekly'));
  const noticias = noticiaItems.map((i) => entry(`/noticias/${i.slug}`, 0.8, 'weekly', undefined, i.updatedAt));
  const eventos = eventoItems.map((i) => entry(`/eventos/${i.slug}`, 0.8, 'weekly', undefined, i.updatedAt));
  // Contenidos de pueblos (noticias+eventos+artículos de pueblos) viven en /c/[slug]
  const contenidos = contenidoItems.map((i) => entry(`/c/${i.slug}`, 0.75, 'weekly', undefined, i.updatedAt));
  const descubre = descubreSlugs.map((slug) => entry(`/descubre/${slug}`, 0.6, 'weekly'));
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
  ];

  const productoSlugs = await fetchSlugs('/products').catch(() => [] as string[]);
  const productos = productoSlugs
    .map((s) => normalizePathSegment(s))
    .filter(Boolean)
    .map((s) => entry(`/tienda/${s}`, 0.55, 'monthly'));

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

  const explorarPages: MetadataRoute.Sitemap = [entry('/explorar', 0.8, 'weekly')];
  const MIN_PUEBLOS_SITEMAP = 3;
  for (const t of explorarCounts.tags) {
    if (!t.slug || t.count < MIN_PUEBLOS_SITEMAP) continue;
    explorarPages.push(entry(`/explorar/${t.slug}`, 0.65, 'weekly'));
  }
  for (const s of explorarCounts.servicios) {
    if (!s.slug || s.count < MIN_PUEBLOS_SITEMAP) continue;
    explorarPages.push(entry(`/explorar/${s.slug}`, 0.6, 'weekly'));
  }

  return [
    ...staticPages, ...extraStatic,
    ...pueblos, ...videosList, ...videosDetail, ...rutas, ...noticias, ...eventos, ...contenidos, ...descubre,
    ...semanaSanta,
    ...paginasTematicasListado, ...paginasTematicasIndividuales,
    ...paginasClub,
    ...experienciasAsociacion, ...experienciasPueblo,
    ...productos, ...recursos, ...socios,
    ...navidadPueblos, ...finDeSemanaPueblos, ...nocheRomanticaPueblos,
    ...explorarPages,
  ];
}
