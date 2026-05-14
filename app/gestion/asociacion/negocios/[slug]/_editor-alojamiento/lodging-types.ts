// ─────────────────────────────────────────────────────────────────────────────
// LodgingLandingConfig — canonical type used by both the public page
// components and the admin editor.
// ─────────────────────────────────────────────────────────────────────────────

export type StatIcon =
  | 'clock'
  | 'bed'
  | 'banknote'
  | 'star'
  | 'calendar'
  | 'mountain'
  | 'users'

export type BreakfastIcon = 'leaf' | 'coffee' | 'wheat' | 'egg' | 'cheese'

export type PracticalIcon =
  | 'clock'
  | 'x-circle'
  | 'credit-card'
  | 'globe'
  | 'baby'
  | 'paw-print'
  | 'shield'
  | 'accessibility'

export type DirectionIcon = 'car' | 'bus' | 'plane'

export type OfferIcon =
  | 'gift'
  | 'percent'
  | 'sparkles'
  | 'crown'
  | 'wine'
  | 'star'

export interface LodgingLandingConfig {
  hero: {
    tagline: string
    locationText: string
    propertyType: string
    badges: { id: string; text: string }[]
  }
  quickStats: {
    items: {
      id: string
      icon: StatIcon
      label: string
      value: string
    }[]
  }
  story: {
    eyebrow: string
    title: string
    paragraphs: string[]
    pullQuote: string
  }
  rooms: {
    eyebrow: string
    title: string
    items: {
      id: string
      name: string
      description: string
      guests: number
      beds: string
      price: string
      imageUrl: string
    }[]
  }
  experiences: {
    eyebrow: string
    title: string
    items: {
      id: string
      title: string
      description: string
      duration: string
      badge: string
      imageUrl: string
    }[]
  }
  breakfast: {
    eyebrow: string
    title: string
    description: string
    schedule: string
    included: boolean
    highlights: { id: string; icon: BreakfastIcon; text: string }[]
    note: string
  }
  amenities: {
    categories: {
      id: string
      title: string
      items: { id: string; icon: string; label: string }[]
    }[]
  }
  reviews: {
    overallRating: string
    totalReviews: string
    items: {
      id: string
      quote: string
      author: string
      origin: string
      stars: number
      date: string
    }[]
  }
  practicalInfo: {
    items: {
      id: string
      icon: PracticalIcon
      label: string
      detail: string
    }[]
  }
  location: {
    address: string
    directions: {
      id: string
      icon: DirectionIcon
      title: string
      content: string
    }[]
    nearbyPoi: { id: string; name: string; distance: string }[]
  }
  booking: {
    eyebrow: string
    title: string
    subtitle: string
    cancelNote: string
  }
  memberOffers: {
    eyebrow: string
    title: string
    offers: {
      id: string
      icon: OfferIcon
      badge: string
      title: string
      description: string
      conditions: string
      isFeatured: boolean
    }[]
  }
}
