// Commerce Landing Page Configuration Types

export interface HeroImage {
  id: string
  url: string
  alt: string
  order: number
}

export interface Badge {
  id: string
  text: string
}

export interface CTA {
  text: string
  url: string
}

export interface Stat {
  id: string
  number: string
  label: string
}

export interface StoryPhoto {
  id: string
  url: string
  year: string
  alt: string
}

export interface ProductBadge {
  id: string
  text: string
}

export interface Product {
  id: string
  imageUrl: string
  name: string
  description: string
  format: string
  price: string
  badges: ProductBadge[]
  purchaseUrl: string
  featured: boolean
}

export interface ProcessStep {
  id: string
  number: number
  title: string
  description: string
  photoUrl: string
}

export interface Experience {
  id: string
  imageUrl: string
  title: string
  duration: string
  groupSize: string
  price: string
  lpmbeDiscount: boolean
  discountPercent: number
  reservationUrl: string
}

export interface AwardLogo {
  id: string
  url: string
  alt: string
  year?: string
}

export interface PressQuote {
  id: string
  text: string
  medium: string
  year: string
}

export interface Testimonial {
  id: string
  photoUrl?: string
  name: string
  origin: string
  stars: number
  text: string
  date: string
  featured: boolean
}

export interface ScheduleDay {
  day: number // 0=Lun, 6=Dom
  dayName: string
  open: boolean
  openTime1: string
  closeTime1: string
  openTime2?: string
  closeTime2?: string
}

export interface HowToGet {
  id: string
  icon: 'Car' | 'Bus' | 'MapPin'
  title: string
  description: string
}

export interface MemberOffer {
  id: string
  icon: 'Gift' | 'Percent' | 'Sparkles' | 'Crown' | 'Star' | 'ShoppingBag' | 'Truck'
  title: string
  highlight: string
  description: string
  conditions: string
  featured: boolean
  badge: 'Destacada' | 'Nueva' | 'Solo socios' | ''
}

// Main Config Sections
export interface IdentitySection {
  businessName: string
  tagline: string
  businessType: string
  foundedYear: number
  region: string
  languages: string[]
}

export interface HeroSection {
  images: HeroImage[]
  h1: string
  taglineItalic: string
  badges: Badge[]
  primaryCta: CTA
  secondaryCta: CTA
}

export interface StatsSection {
  stats: Stat[]
}

export interface StorySection {
  eyebrow: string
  title: string
  paragraphs: string[]
  pullQuote: string
  photos: StoryPhoto[]
}

export interface ProductsSection {
  eyebrow: string
  title: string
  products: Product[]
}

export interface ProcessSection {
  eyebrow: string
  title: string
  steps: ProcessStep[]
}

export interface PlaceSection {
  imageUrl: string
  title: string
  description: string
  cta: CTA
  showSection: boolean
}

export interface ExperiencesSection {
  eyebrow: string
  title: string
  experiences: Experience[]
}

export interface AwardsSection {
  logos: AwardLogo[]
  pressQuotes: PressQuote[]
}

export interface TestimonialsSection {
  testimonials: Testimonial[]
}

export interface PracticalInfoSection {
  schedule: ScheduleDay[]
  paymentMethods: string[]
  shippingPolicy: string
  shippingOption: 'peninsula24h' | 'peninsulaBaleares' | 'soloObrador'
  returnPolicy: string
  languagesServed: string[]
  additionalNotes: string
}

export interface LocationSection {
  address: string
  locality: string
  province: string
  community: string
  lat: number
  lng: number
  howToGet: HowToGet[]
  googleMapsUrl: string
}

export interface VisitCtaSection {
  title: string
  subtitle: string
  primaryCta: CTA
  phone: string
  whatsapp: string
}

export interface MemberOffersSection {
  eyebrow: string
  title: string
  offers: MemberOffer[]
}

export interface SocialSection {
  instagram: string
  facebook: string
  youtube: string
  tiktok: string
  x: string
  tripadvisor: string
  web: string
}

export interface ContactSection {
  phone: string
  email: string
  whatsapp: string
  contactPerson: string
  contactFormUrl: string
}

// Full Config
export interface CommerceLandingConfig {
  identity: IdentitySection
  hero: HeroSection
  stats: StatsSection
  story: StorySection
  products: ProductsSection
  process: ProcessSection
  place: PlaceSection
  experiences: ExperiencesSection
  awards: AwardsSection
  testimonials: TestimonialsSection
  practicalInfo: PracticalInfoSection
  location: LocationSection
  visitCta: VisitCtaSection
  memberOffers: MemberOffersSection
  social: SocialSection
  contact: ContactSection
}

// Business types enum
export const BUSINESS_TYPES = [
  'Quesería',
  'Bodega',
  'Panadería',
  'Pastelería',
  'Conservas',
  'Cosmética natural',
  'Cerámica',
  'Tejidos',
  'Carpintería',
  'Joyería',
  'Otro artesano',
  'Tienda de productos locales',
  'Otro'
] as const

export const LANGUAGES = ['ES', 'CA', 'EN', 'FR', 'DE', 'IT', 'PT', 'EU'] as const

export const PAYMENT_METHODS = [
  'Efectivo',
  'Tarjeta',
  'Bizum',
  'Transferencia',
  'Cheque regalo'
] as const

export const PRODUCT_BADGES = [
  'Madurado 90 días',
  'Best-seller',
  'Edición limitada',
  'Nuevo',
  'Solo obrador'
] as const

export const HERO_BADGES = [
  'Producto km0',
  'Hecho a mano',
  'Tradición familiar',
  'Premio ...'
] as const

export const OFFER_ICONS = [
  'Gift',
  'Percent',
  'Sparkles',
  'Crown',
  'Star',
  'ShoppingBag',
  'Truck'
] as const

export const OFFER_BADGE_OPTIONS = ['Destacada', 'Nueva', 'Solo socios', ''] as const

export const HOW_TO_GET_ICONS = ['Car', 'Bus', 'MapPin'] as const
