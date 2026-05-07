/**
 * Config centralizada de features por plan de negocio.
 * Espejo del backend (backend/src/common/constants.ts).
 * El backend ya filtra campos según plan, pero el frontend
 * usa esta config para decidir qué UI mostrar (badges, CTAs, etc.).
 */

export type PlanNegocio = 'FREE' | 'RECOMENDADO' | 'PREMIUM' | 'SELECTION';

export type StatsLevel = 'NONE' | 'BASIC' | 'ADVANCED';
export type ListingPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'FEATURED';

export interface PlanFeatures {
  maxPhotos: number;
  publicPhoneVisible: boolean;
  publicEmailVisible: boolean;
  publicWebVisible: boolean;
  publicWhatsappVisible: boolean;
  publicScheduleVisible: boolean;
  publicMapVisible: boolean;
  qrValidationEnabled: boolean;
  clubOfferEnabled: boolean;
  recommendedBadgeEnabled: boolean;
  premiumBadgeEnabled: boolean;
  selectionBadgeEnabled: boolean;
  translationEnabled: boolean;
  statsLevel: StatsLevel;
  listingPriority: ListingPriority;
  listingSortWeight: number;
  serviceHighlightsEnabled: boolean;
  bookingLinkEnabled: boolean;
  socialLinksEnabled: boolean;
  customLandingEnabled: boolean;
  featuredOffersEnabled: boolean;
  /**
   * RRSS LPMBE incluidas / mes:
   * - monthlyEditorialMention: el negocio aparece dentro de un post editorial
   *   del pueblo (protagonista: el pueblo, no el negocio).
   * - monthlyStoryIncluded: el negocio sale en stories agrupadas en el
   *   highlight permanente "Ventajas Club".
   */
  monthlyEditorialMention: number;
  monthlyStoryIncluded: number;
  /** La IA del Club recomienda activamente este plan a los socios. */
  iaRecommendationBoost: boolean;
  physicalPlaqueIncluded: boolean;
  selectionPageEnabled: boolean;
  guideIncluded: boolean;
  cobranding: boolean;
}

