import type { MediaItem } from '@/src/types/media';
import { fetchWithTimeout } from '@/lib/fetch-safe';

export function getApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

// Tipo básico para Pueblo (puede extenderse según necesidad)
export type Pueblo = {
  id: number;
  nombre: string;
  slug: string;
  provincia: string;
  comunidad: string;
  descripcion?: string | null;
  mainPhotoUrl?: string | null; // ✅ ÚNICA fuente de verdad para foto principal
  lat?: number | null;
  lng?: number | null;
  eventos?: Array<any>;
  noticias?: Array<any>;
  pois?: Array<any>;
  [key: string]: any; // Para propiedades adicionales como semaforo
};

/**
 * Convierte respuestas de API (string, MediaItem, { url }, etc.) en URL usable.
 * Evita que objetos acaben en el sitemap como el literal "[object Object]" en &lt;image:loc&gt;.
 */
export function coerceImageUrlString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string') {
    const t = value.trim();
    return t.length ? t : null;
  }
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    for (const key of ['url', 'publicUrl', 'src', 'href'] as const) {
      const inner = o[key];
      if (typeof inner === 'string' && inner.trim()) return inner.trim();
    }
    if (o.media && typeof o.media === 'object') {
      const m = (o.media as Record<string, unknown>).url;
      if (typeof m === 'string' && m.trim()) return m.trim();
    }
  }
  return null;
}

// Helper para obtener la foto principal de un pueblo
export function getPuebloMainPhoto(pueblo: any): string | null {
  if (!pueblo) return null;

  // ✅ PRIORIDAD 1–2: main photo / legacy (cada campo puede ser string u objeto anidado)
  const priority: unknown[] = [
    pueblo.mainPhotoUrl,
    pueblo.main_photo_url,
    pueblo?.mainPhoto,
    pueblo?.main_photo,
    pueblo.foto_destacada,
  ];
  for (const raw of priority) {
    const u = coerceImageUrlString(raw);
    if (u) return u;
  }

  // ✅ PRIORIDAD 3: fallback a array de fotos (solo si viene array; en listas NO viene)
  const fotos =
    pueblo?.fotosPueblo ??
    pueblo?.fotos ??
    pueblo?.fotosGaleria ??
    pueblo?.galeria ??
    [];

  if (!Array.isArray(fotos) || fotos.length === 0) return null;

  const sorted = [...fotos].sort(
    (a, b) => (a?.orden ?? a?.order ?? 999999) - (b?.orden ?? b?.order ?? 999999)
  );

  const first = sorted[0];
  return coerceImageUrlString(first) ?? coerceImageUrlString((first as { url?: unknown })?.url);
}

// Helper puro para resolver foto principal desde detalle de pueblo
export function resolvePuebloMainPhotoUrl(pueblo: any): string | null {
  const direct = coerceImageUrlString(pueblo?.mainPhotoUrl);
  if (direct) return direct;

  const fotos = Array.isArray(pueblo?.fotosPueblo) ? pueblo.fotosPueblo : [];
  if (!fotos.length) return null;

  const sorted = [...fotos].sort((a, b) => (a?.orden ?? 999999) - (b?.orden ?? 999999));
  const first = sorted[0];
  return coerceImageUrlString(first) ?? coerceImageUrlString(first?.url);
}

