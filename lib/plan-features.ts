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
  monthlySocialPostsIncluded: number;
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
    monthlySocialPostsIncluded: 0,
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
    monthlySocialPostsIncluded: 0,
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
    monthlySocialPostsIncluded: 1,
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
    monthlySocialPostsIncluded: 4,
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

/** Precios mensuales en euros — null = por determinar */
export const PLAN_PRICES: Record<PlanNegocio, number | null> = {
  FREE: 0,
  RECOMENDADO: null,
  PREMIUM: null,
  SELECTION: null,
};
