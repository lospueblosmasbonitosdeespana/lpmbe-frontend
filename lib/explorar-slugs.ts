export type FilterType = 'tag' | 'servicio';
export type LocationType = 'region' | 'comunidad';

export interface FilterMapping {
  type: FilterType;
  key: string;
  label_es: string;
}

export interface LocationMapping {
  type: LocationType;
  key: string;
  label_es: string;
}

export const FILTER_SLUG_MAP: Record<string, FilterMapping> = {
  // ── 25 tags con colección activa aprobada ──
  'castillo': { type: 'tag', key: 'CASTILLO', label_es: 'Castillo' },
  'murallas': { type: 'tag', key: 'MURALLAS', label_es: 'Murallas' },
  'catedral': { type: 'tag', key: 'CATEDRAL', label_es: 'Catedral' },
  'monasterio': { type: 'tag', key: 'MONASTERIO', label_es: 'Monasterio' },
  'talla-religiosa': { type: 'tag', key: 'TALLA_RELIGIOSA', label_es: 'Talla religiosa' },
  'plaza-mayor': { type: 'tag', key: 'PLAZA_MAYOR_DESTACADA', label_es: 'Plaza mayor' },
  'puente-historico': { type: 'tag', key: 'PUENTE_HISTORICO', label_es: 'Puente histórico' },
  'plaza-de-toros': { type: 'tag', key: 'PLAZA_TOROS', label_es: 'Plaza de toros' },
  'cascada': { type: 'tag', key: 'CASCADA', label_es: 'Cascada' },
  'cueva-visitable': { type: 'tag', key: 'CUEVA_VISITABLE', label_es: 'Cueva visitable' },
  'mirador': { type: 'tag', key: 'MIRADOR_SINGULAR', label_es: 'Mirador singular' },
  'via-verde': { type: 'tag', key: 'VIA_VERDE', label_es: 'Vía verde' },
  'parque-natural': { type: 'tag', key: 'PARQUE_NATURAL', label_es: 'Parque natural' },
  'desfiladero': { type: 'tag', key: 'DESFILADERO', label_es: 'Desfiladero' },
  'pozas-naturales': { type: 'tag', key: 'POZAS', label_es: 'Pozas naturales' },
  'monumento-natural': { type: 'tag', key: 'MONUMENTO_NATURAL', label_es: 'Monumento natural' },
  'yacimiento-arqueologico': { type: 'tag', key: 'YACIMIENTO_ARQUEOLOGICO', label_es: 'Yacimiento arqueológico' },
  'pueblo-de-piedra': { type: 'tag', key: 'PUEBLO_PIEDRA', label_es: 'Pueblo de piedra' },
  'pueblo-blanco': { type: 'tag', key: 'PUEBLO_BLANCO', label_es: 'Pueblo blanco' },
  'starlight': { type: 'tag', key: 'STARLIGHT', label_es: 'Certificación Starlight' },
  'juderia': { type: 'tag', key: 'JUDERIA', label_es: 'Barrio judío' },
  'museo-singular': { type: 'tag', key: 'MUSEO_SINGULAR', label_es: 'Museo singular' },
  'bodega-subterranea': { type: 'tag', key: 'BODEGA_SUBTERRANEA', label_es: 'Bodega subterránea' },
  'fiesta-nacional': { type: 'tag', key: 'FIESTA_INTERES_NACIONAL', label_es: 'Fiesta de interés nacional' },
  'fiesta-regional': { type: 'tag', key: 'FIESTA_INTERES_REGIONAL', label_es: 'Fiesta de interés regional' },

  // ── 3 servicios con colección activa aprobada ──
  'cargador-electrico': { type: 'servicio', key: 'COCHE_ELECTRICO', label_es: 'Cargador eléctrico' },
  'cargador-ultra-rapido': { type: 'servicio', key: 'COCHE_ELECTRICO_ULTRA', label_es: 'Cargador ultra-rápido' },
  'area-de-caravanas': { type: 'servicio', key: 'CARAVANAS', label_es: 'Área de caravanas' },
};

