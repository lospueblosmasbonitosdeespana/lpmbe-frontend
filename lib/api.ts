import type { MediaItem } from '@/src/types/media';

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
  foto_destacada?: string | null; // Legacy, se mantiene por compatibilidad
  lat?: number | null;
  lng?: number | null;
  fotosPueblo?: MediaItem[]; // ✅ Ahora usa MediaItem del sistema unificado
  eventos?: Array<any>;
  noticias?: Array<any>;
  pois?: Array<any>;
  [key: string]: any; // Para propiedades adicionales como semaforo
};

// Helper para obtener la foto principal de un pueblo
// ✅ Solo sistema nuevo - sin fallbacks legacy
export function getPuebloMainPhoto(pueblo: Pueblo): string | null {
  // Obtener desde fotosPueblo (sistema /media unificado)
  if (Array.isArray(pueblo.fotosPueblo) && pueblo.fotosPueblo.length > 0) {
    // Buscar foto con order=1 (principal) o tomar la primera
    const principal = pueblo.fotosPueblo.find(f => f.order === 1) ?? pueblo.fotosPueblo[0];
    return principal.publicUrl;
  }
  
  // Sin fallback legacy - si no hay media, es correcto mostrar "Sin imagen"
  return null;
}

export async function getPuebloBySlug(slug: string): Promise<Pueblo> {
  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/pueblos/${slug}`, {
    cache: 'no-store',
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Error cargando pueblo: ${res.status}`);
  }

  return await res.json();
}

export async function getLugarLegacyBySlug(slug: string): Promise<Pueblo> {
  // Por ahora, usar la misma función
  return getPuebloBySlug(slug);
}

export async function getPoiById(poiId: string | number) {
  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/pois/${poiId}`, {
    cache: "no-store",
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
  distancia: number | null;
  dificultad: string | null;
  tipo: string | null;
  tiempo: number | null;
  activo: boolean;
  boldestMapId?: string | null;
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
export async function getRutas(): Promise<Ruta[]> {
  const API_BASE = getApiUrl();
  
  try {
    const res = await fetch(`${API_BASE}/rutas`, {
      cache: "no-store", // no-store para evitar fallos en build
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
export async function getRutaById(id: number): Promise<Ruta> {
  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/rutas/${id}`, {
    cache: 'no-store', // Sin cache para ver cambios al instante
  });

  if (!res.ok) {
    throw new Error(`Error cargando ruta: ${res.status}`);
  }

  return await res.json();
}

// Obtener mapa de ruta
export async function getRutaMapa(id: number): Promise<RutaMapa> {
  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/rutas/${id}/mapa`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Error cargando mapa de ruta: ${res.status}`);
  }

  return await res.json();
}