/** locale: idioma para contenido (es, en, fr, de, pt, it). Si no se pasa, el backend devuelve es. */
export async function getPuebloBySlug(slug: string, locale?: string): Promise<Pueblo> {
  const API_BASE = getApiUrl();
  const fetchPueblo = async (lang?: string): Promise<Response> => {
    const qs = lang ? `?lang=${encodeURIComponent(lang)}` : '';
    return fetchWithTimeout(`${API_BASE}/pueblos/${slug}${qs}`, {
      cache: 'no-store',
      headers: lang ? { 'Accept-Language': lang } : undefined,
    });
  };

  try {
    const res = await fetchPueblo(locale);
    if (res.ok) return await res.json();

    // Fallback to Spanish when locale-specific content fails during crawls.
    if (locale && locale !== 'es') {
      const fallbackRes = await fetchPueblo('es');
      if (fallbackRes.ok) return await fallbackRes.json();
    }

    throw new Error(`Error cargando pueblo (${res.status})`);
  } catch (error) {
    if (locale && locale !== 'es') {
      const fallbackRes = await fetchPueblo('es');
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    throw error;
  }
}

export async function getLugarLegacyBySlug(slug: string, locale?: string): Promise<Pueblo> {
  return getPuebloBySlug(slug, locale);
}

/**
 * Version optimizada para generateMetadata(): timeout corto (4 s), sin reintentos.
 * Retorna null en vez de lanzar para que Next.js cierre el <head> rapidamente
 * con metadatos de fallback en lugar de esperar al backend.
 */
export async function getPuebloBySlugFast(slug: string, locale?: string): Promise<Pueblo | null> {
  const API_BASE = getApiUrl();
  const fetchOne = (lang?: string) => {
    const qs = lang ? `?lang=${encodeURIComponent(lang)}` : '';
    return fetchWithTimeout(`${API_BASE}/pueblos/${slug}${qs}`, {
      cache: 'no-store',
      headers: lang ? { 'Accept-Language': lang } : undefined,
      timeoutMs: 4000,
      retries: 0,
    });
  };
  try {
    const res = await fetchOne(locale);
    if (res.ok) return await res.json();
    if (locale && locale !== 'es') {
      const fb = await fetchOne('es');
      if (fb.ok) return await fb.json();
    }
    return null;
  } catch {
    return null;
  }
}

/** Listado ligero para cálculos (pueblos cercanos, etc.) */
export type PuebloLite = {
  id: number;
  nombre: string;
  slug: string;
  provincia: string;
  comunidad: string;
  lat: number;
  lng: number;
  foto_destacada?: string | null;
  anioIncorporacion?: number | null;
  anioExpulsion?: number | null;
  anioReincorporacion?: number | null;
};

export async function getPueblosLite(locale?: string): Promise<PuebloLite[]> {
  const API_BASE = getApiUrl();
  const qs = locale ? `?lang=${encodeURIComponent(locale)}` : '';
  try {
    const res = await fetchWithTimeout(`${API_BASE}/pueblos${qs}`, {
      cache: "no-store",
      headers: locale ? { 'Accept-Language': locale } : undefined,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getPoiById(poiId: string | number, locale?: string) {
  const API_BASE = getApiUrl();
  const qs = locale ? `?lang=${encodeURIComponent(locale)}` : '';
  const res = await fetchWithTimeout(`${API_BASE}/pois/${poiId}${qs}`, {
    cache: "no-store",
    headers: locale ? { 'Accept-Language': locale } : undefined,
  });

  if (!res.ok) {
    throw new Error(`Error cargando POI: ${res.status}`);
  }

  const poi = await res.json();
  
  // Si tiene fotos, extraer la primera como foto principal
  if (Array.isArray(poi.fotosPoi) && poi.fotosPoi.length > 0) {
    const fotoPrincipal = poi.fotosPoi.find((f: any) => f.order === 1) ?? poi.fotosPoi[0];
    poi.fotoPrincipalUrl = fotoPrincipal?.publicUrl ?? null;
  }
  
  return poi;
}

// Helper para obtener la foto principal de un POI
export function getPoiMainPhoto(poi: any): string | null {
  // 1. Intentar desde fotosPoi (nuevo sistema con MediaItem)
  if (Array.isArray(poi.fotosPoi) && poi.fotosPoi.length > 0) {
    const principal = poi.fotosPoi.find((f: any) => f.order === 1) ?? poi.fotosPoi[0];
    return principal?.publicUrl ?? principal?.url ?? null;
  }
  
  // 2. Fallback a fotoUrl o foto (legacy)
  return poi.fotoUrl ?? poi.foto ?? poi.imagen ?? null;
}

// Tipos para Rutas
export type Ruta = {
  id: number;
  titulo: string;
  slug: string;
  descripcion: string | null;
  foto_portada: string | null;
  logo?: { id: number; nombre: string; url: string; etiqueta?: string | null } | null;
  distancia_km: number | null;
  dificultad: string | null;
  tipo: string | null;
  tiempo_estimado: string | null;
  activo: boolean;
  boldestMapId?: string | null;
  boldestMapSlug?: string | null;
  programa?: string | null;
  pueblos?: Array<{
    id: number;
    nombre: string;
    slug: string;
    orden: number;
  }>;
};

export type RutaMapa = {
  ruta: {
    id: number;
    titulo: string;
    slug: string;
    boldest: {
      mapId?: string | null;
      slug?: string | null;
    } | null;
  };
  pueblos: Array<{
    id: number;
    nombre: string;
    slug: string;
    orden: number;
  }>;
};

// Obtener todas las rutas activas
export async function getRutas(locale?: string): Promise<Ruta[]> {
  const API_BASE = getApiUrl();
  const fetchRutas = async (lang?: string): Promise<Response> => {
    const qs = lang ? `?lang=${encodeURIComponent(lang)}` : '';
    return fetchWithTimeout(`${API_BASE}/rutas${qs}`, {
      cache: "no-store",
      headers: lang ? { 'Accept-Language': lang } : undefined,
    });
  };

  try {
    const res = await fetchRutas(locale);
    if (res.ok) return await res.json();

    if (locale && locale !== 'es') {
      const fallbackRes = await fetchRutas('es');
      if (fallbackRes.ok) return await fallbackRes.json();
    }

    console.warn(`[RUTAS] Backend respondió ${res.status}, devolviendo []`);
    return [];
  } catch (err) {
    if (locale && locale !== 'es') {
      try {
        const fallbackRes = await fetchRutas('es');
        if (fallbackRes.ok) return await fallbackRes.json();
      } catch {
        // ignore secondary error
      }
    }
    console.error('[RUTAS] Error fetching:', err);
    return [];
  }
}

/** Version rapida de getRutas para generateMetadata (4 s timeout, 0 retries). */
export async function getRutasFast(locale?: string): Promise<Ruta[]> {
  const API_BASE = getApiUrl();
  const qs = locale ? `?lang=${encodeURIComponent(locale)}` : '';
  try {
    const res = await fetchWithTimeout(`${API_BASE}/rutas${qs}`, {
      cache: 'no-store',
      headers: locale ? { 'Accept-Language': locale } : undefined,
      timeoutMs: 4000,
      retries: 0,
    });
    if (res.ok) return await res.json();
    return [];
  } catch {
    return [];
  }
}

// Obtener ruta por ID
export async function getRutaById(id: number, locale?: string): Promise<Ruta> {
  const API_BASE = getApiUrl();
  const qs = locale ? `?lang=${encodeURIComponent(locale)}` : '';
  const res = await fetchWithTimeout(`${API_BASE}/rutas/${id}${qs}`, {
    cache: 'no-store',
    headers: locale ? { 'Accept-Language': locale } : undefined,
  });

  if (!res.ok) {
    throw new Error(`Error cargando ruta: ${res.status}`);
  }

  return await res.json();
}

// Obtener mapa de ruta
export async function getRutaMapa(id: number, locale?: string): Promise<RutaMapa> {
  const API_BASE = getApiUrl();
  const qs = locale ? `?lang=${encodeURIComponent(locale)}` : '';
  const res = await fetchWithTimeout(`${API_BASE}/rutas/${id}/mapa${qs}`, {
    next: { revalidate: 300 },
    headers: locale ? { 'Accept-Language': locale } : undefined,
  });

  if (!res.ok) {
    throw new Error(`Error cargando mapa de ruta: ${res.status}`);
  }

  return await res.json();
}


