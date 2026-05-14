export const RESTAURANTE_TRANSLATION_KEYS = [
  'noPhotos', 'prevImage', 'nextImage', 'goToSlide', 'imprescindible', 'cerradoTemporal', 'reviews',
  'chefEyebrow',
  'philosophyEyebrow', 'philosophyTitle',
  'menusEyebrow', 'menusTitle',
  'platosEyebrow', 'platosTitle',
  'infoEyebrow', 'infoTitle', 'hoursLabel', 'closed', 'dietasLabel', 'noteLabel',
  'reservaEyebrow', 'reservaTitle', 'reservarOnline', 'llamar', 'reservar', 'cancelacionTexto',
  'encuentranos', 'contactoUbicacionTitle', 'getDirections', 'parking', 'publicTransport', 'accessibility',
  'ofertasEyebrow', 'ofertasTitle', 'featured', 'nuevaLabel', 'forMembers',
  'siguenosEyebrow',
  'clubEyebrow', 'becomeMemberTitle', 'becomeMemberDescription', 'joinNow', 'learnMore',
] as const;

/**
 * Tipos de recurso que activan la plantilla premium específica de restaurante
 * (con menús, platos signature, sumiller, etc.) cuando además el plan es PREMIUM/SELECTION.
 */
export const TIPOS_RESTAURANTE_PREMIUM = ['RESTAURANTE', 'BAR', 'BODEGA'] as const;

export function esRestaurantePremium(tipo: string | undefined, plan: string | undefined): boolean {
  if (!tipo || !plan) return false;
  if (plan !== 'PREMIUM' && plan !== 'SELECTION') return false;
  return (TIPOS_RESTAURANTE_PREMIUM as readonly string[]).includes(tipo);
}

export const TIPOS_ALOJAMIENTO_PREMIUM = ['HOTEL', 'CASA_RURAL'] as const;

export function esAlojamientoPremium(tipo: string | undefined, plan: string | undefined): boolean {
  if (!tipo || !plan) return false;
  if (plan !== 'PREMIUM' && plan !== 'SELECTION') return false;
  return (TIPOS_ALOJAMIENTO_PREMIUM as readonly string[]).includes(tipo);
}

export const TIPOS_COMERCIO_PREMIUM = ['COMERCIO', 'TIENDA_ARTESANIA'] as const;

export function esComercioPremium(tipo: string | undefined, plan: string | undefined): boolean {
  if (!tipo || !plan) return false;
  if (plan !== 'PREMIUM' && plan !== 'SELECTION') return false;
  return (TIPOS_COMERCIO_PREMIUM as readonly string[]).includes(tipo);
}

export const TIPOS_ACTIVIDAD_PREMIUM = ['EXPERIENCIA'] as const;

export function esActividadPremium(tipo: string | undefined, plan: string | undefined): boolean {
  if (!tipo || !plan) return false;
  if (plan !== 'PREMIUM' && plan !== 'SELECTION') return false;
  return (TIPOS_ACTIVIDAD_PREMIUM as readonly string[]).includes(tipo);
}
