/**
 * Config centralizada de features por plan de negocio.
 * Espejo del backend (backend/src/common/constants.ts).
 * El backend ya filtra campos según plan, pero el frontend
 * usa esta config para decidir qué UI mostrar (badges, CTAs, etc.).
 */

export type PlanNegocio = 'FREE' | 'RECOMENDADO' | 'PREMIUM';

export type StatsLevel = 'NONE' | 'BASIC' | 'ADVANCED';
export type ListingPriority = 'LOW' | 'MEDIUM' | 'HIGH';

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
    translationEnabled: false,
    statsLevel: 'NONE',
    listingPriority: 'LOW',
    listingSortWeight: 2,
    serviceHighlightsEnabled: false,
    bookingLinkEnabled: false,
    socialLinksEnabled: false,
    customLandingEnabled: false,
    featuredOffersEnabled: false,
    monthlySocialPostsIncluded: 0,
    physicalPlaqueIncluded: false,
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
    translationEnabled: true,
    statsLevel: 'BASIC',
    listingPriority: 'MEDIUM',
    listingSortWeight: 1,
    serviceHighlightsEnabled: true,
    bookingLinkEnabled: false,
    socialLinksEnabled: false,
    customLandingEnabled: false,
    featuredOffersEnabled: false,
    monthlySocialPostsIncluded: 0,
    physicalPlaqueIncluded: false,
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
    translationEnabled: true,
    statsLevel: 'ADVANCED',
    listingPriority: 'HIGH',
    listingSortWeight: 0,
    serviceHighlightsEnabled: true,
    bookingLinkEnabled: true,
    socialLinksEnabled: true,
    customLandingEnabled: true,
    featuredOffersEnabled: true,
    monthlySocialPostsIncluded: 1,
    physicalPlaqueIncluded: true,
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
};

export const PLAN_ORDER: PlanNegocio[] = ['FREE', 'RECOMENDADO', 'PREMIUM'];
