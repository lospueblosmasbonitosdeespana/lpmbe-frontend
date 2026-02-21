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

// Helper para obtener la foto principal de un pueblo
export function getPuebloMainPhoto(pueblo: any): string | null {
  if (!pueblo) return null;

  // ✅ PRIORIDAD 1: backend canonical main photo
  const main =
    pueblo.mainPhotoUrl ??
    pueblo.main_photo_url ??
    pueblo?.mainPhoto?.url ??
    pueblo?.main_photo?.url;

  if (typeof main === "string" && main.trim()) return main.trim();

  // ✅ PRIORIDAD 2: foto_destacada (campo legacy del listado)
  if (typeof pueblo.foto_destacada === "string" && pueblo.foto_destacada.trim()) {
    return pueblo.foto_destacada.trim();
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

  return (sorted[0]?.url ?? null) as string | null;
}

// Helper puro para resolver foto principal desde detalle de pueblo
export function resolvePuebloMainPhotoUrl(pueblo: any): string | null {
  const direct = pueblo?.mainPhotoUrl;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const fotos = Array.isArray(pueblo?.fotosPueblo) ? pueblo.fotosPueblo : [];
  if (!fotos.length) return null;

  const sorted = [...fotos].sort((a, b) => (a?.orden ?? 999999) - (b?.orden ?? 999999));
  const url = sorted[0]?.url;
  return typeof url === "string" && url.trim() ? url.trim() : null;
}

/** locale: idioma para contenido (es, en, fr, de, pt, it). Si no se pasa, el backend devuelve es. */
export async function getPuebloBySlug(slug: string, locale?: string): Promise<Pueblo> {
  const API_BASE = getApiUrl();
  const qs = locale ? `?lang=${encodeURIComponent(locale)}` : '';
  const res = await fetchWithTimeout(`${API_BASE}/pueblos/${slug}${qs}`, {
    cache: 'no-store',
    headers: locale ? { 'Accept-Language': locale } : undefined,
  });

  if (!res.ok) {
    throw new Error(`Error cargando pueblo (${res.status})`);
  }

  return await res.json();
}

export async function getLugarLegacyBySlug(slug: string, locale?: string): Promise<Pueblo> {
  return getPuebloBySlug(slug, locale);
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
  const qs = locale ? `?lang=${encodeURIComponent(locale)}` : '';
  try {
    const res = await fetchWithTimeout(`${API_BASE}/rutas${qs}`, {
      cache: "no-store",
      headers: locale ? { 'Accept-Language': locale } : undefined,
    });

    // Si no es OK, devolver array vacío en lugar de lanzar error
    if (!res.ok) {
      console.warn(`[RUTAS] Backend respondió ${res.status}, devolviendo []`);
      return [];
    }

    return await res.json();
  } catch (err) {
    console.error('[RUTAS] Error fetching:', err);
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


