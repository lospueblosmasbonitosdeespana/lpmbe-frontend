export interface HeroBadge {
  text: string
  icon?: string
}

export interface HeroSlide {
  image: string
  alt: string
}

export interface HeroConfig {
  eyebrow: string
  title: string
  tagline: string
  badges: HeroBadge[]
  slides: HeroSlide[]
  ctaPrimary: {
    text: string
    href: string
  }
  ctaSecondary: {
    text: string
    href: string
  }
}

export interface StatItem {
  value: string
  label: string
}

export interface HistoryPhoto {
  image: string
  year: string
  alt: string
}

export interface HistoryConfig {
  eyebrow: string
  title: string
  paragraphs: string[]
  pullQuote: string
  mainImage: string
  photos: HistoryPhoto[]
}

export interface ProductBadge {
  text: string
  variant?: 'default' | 'highlight' | 'new'
}

export interface Product {
  id: string
  name: string
  description: string
  format: string
  price: number
  image: string
  badges: ProductBadge[]
  featured?: boolean
  availableOnline: boolean
}

export interface ProcessStep {
  number: number
  title: string
  description: string
  image: string
}

export interface ObradorConfig {
  image: string
  title: string
  description: string
  ctaText: string
  ctaHref: string
}

export interface Experience {
  id: string
  title: string
  image: string
  duration: string
  maxPeople: number
  priceFrom: number
  clubDiscount?: string
  available: boolean
}

export interface Award {
  logo: string
  name: string
}

export interface PressQuote {
  quote: string
  source: string
  year: string
}

export interface AwardsConfig {
  awards: Award[]
  pressQuotes: PressQuote[]
}

export interface Testimonial {
  id: string
  quote: string
  name: string
  city: string
  avatar?: string
  rating: number
}

export interface Schedule {
  days: string
  hours: string
}

export interface PracticalInfo {
  schedule: Schedule[]
  paymentMethods: string[]
  shipping: {
    peninsula: string
    islands: string
  }
  returns: string
  languages: string[]
}

export interface LocationConfig {
  coordinates: {
    lat: number
    lng: number
  }
  address: string
  comarca: string
  provincia: string
  directions: {
    car: string
    publicTransport: string
    parking: string
  }
  googleMapsUrl: string
}

export interface CTAReservaConfig {
  title: string
  subtitle: string
  buttons: {
    reserva: { text: string; href: string }
    llamar: { text: string; href: string }
    whatsapp: { text: string; href: string }
  }
}

export interface ClubOffer {
  id: string
  icon: string
  title: string
  highlight: string
  badge?: 'destacada' | 'nueva'
}

export interface ClubOffersConfig {
  eyebrow: string
  title: string
  offers: ClubOffer[]
}

export interface SocialLink {
  platform: 'instagram' | 'facebook' | 'youtube' | 'tiktok' | 'web' | 'tripadvisor'
  url: string
}

export interface ClubCTAConfig {
  title: string
  description: string
  ctaText: string
  ctaHref: string
}

export interface LandingConfig {
  hero: HeroConfig
  stats: StatItem[]
  history: HistoryConfig
  products: Product[]
  process: ProcessStep[]
  obrador: ObradorConfig
  experiences: Experience[]
  awards: AwardsConfig
  testimonials: Testimonial[]
  practicalInfo: PracticalInfo
  location: LocationConfig
  ctaReserva: CTAReservaConfig
  clubOffers: ClubOffersConfig
  socialLinks: SocialLink[]
  clubCTA: ClubCTAConfig
}
