/**
 * JSON-LD Schema.org `Restaurant` para restaurantes premium del Club LPMBE.
 *
 * Aporta SEO específico de restauración: menús, rango de precios, cocina,
 * horarios estructurados (con `dayOfWeek` válido), `aggregateRating` y enlaces
 * de reserva. Lo consumen Google (rich results) y otros motores.
 */

import { getCanonicalUrl, type SupportedLocale } from '@/lib/seo';

// Convención del schema: 0=Lun, 1=Mar, 2=Mié, 3=Jue, 4=Vie, 5=Sáb, 6=Dom
const DAY_NAMES = [
  'https://schema.org/Monday',
  'https://schema.org/Tuesday',
  'https://schema.org/Wednesday',
  'https://schema.org/Thursday',
  'https://schema.org/Friday',
  'https://schema.org/Saturday',
  'https://schema.org/Sunday',
] as const;

interface MenuItem {
  nombre: string;
  precio?: number | string | null;
  precioNota?: string | null;
  descripcion?: string | null;
  cursos?: string[];
}

interface SignatureDish {
  nombre: string;
  precio?: string | null;
}

interface RecursoForJsonLd {
  id: number;
  nombre: string;
  slug: string;
  tipo: string;
  descripcion?: string | null;
  telefono?: string | null;
  email?: string | null;
  web?: string | null;
  bookingUrl?: string | null;
  fotoUrl?: string | null;
  imagenes?: { url: string }[];
  lat?: number | null;
  lng?: number | null;
  horariosSemana?: Array<{
    diaSemana: number;
    abierto: boolean;
    horaAbre: string | null;
    horaCierra: string | null;
  }>;
  ratingVerificado?: { rating: number | null; reviews: number | null } | null;
  pueblo?: { nombre: string; provincia?: string | null; comunidad?: string | null } | null;
  provincia?: string | null;
  comunidad?: string | null;
  landingConfig?: {
    menus?: { items: MenuItem[] };
    platos?: { items: SignatureDish[] };
    infoPractica?: { tipoServicio?: string | null };
    chef?: { nombre: string };
  } | null;
}

function priceRangeFromMenus(menus?: MenuItem[]): string | undefined {
  if (!menus || menus.length === 0) return undefined;
  const precios = menus
    .map((m) => (typeof m.precio === 'number' ? m.precio : Number.parseFloat(String(m.precio ?? '').replace(/[^\d.,]/g, '').replace(',', '.'))))
    .filter((n) => Number.isFinite(n) && n > 0) as number[];
  if (precios.length === 0) return undefined;
  const min = Math.min(...precios);
  const max = Math.max(...precios);
  if (min < 25) return '€€';
  if (min < 50) return '€€€';
  return '€€€€';
}

export function buildRestaurantJsonLd(recurso: RecursoForJsonLd, path: string, locale: SupportedLocale = 'es') {
  const url = getCanonicalUrl(path, locale);
  const lc = recurso.landingConfig ?? {};

  const photoUrls = (recurso.imagenes && recurso.imagenes.length > 0
    ? recurso.imagenes.map((i) => i.url)
    : recurso.fotoUrl ? [recurso.fotoUrl] : []
  ).filter(Boolean);

  const openingHours = (recurso.horariosSemana ?? [])
    .filter((h) => h.abierto && h.horaAbre && h.horaCierra)
    .map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: DAY_NAMES[h.diaSemana] ?? DAY_NAMES[0],
      opens: h.horaAbre,
      closes: h.horaCierra,
    }));

  const menuItems = lc.menus?.items ?? [];
  const platoItems = lc.platos?.items ?? [];

  const hasMenu = menuItems.length > 0 || platoItems.length > 0;

  const priceRange = priceRangeFromMenus(menuItems) ?? '€€€';

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': url + '#restaurant',
    name: recurso.nombre,
    url,
    description: recurso.descripcion ?? undefined,
    image: photoUrls,
    priceRange,
    servesCuisine: lc.infoPractica?.tipoServicio ? undefined : 'Cocina de autor con producto local',
    telephone: recurso.telefono ?? undefined,
    email: recurso.email ?? undefined,
    sameAs: recurso.web ? [recurso.web] : undefined,
  };

  if (recurso.lat != null && recurso.lng != null) {
    jsonLd.geo = {
      '@type': 'GeoCoordinates',
      latitude: recurso.lat,
      longitude: recurso.lng,
    };
  }

  const addressLocality = recurso.pueblo?.nombre;
  const addressRegion = recurso.pueblo?.comunidad ?? recurso.comunidad;
  if (addressLocality || addressRegion) {
    jsonLd.address = {
      '@type': 'PostalAddress',
      addressCountry: 'ES',
      addressLocality,
      addressRegion,
    };
  }

  if (openingHours.length > 0) {
    jsonLd.openingHoursSpecification = openingHours;
  }

  if (recurso.bookingUrl) {
    jsonLd.acceptsReservations = 'https://schema.org/True';
    jsonLd.potentialAction = {
      '@type': 'ReserveAction',
      target: recurso.bookingUrl,
    };
  }

  if (recurso.ratingVerificado?.rating != null) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: recurso.ratingVerificado.rating,
      reviewCount: recurso.ratingVerificado.reviews ?? undefined,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (hasMenu) {
    const menuSections: any[] = [];
    if (menuItems.length > 0) {
      menuSections.push({
        '@type': 'MenuSection',
        name: 'Menús',
        hasMenuItem: menuItems.map((m) => ({
          '@type': 'MenuItem',
          name: m.nombre,
          description: m.descripcion ?? undefined,
          offers: m.precio
            ? {
                '@type': 'Offer',
                price: typeof m.precio === 'number' ? m.precio : String(m.precio).replace(/[^\d.,]/g, '').replace(',', '.'),
                priceCurrency: 'EUR',
              }
            : undefined,
        })),
      });
    }
    if (platoItems.length > 0) {
      menuSections.push({
        '@type': 'MenuSection',
        name: 'Platos imprescindibles',
        hasMenuItem: platoItems.map((p) => ({
          '@type': 'MenuItem',
          name: p.nombre,
          offers:
            p.precio && p.precio !== '—'
              ? {
                  '@type': 'Offer',
                  price: String(p.precio).replace(/[^\d.,]/g, '').replace(',', '.'),
                  priceCurrency: 'EUR',
                }
              : undefined,
        })),
      });
    }
    jsonLd.hasMenu = {
      '@type': 'Menu',
      name: 'Carta',
      hasMenuSection: menuSections,
    };
  }

  if (lc.chef?.nombre) {
    jsonLd.employee = {
      '@type': 'Person',
      name: lc.chef.nombre,
      jobTitle: 'Chef',
    };
  }

  // Limpia undefined para que el JSON-LD sea más liviano
  return JSON.parse(JSON.stringify(jsonLd));
}
