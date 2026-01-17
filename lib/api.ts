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
  foto_destacada?: string | null;
  lat?: number | null;
  lng?: number | null;
  fotosPueblo?: Array<{ id: number; url: string }>;
  eventos?: Array<any>;
  noticias?: Array<any>;
  pois?: Array<any>;
  [key: string]: any; // Para propiedades adicionales como semaforo
};

export async function getPuebloBySlug(slug: string): Promise<Pueblo> {
  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/pueblos/${slug}`, {
    cache: 'no-store',
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

  return await res.json();
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
    next: { revalidate: 300 },
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


