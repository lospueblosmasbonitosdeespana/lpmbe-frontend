/**
 * JSON-LD Schema.org genérico para los 3 tipos premium no-restaurante:
 *
 *  - Hotel / Casa rural        → @type: LodgingBusiness
 *  - Actividad / Experiencia   → @type: TouristAttraction (+ Service)
 *  - Comercio / Tienda         → @type: Store
 *
 * El restaurante usa el helper específico `restaurant-json-ld.ts` por su
 * riqueza (menú, priceRange, aggregateRating, etc.).
 */

import { getCanonicalUrl, type SupportedLocale } from '@/lib/seo'

const DAY_NAMES = [
  'https://schema.org/Monday',
  'https://schema.org/Tuesday',
  'https://schema.org/Wednesday',
  'https://schema.org/Thursday',
  'https://schema.org/Friday',
  'https://schema.org/Saturday',
  'https://schema.org/Sunday',
] as const

interface RecursoForJsonLd {
  id: number
  nombre: string
  slug: string
  tipo: string
  descripcion?: string | null
  telefono?: string | null
  email?: string | null
  web?: string | null
  bookingUrl?: string | null
  fotoUrl?: string | null
  imagenes?: { url: string }[]
  lat?: number | null
  lng?: number | null
  horariosSemana?: Array<{
    diaSemana: number
    abierto: boolean
    horaAbre: string | null
    horaCierra: string | null
  }>
  ratingVerificado?: { rating: number | null; reviews: number | null } | null
  pueblo?: { nombre: string; provincia?: string | null; comunidad?: string | null } | null
  provincia?: string | null
  comunidad?: string | null
}

interface BuildOptions {
  /**
   * Tipo Schema.org. Si no se pasa, se infiere a partir de `recurso.tipo`.
   */
  schemaType?: 'LodgingBusiness' | 'Hotel' | 'TouristAttraction' | 'Store' | 'LocalBusiness'
}

function inferType(tipo: string): NonNullable<BuildOptions['schemaType']> {
  if (tipo === 'HOTEL' || tipo === 'CASA_RURAL') return 'LodgingBusiness'
  if (tipo === 'EXPERIENCIA') return 'TouristAttraction'
  if (tipo === 'COMERCIO' || tipo === 'TIENDA_ARTESANIA' || tipo === 'BODEGA') return 'Store'
  return 'LocalBusiness'
}

export function buildBusinessJsonLd(
  recurso: RecursoForJsonLd,
  path: string,
  locale: SupportedLocale = 'es',
  options: BuildOptions = {},
) {
  const url = getCanonicalUrl(path, locale)
  const schemaType = options.schemaType ?? inferType(recurso.tipo)

  const photoUrls = (
    recurso.imagenes && recurso.imagenes.length > 0
      ? recurso.imagenes.map((i) => i.url)
      : recurso.fotoUrl
        ? [recurso.fotoUrl]
        : []
  ).filter(Boolean)

  const openingHours = (recurso.horariosSemana ?? [])
    .filter((h) => h.abierto && h.horaAbre && h.horaCierra)
    .map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: DAY_NAMES[h.diaSemana] ?? DAY_NAMES[0],
      opens: h.horaAbre,
      closes: h.horaCierra,
    }))

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    '@id': url + '#business',
    name: recurso.nombre,
    url,
    description: recurso.descripcion ?? undefined,
    image: photoUrls,
    telephone: recurso.telefono ?? undefined,
    email: recurso.email ?? undefined,
    sameAs: recurso.web ? [recurso.web] : undefined,
  }

  if (recurso.lat != null && recurso.lng != null) {
    jsonLd.geo = {
      '@type': 'GeoCoordinates',
      latitude: recurso.lat,
      longitude: recurso.lng,
    }
  }

  const addressLocality = recurso.pueblo?.nombre
  const addressRegion = recurso.pueblo?.comunidad ?? recurso.comunidad
  if (addressLocality || addressRegion) {
    jsonLd.address = {
      '@type': 'PostalAddress',
      addressCountry: 'ES',
      addressLocality,
      addressRegion,
    }
  }

  if (openingHours.length > 0) {
    jsonLd.openingHoursSpecification = openingHours
  }

  if (recurso.bookingUrl) {
    jsonLd.potentialAction = {
      '@type': schemaType === 'LodgingBusiness' || schemaType === 'Hotel' ? 'ReserveAction' : 'OrderAction',
      target: recurso.bookingUrl,
    }
  }

  if (recurso.ratingVerificado?.rating != null) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: recurso.ratingVerificado.rating,
      reviewCount: recurso.ratingVerificado.reviews ?? undefined,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return JSON.parse(JSON.stringify(jsonLd))
}