export const PLAN_FEATURES: Record<PlanNegocio, PlanFeatures> = {
  FREE: {
    maxPhotos: 1,
    publicPhoneVisible: true,
    publicEmailVisible: true,
    publicWebVisible: true,
    publicWhatsappVisible: false,
    publicScheduleVisible: false,
    publicMapVisible: true,
    qrValidationEnabled: true,
    clubOfferEnabled: true,
    recommendedBadgeEnabled: false,
    premiumBadgeEnabled: false,
    selectionBadgeEnabled: false,
    translationEnabled: false,
    statsLevel: 'NONE',
    listingPriority: 'LOW',
    listingSortWeight: 3,
    serviceHighlightsEnabled: false,
    bookingLinkEnabled: false,
    socialLinksEnabled: false,
    customLandingEnabled: false,
    featuredOffersEnabled: false,
    monthlyEditorialMention: 0,
    monthlyStoryIncluded: 0,
    iaRecommendationBoost: false,
    physicalPlaqueIncluded: false,
    selectionPageEnabled: false,
    guideIncluded: false,
    cobranding: false,
  },
  RECOMENDADO: {
    maxPhotos: 15,
    publicPhoneVisible: true,
    publicEmailVisible: true,
    publicWebVisible: true,
    publicWhatsappVisible: true,
    publicScheduleVisible: true,
    publicMapVisible: true,
    qrValidationEnabled: true,
    clubOfferEnabled: true,
    recommendedBadgeEnabled: true,
    premiumBadgeEnabled: false,
    selectionBadgeEnabled: false,
    translationEnabled: true,
    statsLevel: 'BASIC',
    listingPriority: 'MEDIUM',
    listingSortWeight: 2,
    serviceHighlightsEnabled: true,
    bookingLinkEnabled: false,
    socialLinksEnabled: false,
    customLandingEnabled: false,
    featuredOffersEnabled: false,
    monthlyEditorialMention: 0,
    monthlyStoryIncluded: 1,
    iaRecommendationBoost: false,
    physicalPlaqueIncluded: false,
    selectionPageEnabled: false,
    guideIncluded: false,
    cobranding: false,
  },
  PREMIUM: {
    maxPhotos: 30,
    publicPhoneVisible: true,
    publicEmailVisible: true,
    publicWebVisible: true,
    publicWhatsappVisible: true,
    publicScheduleVisible: true,
    publicMapVisible: true,
    qrValidationEnabled: true,
    clubOfferEnabled: true,
    recommendedBadgeEnabled: false,
    premiumBadgeEnabled: true,
    selectionBadgeEnabled: false,
    translationEnabled: true,
    statsLevel: 'ADVANCED',
    listingPriority: 'HIGH',
    listingSortWeight: 1,
    serviceHighlightsEnabled: true,
    bookingLinkEnabled: true,
    socialLinksEnabled: true,
    customLandingEnabled: true,
    featuredOffersEnabled: true,
    monthlyEditorialMention: 1,
    monthlyStoryIncluded: 1,
    iaRecommendationBoost: true,
    physicalPlaqueIncluded: true,
    selectionPageEnabled: false,
    guideIncluded: false,
    cobranding: false,
  },
  SELECTION: {
    maxPhotos: 50,
    publicPhoneVisible: true,
    publicEmailVisible: true,
    publicWebVisible: true,
    publicWhatsappVisible: true,
    publicScheduleVisible: true,
    publicMapVisible: true,
    qrValidationEnabled: true,
    clubOfferEnabled: true,
    recommendedBadgeEnabled: false,
    premiumBadgeEnabled: false,
    selectionBadgeEnabled: true,
    translationEnabled: true,
    statsLevel: 'ADVANCED',
    listingPriority: 'FEATURED',
    listingSortWeight: 0,
    serviceHighlightsEnabled: true,
    bookingLinkEnabled: true,
    socialLinksEnabled: true,
    customLandingEnabled: true,
    featuredOffersEnabled: true,
    monthlyEditorialMention: 2,
    monthlyStoryIncluded: 2,
    iaRecommendationBoost: true,
    physicalPlaqueIncluded: true,
    selectionPageEnabled: true,
    guideIncluded: true,
    cobranding: true,
  },
};

export function getPlanFeatures(plan?: string | null): PlanFeatures {
  const key = (plan ?? 'FREE') as PlanNegocio;
  return PLAN_FEATURES[key] ?? PLAN_FEATURES.FREE;
}

export const PLAN_LABELS: Record<PlanNegocio, string> = {
  FREE: 'Gratuito',
  RECOMENDADO: 'Recomendado',
  PREMIUM: 'Premium',
  SELECTION: 'Selection',
};

/** Planes para negocios dentro de pueblos de la red */
export const PLAN_ORDER: PlanNegocio[] = ['FREE', 'RECOMENDADO', 'PREMIUM'];

/** Todos los planes incluyendo Selection (fuera de la red) */
export const ALL_PLANS: PlanNegocio[] = ['FREE', 'RECOMENDADO', 'PREMIUM', 'SELECTION'];

/** Precios mensuales en euros (null = consultar / por contacto). */
export const PLAN_PRICES_MONTHLY: Record<PlanNegocio, number | null> = {
  FREE: 0,
  RECOMENDADO: 19,
  PREMIUM: 49,
  SELECTION: null,
};

/** Precios anuales con descuento (≈ 2 meses gratis). */
export const PLAN_PRICES_YEARLY: Record<PlanNegocio, number | null> = {
  FREE: 0,
  RECOMENDADO: 199,
  PREMIUM: 499,
  SELECTION: 1500,
};

/** Compatibilidad: alias del precio mensual. */
export const PLAN_PRICES = PLAN_PRICES_MONTHLY;

