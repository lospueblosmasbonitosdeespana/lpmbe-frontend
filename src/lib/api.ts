type Foto = {
  id: number;
  url: string;
  alt: string | null;
  orden: number | null;
  puebloId: number;
};

type Poi = {
  id: number;
  nombre: string;
  descripcion_corta: string | null;
  descripcion_larga: string | null;
  foto: string | null;
  lat: number | null;
  lng: number | null;
  categoria: string | null;
  orden: number | null;
  puebloId: number;
};

type Multiexperiencia = {
  id: number;
  titulo: string;
  descripcion: string | null;
  foto: string | null;
  slug: string;
  categoria: string | null;
  tipo: string;
  programa: string | null;
  qr: string | null;
  puntos: number | null;
  activo: boolean;
};

type PuebloMultiexperiencia = {
  puebloId: number;
  multiexperienciaId: number;
  orden: number | null;
  multiexperiencia: Multiexperiencia;
};

type Evento = {
  id: number;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  imagen: string | null;
};

type Noticia = {
  id: number;
  titulo: string;
  contenido: string | null;
  fecha: string | null;
  imagen: string | null;
};

export type Pueblo = {
  id: number;
  nombre: string;
  slug: string;
  provincia: string;
  comunidad: string;
  lat: number | null;
  lng: number | null;
  descripcion_corta: string | null;
  descripcion_larga: string | null;
  foto_destacada: string | null;
  puntosVisita?: number | null;
  boldestMapId?: string | null;
  fotos: Foto[];
  pois: Poi[];
  multiexperiencias: PuebloMultiexperiencia[];
  eventos: Evento[];
  noticias: Noticia[];
};

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

export async function getPuebloBySlug(slug: string): Promise<Pueblo> {
  const res = await fetch(`${API_BASE}/pueblos/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Error cargando el pueblo (slug=${slug}) status=${res.status} ${res.statusText} body=${text.slice(0, 500)}`
    );
  }

  return res.json();
}

// Función legacy para obtener lugar con multiexperiencias y POIs
// Usa el endpoint legacy que devuelve los datos con flags true/false
export async function getLugarLegacyBySlug(slug: string): Promise<Pueblo> {
  const res = await fetch(`${API_BASE}/lugares-legacy/${slug}?multiexperiencias=true&pois=true`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Error cargando el lugar legacy (slug=${slug}) status=${res.status} ${res.statusText} body=${text.slice(0, 500)}`
    );
  }

  return res.json();
}

