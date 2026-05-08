import { getApiUrl } from '@/lib/api';

export type GranEventoActo = {
  id: number;
  diaId: number;
  orden: number;
  hora: string;
  texto_es: string;
  texto_i18n: Record<string, string> | null;
};

export type GranEventoDia = {
  id: number;
  eventoId: number;
  orden: number;
  label_es: string;
  label_i18n: Record<string, string> | null;
  titulo_es: string;
  titulo_i18n: Record<string, string> | null;
  actos: GranEventoActo[];
};

export type GranEventoPueblo = {
  id: number;
  eventoId: number;
  puebloId: number;
  orden: number;
  tagline_es: string | null;
  tagline_i18n: Record<string, string> | null;
  fotoUrl: string | null;
  pueblo: {
    id: number;
    slug: string;
    nombre: string;
    provincia: string;
    foto_destacada: string | null;
    lat: number;
    lng: number;
  };
};

export type GranEventoAviso = {
  id: number;
  eventoId: number;
  importancia: 'info' | 'warning' | 'critical';
  texto_es: string;
  texto_i18n: Record<string, string> | null;
  activo: boolean;
  expiraAt: string | null;
  createdAt: string;
};

export type GranEventoFoto = {
  id: number;
  eventoId: number;
  url: string;
  pieFoto_es: string | null;
  pieFoto_i18n: Record<string, string> | null;
  orden: number;
  visible: boolean;
  createdAt: string;
};

export type GranEventoRestaurante = {
  id: number;
  eventoId: number;
  orden: number;
  nombre: string;
  direccion: string | null;
  ciudad: string | null;
  lat: number | null;
  lng: number | null;
  telefono: string | null;
  web: string | null;
  fotoUrl: string | null;
  notas_es: string | null;
  notas_i18n: Record<string, string> | null;
};

export type GranEventoAlojamientoAsignacion = {
  id: number;
  alojamientoId: number;
  delegacion: string;
  persona: string;
  notas: string | null;
  orden: number;
};

export type GranEventoAlojamiento = {
  id: number;
  eventoId: number;
  orden: number;
  nombre: string;
  paraTodos: boolean;
  pendiente: boolean;
  fechaCheckIn: string;
  fechaCheckOut: string;
  direccion: string | null;
  ciudad: string | null;
  lat: number | null;
  lng: number | null;
  telefono: string | null;
  web: string | null;
  fotoUrl: string | null;
  notas_es: string | null;
  notas_i18n: Record<string, string> | null;
  asignaciones: GranEventoAlojamientoAsignacion[];
};

export type ParadaTipo =
  | 'airport'
  | 'food'
  | 'nature'
  | 'culture'
  | 'meeting'
  | 'point'
  | 'lodging'
  | 'other';

export type GranEventoParada = {
  id: number;
  eventoId: number;
  orden: number;
  nombre_es: string;
  nombre_i18n: Record<string, string> | null;
  descripcion_es: string | null;
  descripcion_i18n: Record<string, string> | null;
  lat: number;
  lng: number;
  tipoIcono: ParadaTipo;
  fotoUrl: string | null;
};

export type GranEvento = {
  id: number;
  slug: string;
  nombre: string;
  heroKicker_es: string | null;
  heroKicker_i18n: Record<string, string> | null;
  heroTitulo_es: string | null;
  heroTitulo_i18n: Record<string, string> | null;
  heroSubtitulo_es: string | null;
  heroSubtitulo_i18n: Record<string, string> | null;
  heroIntro_es: string | null;
  heroIntro_i18n: Record<string, string> | null;
  heroFederacion_es: string | null;
  heroFederacion_i18n: Record<string, string> | null;
  logoUrl: string | null;
  pdfUrl: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  contactoTitulo_es: string | null;
  contactoTitulo_i18n: Record<string, string> | null;
  contactoTexto_es: string | null;
  contactoTexto_i18n: Record<string, string> | null;
  contactoNombre: string | null;
  contactoTelefono: string | null;
  logisticaAirportTitulo_es: string | null;
  logisticaAirportTitulo_i18n: Record<string, string> | null;
  logisticaAirportTexto_es: string | null;
  logisticaAirportTexto_i18n: Record<string, string> | null;
  logisticaHotelTitulo_es: string | null;
  logisticaHotelTitulo_i18n: Record<string, string> | null;
  logisticaHotelTexto_es: string | null;
  logisticaHotelTexto_i18n: Record<string, string> | null;
  logisticaIdiomasTitulo_es: string | null;
  logisticaIdiomasTitulo_i18n: Record<string, string> | null;
  logisticaIdiomasTexto_es: string | null;
  logisticaIdiomasTexto_i18n: Record<string, string> | null;
  villagesIntro_es: string | null;
  villagesIntro_i18n: Record<string, string> | null;
  mapIntro_es: string | null;
  mapIntro_i18n: Record<string, string> | null;
  publicado: boolean;
  noindex: boolean;
  dias: GranEventoDia[];
  pueblos: GranEventoPueblo[];
  paradas: GranEventoParada[];
  alojamientos: GranEventoAlojamiento[];
  restaurantes: GranEventoRestaurante[];
};

/**
 * Helper i18n: si existe el override en el locale pedido, lo usa; si no, fallback a es.
 */
export function pickI18n(
  textEs: string | null | undefined,
  i18n: Record<string, string> | null | undefined,
  locale: string,
): string {
  if (locale !== 'es' && i18n && typeof i18n[locale] === 'string' && i18n[locale].trim()) {
    return i18n[locale];
  }
  return textEs ?? '';
}

export async function getGranEventoBySlug(slug: string): Promise<GranEvento | null> {
  const API = getApiUrl();
  try {
    const res = await fetch(`${API}/public/grandes-eventos/${encodeURIComponent(slug)}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return (await res.json()) as GranEvento;
  } catch {
    return null;
  }
}

export async function getGranEventoAvisos(slug: string): Promise<GranEventoAviso[]> {
  const API = getApiUrl();
  try {
    const res = await fetch(`${API}/public/grandes-eventos/${encodeURIComponent(slug)}/avisos`, {
      // Sin caché agresiva: avisos son urgentes.
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return (await res.json()) as GranEventoAviso[];
  } catch {
    return [];
  }
}

export async function getGranEventoFotos(slug: string, limit = 60): Promise<GranEventoFoto[]> {
  const API = getApiUrl();
  try {
    const res = await fetch(
      `${API}/public/grandes-eventos/${encodeURIComponent(slug)}/fotos?limit=${limit}`,
      { next: { revalidate: 30 } },
    );
    if (!res.ok) return [];
    return (await res.json()) as GranEventoFoto[];
  } catch {
    return [];
  }
}
