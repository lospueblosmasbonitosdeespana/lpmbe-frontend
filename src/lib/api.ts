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
  semaforo?: {
    estado?: "VERDE" | "AMARILLO" | "ROJO" | null;
    mensaje?: string | null;
    ultima_actualizacion?: string | Date | null;
  } | null;
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
  // 1️⃣ Listado de pueblos DESDE LA API
  const listRes = await fetch(`${API_BASE}/pueblos`, {
    cache: "no-store",
  });

  if (!listRes.ok) {
    throw new Error("No se pudo cargar el listado de pueblos");
  }

  const pueblos: Pueblo[] = await listRes.json();

  // 2️⃣ Buscar por slug
  const pueblo = pueblos.find((p) => p.slug === slug);

  if (!pueblo) {
    throw new Error("Pueblo no encontrado");
  }

  // 3️⃣ Detalle por ID
  const res = await fetch(`${API_BASE}/pueblos/${pueblo.id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Error cargando el pueblo");
  }

  return res.json();
}

