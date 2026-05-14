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
