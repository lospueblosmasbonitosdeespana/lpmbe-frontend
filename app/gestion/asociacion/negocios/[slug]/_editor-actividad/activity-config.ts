export type StatIcon =
  | 'mountain' | 'clock' | 'users' | 'award' | 'map-pin' | 'calendar'

export type ActivityCategory =
  | 'senderismo' | 'agua' | 'nieve' | 'cultura' | 'btt' | 'aire' | 'otro'

export type Difficulty = 'facil' | 'moderada' | 'exigente'

export type SeasonKey = 'primavera' | 'verano' | 'otono' | 'invierno'

export type SafetyIcon =
  | 'shield' | 'phone' | 'first-aid' | 'helmet' | 'license' | 'check'

export type EquipmentIcon =
  | 'backpack' | 'helmet' | 'rope' | 'paddle' | 'bike' | 'snowshoe' | 'binoculars'

export type PracticalIcon =
  | 'map-pin' | 'clock' | 'gauge' | 'users' | 'baby' | 'globe' | 'x-circle' | 'shopping-bag'

export type DirectionIcon = 'car' | 'bus' | 'plane'

export type OfferIcon = 'gift' | 'percent' | 'sparkles' | 'crown' | 'star'

export interface ActivityLandingConfig {
  hero: {
    tagline: string
    locationText: string
    categoryLabel: string
    badges: { id: string; text: string }[]
    videoUrl?: string
    posterImageUrl: string
  }
  highlights: {
    items: {
      id: string
      icon: StatIcon
      label: string
      detail: string
    }[]
  }
  story: {
    eyebrow: string
    title: string
    paragraphs: string[]
    pullQuote: string
    images: { id: string; url: string; alt: string }[]
  }
  activities: {
    eyebrow: string
    title: string
    items: {
      id: string
      title: string
      description: string
      category: ActivityCategory
      difficulty: Difficulty
      durationLabel: string
      groupSizeLabel: string
      priceLabel: string
      imageUrl: string
    }[]
  }
  featured: {
    enabled: boolean
    eyebrow: string
    title: string
    description: string
    durationLabel: string
    difficulty: Difficulty
    groupSizeLabel: string
    seasonLabel: string
    priceLabel: string
    imageUrl: string
  }
  guides: {
    eyebrow: string
    title: string
    members: {
      id: string
      name: string
      role: string
      bio: string
      photoUrl: string
      certifications: { id: string; text: string }[]
    }[]
  }
  seasons: {
    eyebrow: string
    title: string
    items: {
      id: string
      season: SeasonKey
      title: string
      description: string
      featuredActivities: { id: string; text: string }[]
      imageUrl: string
    }[]
  }
  testimonials: {
    overallRating: string
    totalReviews: string
    items: {
      id: string
      quote: string
      author: string
      origin: string
      stars: number
      activity: string
      date: string
    }[]
  }
  safety: {
    eyebrow: string
    title: string
    measures: { id: string; icon: SafetyIcon; text: string }[]
    equipment: { id: string; icon: EquipmentIcon; text: string }[]
    inclusionNote: string
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
    nearbyMeetingPoints: {
      id: string
      name: string
      detail: string
    }[]
  }
  booking: {
    eyebrow: string
    title: string
    subtitle: string
    primaryCta: string
    secondaryCta: string
    groupNote: string
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

// Default config with placeholder data
export const defaultActivityConfig: ActivityLandingConfig = {
  hero: {
    tagline: 'Descubre la aventura en el corazón de los Pirineos',
    locationText: 'Aínsa · Huesca, Aragón',
    categoryLabel: 'Aventura y Naturaleza',
    badges: [
      { id: '1', text: 'Guías certificados' },
      { id: '2', text: 'Grupos reducidos' },
    ],
    posterImageUrl: '/images/activity-hero.jpg',
  },
  highlights: {
    items: [
      { id: '1', icon: 'mountain', label: '15+ rutas', detail: 'por todo el Sobrarbe' },
      { id: '2', icon: 'clock', label: '12 años', detail: 'de experiencia' },
      { id: '3', icon: 'users', label: '2.500+', detail: 'aventureros guiados' },
      { id: '4', icon: 'award', label: 'UIMLA', detail: 'guías certificados' },
      { id: '5', icon: 'map-pin', label: 'Ordesa', detail: 'y Monte Perdido' },
      { id: '6', icon: 'calendar', label: '365 días', detail: 'de actividades' },
    ],
  },
  story: {
    eyebrow: 'Nuestra historia',
    title: 'Pasión por la montaña desde 2012',
    paragraphs: [
      'Nacimos en Aínsa con una misión clara: compartir la belleza salvaje del Sobrarbe con viajeros de todo el mundo.',
      'Nuestro equipo de guías locales conoce cada sendero, cada rincón secreto y cada historia de estas montañas milenarias.',
    ],
    pullQuote: 'La montaña no es solo un destino, es un estado del alma.',
    images: [
      { id: '1', url: '/images/about-1.jpg', alt: 'Guía explicando la ruta' },
      { id: '2', url: '/images/about-2.jpg', alt: 'Vista del valle' },
    ],
  },
  activities: {
    eyebrow: 'Nuestras experiencias',
    title: 'Actividades para todos los niveles',
    items: [],
  },
  featured: {
    enabled: true,
    eyebrow: 'Experiencia destacada',
    title: 'Travesía Ordesa - Monte Perdido',
    description: 'Una aventura épica de 3 días atravesando el corazón del Parque Nacional.',
    durationLabel: '3 días',
    difficulty: 'exigente',
    groupSizeLabel: '4-8 personas',
    seasonLabel: 'Jun - Oct',
    priceLabel: 'Desde 295 €/persona',
    imageUrl: '/images/featured-exp.jpg',
  },
  guides: {
    eyebrow: 'Nuestro equipo',
    title: 'Guías apasionados',
    members: [],
  },
  seasons: {
    eyebrow: 'Todo el año',
    title: 'Cada estación, una aventura diferente',
    items: [
      {
        id: '1',
        season: 'primavera',
        title: 'Primavera explosiva',
        description: 'Cascadas en pleno caudal y prados floridos.',
        featuredActivities: [{ id: '1', text: 'Cañones acuáticos' }],
        imageUrl: '/images/season-spring.jpg',
      },
      {
        id: '2',
        season: 'verano',
        title: 'Verano alpino',
        description: 'Alta montaña y rutas de altura.',
        featuredActivities: [{ id: '1', text: 'Trekkings de altura' }],
        imageUrl: '/images/season-summer.jpg',
      },
      {
        id: '3',
        season: 'otono',
        title: 'Otoño mágico',
        description: 'Bosques de colores y setas.',
        featuredActivities: [{ id: '1', text: 'Rutas micológicas' }],
        imageUrl: '/images/season-autumn.jpg',
      },
      {
        id: '4',
        season: 'invierno',
        title: 'Invierno blanco',
        description: 'Raquetas de nieve y paisajes nevados.',
        featuredActivities: [{ id: '1', text: 'Raquetas de nieve' }],
        imageUrl: '/images/season-winter.jpg',
      },
    ],
  },
  testimonials: {
    overallRating: '4.9',
    totalReviews: '89',
    items: [],
  },
  safety: {
    eyebrow: 'Tu seguridad',
    title: 'Seguridad y equipamiento',
    measures: [],
    equipment: [],
    inclusionNote: 'Todo incluido en el precio de la actividad',
  },
  practicalInfo: {
    items: [],
  },
  location: {
    address: 'Plaza Mayor, Aínsa, Huesca',
    directions: [],
    nearbyMeetingPoints: [],
  },
  booking: {
    eyebrow: '¿Listo para la aventura?',
    title: 'Reserva tu experiencia',
    subtitle: 'Grupos reducidos y atención personalizada',
    primaryCta: 'Reservar actividad',
    secondaryCta: 'Consultar disponibilidad',
    groupNote: 'Descuentos para grupos a partir de 8 personas',
  },
  memberOffers: {
    eyebrow: 'Ofertas exclusivas LPMBE',
    title: 'Ventajas para socios del club',
    offers: [],
  },
}
