/**
 * Helpers para las páginas del Club:
 * /donde-comer, /donde-dormir, /donde-comprar
 */
import { getApiUrl } from "@/lib/api";

export type NegocioTipo = "RESTAURANTE" | "HOTEL" | "COMERCIO";

export const NEGOCIO_TIPO_BY_SLUG: Record<string, NegocioTipo[]> = {
  "donde-comer": ["RESTAURANTE"],
  "donde-dormir": ["HOTEL"],
  "donde-comprar": ["COMERCIO"],
};

export const CLUB_PAGE_LABELS: Record<string, Record<string, string>> = {
  "donde-comer": {
    es: "Dónde Comer",
    en: "Where to Eat",
    fr: "Où Manger",
    de: "Wo Essen",
    pt: "Onde Comer",
    it: "Dove Mangiare",
    ca: "On Menjar",
  },
  "donde-dormir": {
    es: "Dónde Dormir",
    en: "Where to Sleep",
    fr: "Où Dormir",
    de: "Wo Schlafen",
    pt: "Onde Dormir",
    it: "Dove Dormire",
    ca: "On Dormir",
  },
  "donde-comprar": {
    es: "Dónde Comprar",
    en: "Where to Shop",
    fr: "Où Acheter",
    de: "Wo Kaufen",
    pt: "Onde Comprar",
    it: "Dove Comprare",
    ca: "On Comprar",
  },
};

export const CLUB_PAGE_DESCRIPTIONS: Record<string, Record<string, string>> = {
  "donde-comer": {
    es: "restaurantes, bares y lugares para comer",
    en: "restaurants, bars and places to eat",
    fr: "restaurants, bars et endroits pour manger",
    de: "Restaurants, Bars und Speisemöglichkeiten",
    pt: "restaurantes, bares e locais para comer",
    it: "ristoranti, bar e posti dove mangiare",
    ca: "restaurants, bars i llocs per menjar",
  },
  "donde-dormir": {
    es: "hoteles, casas rurales y alojamientos",
    en: "hotels, rural houses and accommodations",
    fr: "hôtels, maisons rurales et hébergements",
    de: "Hotels, Landhäuser und Unterkünfte",
    pt: "hotéis, casas rurais e alojamentos",
    it: "hotel, case rurali e alloggi",
    ca: "hotels, cases rurals i allotjaments",
  },
  "donde-comprar": {
    es: "tiendas, artesanos y comercios locales",
    en: "shops, artisans and local businesses",
    fr: "boutiques, artisans et commerces locaux",
    de: "Geschäfte, Handwerker und lokale Betriebe",
    pt: "lojas, artesãos e comércios locais",
    it: "negozi, artigiani e commerci locali",
    ca: "botigues, artesans i comerços locals",
  },
};

export type NegocioPublic = {
  id: number;
  slug?: string | null;
  nombre: string;
  tipo: string;
  scope?: string;
  descripcion?: string | null;
  fotoUrl?: string | null;
  imagenes?: { id: number; url: string; alt?: string | null; orden: number }[];
  horarios?: string | null;
  horariosSemana?: any[];
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  web?: string | null;
  whatsapp?: string | null;
  bookingUrl?: string | null;
  socialLinks?: Record<string, string> | null;
  servicios?: string[] | null;
  lat?: number | null;
  lng?: number | null;
  localidad?: string | null;
  cerradoTemporal?: boolean;
  descuentoPorcentaje?: number | null;
  imprescindible?: boolean;
  planNegocio?: string;
  puntosClub?: number | null;
  ratingVerificado?: { rating: number | null; reviews: number | null } | null;
  pueblo?: { id: number; nombre: string; slug: string; provincia?: string | null; comunidad?: string | null } | null;
  provincia?: string | null;
  comunidad?: string | null;
  ofertas?: any[];
  landingConfig?: Record<string, any> | null;
};

export type NegociosResponse = {
  pueblo: { id: number; nombre: string; slug: string; provincia?: string; comunidad?: string } | null;
  negocios: NegocioPublic[];
};

export async function getNegociosByPuebloSlug(
  puebloSlug: string,
  tipo: NegocioTipo | undefined,
  locale: string
): Promise<NegociosResponse> {
  try {
    const params = new URLSearchParams();
    if (tipo) params.set("tipo", tipo);
    if (locale && locale !== "es") params.set("lang", locale);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(
      `${getApiUrl()}/public/recursos/negocios/pueblo/${puebloSlug}${qs}`,
      { cache: "no-store" }
    );
    if (!res.ok) return { pueblo: null, negocios: [] };
    return res.json();
  } catch {
    return { pueblo: null, negocios: [] };
  }
}

export const TIPO_TO_ROUTE_SLUG: Record<string, string> = {
  RESTAURANTE: "donde-comer",
  HOTEL: "donde-dormir",
  COMERCIO: "donde-comprar",
};

export async function getNegocioBySlug(
  negocioSlug: string,
  locale: string
): Promise<NegocioPublic | null> {
  try {
    const params = new URLSearchParams();
    if (locale && locale !== "es") params.set("lang", locale);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(
      `${getApiUrl()}/public/recursos/${negocioSlug}${qs}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
