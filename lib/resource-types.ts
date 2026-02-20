export const RESOURCE_TYPES = [
  'CASTILLO',
  'MONASTERIO',
  'IGLESIA',
  'MUSEO',
  'BODEGA',
  'PARQUE_NATURAL',
  'PUENTE',
  'PALACIO',
  'TORRE',
  'CUEVA',
  'MIRADOR',
  'TERMAS',
  'ERMITA',
  'YACIMIENTO',
  'OTRO',
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  CASTILLO: 'Castillo',
  MONASTERIO: 'Monasterio',
  IGLESIA: 'Iglesia / Catedral',
  MUSEO: 'Museo',
  BODEGA: 'Bodega',
  PARQUE_NATURAL: 'Parque natural',
  PUENTE: 'Puente histórico',
  PALACIO: 'Palacio',
  TORRE: 'Torre / Atalaya',
  CUEVA: 'Cueva',
  MIRADOR: 'Mirador',
  TERMAS: 'Termas / Balneario',
  ERMITA: 'Ermita',
  YACIMIENTO: 'Yacimiento arqueológico',
  OTRO: 'Otro',
};

export const RESOURCE_TYPE_COLORS: Record<string, string> = {
  CASTILLO: '#7c3aed',
  MONASTERIO: '#9f1239',
  IGLESIA: '#b45309',
  MUSEO: '#78716c',
  BODEGA: '#7f1d1d',
  PARQUE_NATURAL: '#15803d',
  PUENTE: '#64748b',
  PALACIO: '#a16207',
  TORRE: '#6d28d9',
  CUEVA: '#57534e',
  MIRADOR: '#0d9488',
  TERMAS: '#0f766e',
  ERMITA: '#be185d',
  YACIMIENTO: '#92400e',
  OTRO: '#854d0e',
};

/**
 * SVG path strings (viewBox 0 0 24 24, stroke-based) for each resource type.
 * Designed to work at 14-18px inside small circular markers.
 */
export const RESOURCE_TYPE_SVG: Record<string, string> = {
  CASTILLO:
    '<path d="M3 21h18"/><path d="M4 21V11l2-2V5h2v2l4-4 4 4v2h2v4l2 2v10"/><path d="M10 21v-4h4v4"/>',
  MONASTERIO:
    '<path d="M12 2L2 7h20L12 2z"/><path d="M2 7v14h20V7"/><path d="M10 21v-6h4v6"/><path d="M6 11v4"/><path d="M18 11v4"/>',
  IGLESIA:
    '<path d="M12 2v4"/><path d="M10 4h4"/><path d="M8 6l4-2 4 2v3H8V6z"/><path d="M6 9l6-1 6 1v12H6V9z"/><path d="M10 21v-4h4v4"/>',
  MUSEO:
    '<path d="M3 21h18"/><path d="M5 21V9l7-5 7 5v12"/><path d="M9 21v-6h6v6"/>',
  BODEGA:
    '<ellipse cx="12" cy="14" rx="7" ry="5"/><path d="M5 14V8a7 5 0 0 1 14 0v6"/><line x1="12" y1="9" x2="12" y2="14"/>',
  PARQUE_NATURAL:
    '<path d="M12 3l4 8H8l4-8z"/><path d="M9 11l-3 6h12l-3-6"/><path d="M11 17v4"/><path d="M13 17v4"/><path d="M8 21h8"/>',
  PUENTE:
    '<path d="M2 18h20"/><path d="M4 18c0-4 3.5-8 8-8s8 4 8 8"/><path d="M4 14v4"/><path d="M20 14v4"/><path d="M12 10v8"/>',
  PALACIO:
    '<path d="M2 20h20"/><path d="M4 20V8h16v12"/><path d="M4 8l8-5 8 5"/><path d="M10 20v-5h4v5"/><path d="M8 12h2"/><path d="M14 12h2"/>',
  TORRE:
    '<path d="M10 21V3h4v18"/><path d="M8 21h8"/><path d="M10 8h4"/><path d="M10 13h4"/><path d="M11 3h2v2h-2z"/>',
  CUEVA:
    '<path d="M2 20c2-4 4-10 10-14 4 2 7 5 10 14"/><path d="M9 20c0-3 1.5-5 3-5s3 2 3 5"/>',
  MIRADOR:
    '<circle cx="12" cy="5" r="3"/><path d="M12 8v5"/><path d="M8 13h8"/><path d="M6 21l6-8 6 8"/>',
  TERMAS:
    '<path d="M8 18c0-3 1.8-5 4-5s4 2 4 5"/><path d="M4 18h16v2H4z"/><path d="M8 8c0-1 .5-2 1.5-2S11 7 11 8"/><path d="M11 8c0-1 .5-2 1.5-2S14 7 14 8"/><path d="M14 8c0-1 .5-2 1.5-2S17 7 17 8"/>',
  ERMITA:
    '<path d="M12 2l6 5v14H6V7l6-5z"/><circle cx="12" cy="10" r="2"/><path d="M10 21v-4h4v4"/>',
  YACIMIENTO:
    '<path d="M2 20h20"/><path d="M6 20v-4l3-2 3 2 3-2 3 2v4"/><path d="M9 10l3-4 3 4"/><circle cx="12" cy="4" r="1"/>',
  OTRO:
    '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/>',
};

export function getResourceColor(tipo: string): string {
  return RESOURCE_TYPE_COLORS[tipo] ?? RESOURCE_TYPE_COLORS.OTRO;
}

export function getResourceSvg(tipo: string): string {
  return RESOURCE_TYPE_SVG[tipo] ?? RESOURCE_TYPE_SVG.OTRO;
}

export function getResourceLabel(tipo: string): string {
  return RESOURCE_TYPE_LABELS[tipo] ?? tipo;
}
