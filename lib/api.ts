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