// ─────────────────────────────────────────────────────────
// Productos sueltos de RRSS LPMBE
// ─────────────────────────────────────────────────────────

export type TipoPublicacionRRSS =
  | 'STORY_INCLUIDA'
  | 'MENCION_EDITORIAL'
  | 'INSTAGRAM_STORY'
  | 'INSTAGRAM_POST'
  | 'INSTAGRAM_REEL'
  | 'FACEBOOK_POST';

export interface ProductoRRSS {
  tipo: TipoPublicacionRRSS;
  label: string;
  descripcion: string;
  /** Precio mínimo en euros */
  precio: number;
  /** Precio máximo en euros si hay rango (Story con/sin link) */
  precioMax?: number;
  /** Si añadir link/CTA sube el precio */
  conLinkExtra?: boolean;
  /** Requiere aprobación editorial previa antes de cobrar */
  requiereAprobacion?: boolean;
}

export const PRODUCTOS_RRSS_SUELTOS: ProductoRRSS[] = [
  {
    tipo: 'INSTAGRAM_STORY',
    label: 'Story de Instagram',
    descripcion:
      'Una lámina en Stories de @lospueblosmasbonitosdeespana. Si incluye link directo (a tu reserva, web o promo) el precio sube hasta 350€.',
    precio: 150,
    precioMax: 350,
    conLinkExtra: true,
  },
  {
    tipo: 'INSTAGRAM_POST',
    label: 'Post de Instagram (imagen o carrusel)',
    descripcion:
      'Publicación en feed con imagen o carrusel. Mejor rendimiento orgánico y vida útil larga.',
    precio: 695,
    requiereAprobacion: true,
  },
  {
    tipo: 'INSTAGRAM_REEL',
    label: 'Reel de Instagram',
    descripcion:
      'Vídeo corto en Reels. El formato con más alcance orgánico actualmente. Requiere material de vídeo de calidad.',
    precio: 895,
    requiereAprobacion: true,
  },
  {
    tipo: 'FACEBOOK_POST',
    label: 'Post en Facebook',
    descripcion:
      'Publicación en la página de Facebook de LPMBE. Útil para llegar a un público de mayor edad o más local.',
    precio: 195,
  },
];

export const SERVICIOS_DISPONIBLES: { key: string; label: string; icon: string }[] = [
  { key: 'WIFI', label: 'WiFi', icon: 'wifi' },
  { key: 'PARKING', label: 'Parking', icon: 'parking' },
  { key: 'PISCINA', label: 'Piscina', icon: 'pool' },
  { key: 'AC', label: 'Aire acondicionado', icon: 'ac' },
  { key: 'TERRAZA', label: 'Terraza', icon: 'terraza' },
  { key: 'JARDIN', label: 'Jardín', icon: 'jardin' },
  { key: 'MASCOTAS', label: 'Admite mascotas', icon: 'mascotas' },
  { key: 'ACCESIBLE', label: 'Accesible', icon: 'accesible' },
  { key: 'DESAYUNO', label: 'Desayuno incluido', icon: 'desayuno' },
  { key: 'MEDIA_PENSION', label: 'Media pensión', icon: 'media_pension' },
  { key: 'SPA', label: 'Spa / Wellness', icon: 'spa' },
  { key: 'CHIMENEA', label: 'Chimenea', icon: 'chimenea' },
  { key: 'COCINA', label: 'Cocina disponible', icon: 'cocina' },
  { key: 'LAVADORA', label: 'Lavadora', icon: 'lavadora' },
  { key: 'TV', label: 'Televisión', icon: 'tv' },
  { key: 'CALEFACCION', label: 'Calefacción', icon: 'calefaccion' },
];

export const SOCIAL_NETWORKS: { key: string; label: string }[] = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'twitter', label: 'X (Twitter)' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'tripadvisor', label: 'TripAdvisor' },
  { key: 'google', label: 'Google Maps / Business' },
];