export const LOCATION_SLUG_MAP: Record<string, LocationMapping> = {
  'norte': { type: 'region', key: 'norte', label_es: 'Norte de España' },
  'sur': { type: 'region', key: 'sur', label_es: 'Sur de España' },
  'este': { type: 'region', key: 'este', label_es: 'Este de España' },
  'centro': { type: 'region', key: 'centro', label_es: 'Centro de España' },

  'andalucia': { type: 'comunidad', key: 'Andalucía', label_es: 'Andalucía' },
  'aragon': { type: 'comunidad', key: 'Aragón', label_es: 'Aragón' },
  'asturias': { type: 'comunidad', key: 'Principado de Asturias', label_es: 'Asturias' },
  'baleares': { type: 'comunidad', key: 'Islas Baleares', label_es: 'Islas Baleares' },
  'canarias': { type: 'comunidad', key: 'Canarias', label_es: 'Canarias' },
  'cantabria': { type: 'comunidad', key: 'Cantabria', label_es: 'Cantabria' },
  'castilla-la-mancha': { type: 'comunidad', key: 'Castilla - La Mancha', label_es: 'Castilla-La Mancha' },
  'castilla-y-leon': { type: 'comunidad', key: 'Castilla y León', label_es: 'Castilla y León' },
  'cataluna': { type: 'comunidad', key: 'Cataluña', label_es: 'Cataluña' },
  'extremadura': { type: 'comunidad', key: 'Extremadura', label_es: 'Extremadura' },
  'galicia': { type: 'comunidad', key: 'Galicia', label_es: 'Galicia' },
  'la-rioja': { type: 'comunidad', key: 'La Rioja', label_es: 'La Rioja' },
  'madrid': { type: 'comunidad', key: 'Comunidad de Madrid', label_es: 'Madrid' },
  'navarra': { type: 'comunidad', key: 'Comunidad Foral de Navarra', label_es: 'Navarra' },
  'pais-vasco': { type: 'comunidad', key: 'País Vasco', label_es: 'País Vasco' },
  'valencia': { type: 'comunidad', key: 'Comunidad Valenciana', label_es: 'Comunidad Valenciana' },
};

export function parseExplorarSlug(segments: string[]): {
  filter: FilterMapping | null;
  location: LocationMapping | null;
} {
  if (segments.length === 0) return { filter: null, location: null };

  const first = segments[0];
  const filter = FILTER_SLUG_MAP[first] ?? null;

  let location: LocationMapping | null = null;
  if (segments.length >= 2) {
    location = LOCATION_SLUG_MAP[segments[1]] ?? null;
  }

  if (!filter && !location) {
    location = LOCATION_SLUG_MAP[first] ?? null;
  }

  return { filter, location };
}

export function filterToSlug(type: FilterType, key: string): string | null {
  for (const [slug, m] of Object.entries(FILTER_SLUG_MAP)) {
    if (m.type === type && m.key === key) return slug;
  }
  return null;
}

export function locationToSlug(type: LocationType, key: string): string | null {
  for (const [slug, m] of Object.entries(LOCATION_SLUG_MAP)) {
    if (m.type === type && m.key === key) return slug;
  }
  return null;
}

export function buildExplorarTitle(
  filter: FilterMapping | null,
  location: LocationMapping | null,
  total: number,
): string {
  const parts: string[] = [];
  if (filter) {
    parts.push(`Pueblos con ${filter.label_es.toLowerCase()}`);
  } else {
    parts.push('Explorar pueblos');
  }
  if (location) {
    parts.push(`en ${location.label_es}`);
  } else if (filter) {
    parts.push('en España');
  }
  return `${parts.join(' ')} — Los Pueblos Más Bonitos de España`;
}

export function buildExplorarDescription(
  filter: FilterMapping | null,
  location: LocationMapping | null,
  total: number,
): string {
  if (filter && location) {
    return `Descubre ${total} pueblo${total !== 1 ? 's' : ''} con ${filter.label_es.toLowerCase()} en ${location.label_es}. Datos de primera mano, fotos y servicios del visitante.`;
  }
  if (filter) {
    return `${total} pueblo${total !== 1 ? 's' : ''} con ${filter.label_es.toLowerCase()} en España. Explora patrimonio, naturaleza y servicios de cada municipio.`;
  }
  if (location) {
    return `Explora los pueblos más bonitos de España en ${location.label_es}. Filtra por patrimonio, naturaleza, servicios y más.`;
  }
  return 'Explora los 126 pueblos más bonitos de España. Filtra por patrimonio, naturaleza, servicios del visitante y ubicación.';
}
