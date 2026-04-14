import { getApiUrl } from '@/lib/api';

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

/**
 * Fetches the dynamic slug → filter mapping from active collections in the backend.
 * Cached with revalidate so it's not called on every single request.
 */
export async function fetchFilterSlugMap(): Promise<Record<string, FilterMapping>> {
  const API_BASE = getApiUrl();
  try {
    const res = await fetch(
      `${API_BASE}/public/explorar/counts?soloColecciones=true`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return {};
    const data = await res.json();
    const map: Record<string, FilterMapping> = {};
    for (const t of data.tags ?? []) {
      if (t.slug) {
        map[t.slug] = {
          type: 'tag',
          key: t.tag,
          label_es: t.nombre_i18n?.es ?? t.tag,
        };
      }
    }
    for (const s of data.servicios ?? []) {
      if (s.slug) {
        map[s.slug] = {
          type: 'servicio',
          key: s.tipo,
          label_es: s.label ?? s.tipo,
        };
      }
    }
    return map;
  } catch {
    return {};
  }
}

export async function parseExplorarSlug(segments: string[]): Promise<{
  filter: FilterMapping | null;
  location: LocationMapping | null;
}> {
  if (segments.length === 0) return { filter: null, location: null };

  const first = segments[0];

  const filterMap = await fetchFilterSlugMap();
  const filter = filterMap[first] ?? null;

  let location: LocationMapping | null = null;
  if (segments.length >= 2) {
    location = LOCATION_SLUG_MAP[segments[1]] ?? null;
  }

  if (!filter && !location) {
    location = LOCATION_SLUG_MAP[first] ?? null;
  }

  return { filter, location };
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
