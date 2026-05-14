import type { CommerceLandingConfig } from './commerce-types'

export const defaultCommerceConfig: CommerceLandingConfig = {
  identity: {
    businessName: 'Quesos del Pirineo Pardo',
    tagline: 'Quesos artesanos de montaña elaborados con leche cruda de vaca parda en el corazón del Pirineo aragonés',
    businessType: 'Quesería',
    foundedYear: 1987,
    region: 'Sobrarbe, Huesca',
    languages: ['ES', 'EN', 'FR']
  },
  hero: {
    images: [
      { id: 'hero-1', url: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=1600&q=80', alt: 'Quesos artesanos madurados', order: 0 },
      { id: 'hero-2', url: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=1600&q=80', alt: 'Obrador tradicional', order: 1 },
      { id: 'hero-3', url: 'https://images.unsplash.com/photo-1559561853-08451507cbe7?w=1600&q=80', alt: 'Paisaje del Pirineo', order: 2 }
    ],
    h1: 'Quesos del Pirineo Pardo',
    taglineItalic: 'Tradición quesera desde 1987 en Aínsa',
    badges: [
      { id: 'badge-1', text: 'Producto km0' },
      { id: 'badge-2', text: 'Hecho a mano' },
      { id: 'badge-3', text: 'Tradición familiar' }
    ],
    primaryCta: { text: 'Visita el obrador', url: '/reservar' },
    secondaryCta: { text: 'Comprar online', url: '/tienda' }
  },
  stats: {
    stats: [
      { id: 'stat-1', number: '37', label: 'Años de tradición' },
      { id: 'stat-2', number: '12', label: 'Variedades de queso' },
      { id: 'stat-3', number: '50+', label: 'Vacas pardas' },
      { id: 'stat-4', number: '2.000', label: 'Visitantes/año' }
    ]
  },
  story: {
    eyebrow: 'El oficio',
    title: 'Nuestra historia',
    paragraphs: [
      'Todo comenzó en 1987 cuando los abuelos María y Pascual decidieron recuperar la tradición quesera familiar que había dormido durante décadas. Con apenas diez vacas pardas y un pequeño obrador anexo a la casa, empezaron a elaborar los primeros quesos siguiendo las recetas transmitidas de generación en generación.',
      'Hoy, sus nietos Lucía y Jorge continúan el legado con el mismo respeto por los métodos tradicionales: leche cruda de nuestras propias vacas, cuajo natural y maduración en cueva de piedra. Cada queso que sale de nuestro obrador lleva el sello de tres generaciones de cuidado artesano.',
      'Seguimos siendo una quesería familiar donde conocemos a cada una de nuestras vacas por su nombre. Creemos que la calidad empieza en el prado, continúa en el obrador y termina en vuestra mesa.'
    ],
    pullQuote: 'El queso no se fabrica, se cría. Necesita tiempo, paciencia y las manos de quien lo quiere.',
    photos: [
      { id: 'story-1', url: 'https://images.unsplash.com/photo-1559561853-08451507cbe7?w=600&q=80', year: '1987', alt: 'Los abuelos fundadores' },
      { id: 'story-2', url: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80', year: '2005', alt: 'Segunda generación' },
      { id: 'story-3', url: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=600&q=80', year: '2024', alt: 'La nueva generación' }
    ]
  },
  products: {
    eyebrow: 'Productos',
    title: 'Nuestros quesos',
    products: [
      {
        id: 'prod-1',
        imageUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80',
        name: 'Queso Curado de Montaña',
        description: 'Madurado 6 meses en cueva natural. Sabor intenso con notas a frutos secos.',
        format: 'Pieza 700 g',
        price: '18 €',
        badges: [{ id: 'pb-1', text: 'Best-seller' }],
        purchaseUrl: '/tienda/curado-montana',
        featured: true
      },
      {
        id: 'prod-2',
        imageUrl: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=600&q=80',
        name: 'Queso Semicurado',
        description: 'Textura cremosa, sabor suave. Perfecto para el día a día.',
        format: 'Pieza 500 g',
        price: '14 €',
        badges: [],
        purchaseUrl: '/tienda/semicurado',
        featured: false
      },
      {
        id: 'prod-3',
        imageUrl: 'https://images.unsplash.com/photo-1559561853-08451507cbe7?w=600&q=80',
        name: 'Queso Azul del Pirineo',
        description: 'Veteado natural de penicillium. Potente y equilibrado.',
        format: 'Cuña 250 g',
        price: '12 €',
        badges: [{ id: 'pb-2', text: 'Edición limitada' }],
        purchaseUrl: '',
        featured: false
      },
      {
        id: 'prod-4',
        imageUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80',
        name: 'Queso Gran Reserva',
        description: 'Madurado 12+ meses. Para los paladares más exigentes.',
        format: 'Pieza 1 kg',
        price: '32 €',
        badges: [{ id: 'pb-3', text: 'Madurado 90 días' }, { id: 'pb-4', text: 'Solo obrador' }],
        purchaseUrl: '',
        featured: true
      }
    ]
  },
  process: {
    eyebrow: 'El proceso',
    title: 'Cómo hacemos nuestro queso',
    steps: [
      {
        id: 'step-1',
        number: 1,
        title: 'Ordeño y recogida',
        description: 'Cada mañana recogemos la leche fresca de nuestras vacas pardas que pastan en los prados de montaña.',
        photoUrl: 'https://images.unsplash.com/photo-1559561853-08451507cbe7?w=600&q=80'
      },
      {
        id: 'step-2',
        number: 2,
        title: 'Cuajado artesanal',
        description: 'Utilizamos cuajo natural y controlamos la temperatura de forma manual, como hacían nuestros abuelos.',
        photoUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80'
      },
      {
        id: 'step-3',
        number: 3,
        title: 'Moldeado y prensado',
        description: 'Cada pieza se moldea a mano y se prensa con el peso justo para conseguir la textura perfecta.',
        photoUrl: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=600&q=80'
      },
      {
        id: 'step-4',
        number: 4,
        title: 'Maduración en cueva',
        description: 'Nuestros quesos reposan en cueva de piedra natural a temperatura y humedad constantes.',
        photoUrl: 'https://images.unsplash.com/photo-1559561853-08451507cbe7?w=600&q=80'
      }
    ]
  },
  place: {
    imageUrl: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=1600&q=80',
    title: 'Nuestro obrador y cueva de maduración',
    description: 'Visita nuestras instalaciones y descubre cómo elaboramos los quesos de forma artesanal. Podrás ver la cueva de maduración excavada en la roca donde nuestros quesos reposan durante meses.',
    cta: { text: 'Reserva una visita', url: '/reservar' },
    showSection: true
  },
  experiences: {
    eyebrow: 'Experiencias',
    title: 'Vive la quesería',
    experiences: [
      {
        id: 'exp-1',
        imageUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80',
        title: 'Visita guiada + cata',
        duration: '1 h 30',
        groupSize: '2–10 personas',
        price: 'desde 15 €/persona',
        lpmbeDiscount: true,
        discountPercent: 15,
        reservationUrl: '/reservar/visita-cata'
      },
      {
        id: 'exp-2',
        imageUrl: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=600&q=80',
        title: 'Taller de elaboración',
        duration: '3 h',
        groupSize: '4–8 personas',
        price: 'desde 45 €/persona',
        lpmbeDiscount: true,
        discountPercent: 10,
        reservationUrl: '/reservar/taller'
      },
      {
        id: 'exp-3',
        imageUrl: 'https://images.unsplash.com/photo-1559561853-08451507cbe7?w=600&q=80',
        title: 'Picnic en el prado',
        duration: '2 h',
        groupSize: '2–6 personas',
        price: 'desde 25 €/persona',
        lpmbeDiscount: false,
        discountPercent: 0,
        reservationUrl: '/reservar/picnic'
      }
    ]
  },
  awards: {
    logos: [
      { id: 'award-1', url: 'https://placehold.co/200x100/f5f0e8/8b6914?text=World+Cheese+Awards', alt: 'World Cheese Awards', year: '2023' },
      { id: 'award-2', url: 'https://placehold.co/200x100/f5f0e8/8b6914?text=Mejor+Queso+Aragón', alt: 'Mejor Queso de Aragón', year: '2022' }
    ],
    pressQuotes: [
      { id: 'press-1', text: 'Un queso que sabe a montaña, a tradición y a familia.', medium: 'El País Semanal', year: '2023' },
      { id: 'press-2', text: 'De los mejores quesos artesanos de España.', medium: 'Guía Repsol', year: '2024' }
    ]
  },
  testimonials: {
    testimonials: [
      {
        id: 'test-1',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
        name: 'María García',
        origin: 'Barcelona',
        stars: 5,
        text: 'Descubrimos esta quesería en nuestras vacaciones por el Pirineo y desde entonces pedimos online cada mes. El curado de montaña es espectacular.',
        date: 'Octubre 2024',
        featured: true
      },
      {
        id: 'test-2',
        photoUrl: '',
        name: 'Juan Pérez',
        origin: 'Madrid',
        stars: 5,
        text: 'La visita guiada merece mucho la pena. Jorge nos explicó todo el proceso con pasión y la cata final fue inolvidable.',
        date: 'Agosto 2024',
        featured: false
      },
      {
        id: 'test-3',
        photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80',
        name: 'Anne Dupont',
        origin: 'Lyon, Francia',
        stars: 4,
        text: 'Excellent fromage artisanal! La visite de la cave de maturation vaut le détour.',
        date: 'Julio 2024',
        featured: false
      }
    ]
  },
  practicalInfo: {
    schedule: [
      { day: 0, dayName: 'Lunes', open: false, openTime1: '', closeTime1: '' },
      { day: 1, dayName: 'Martes', open: true, openTime1: '10:00', closeTime1: '14:00', openTime2: '16:00', closeTime2: '19:00' },
      { day: 2, dayName: 'Miércoles', open: true, openTime1: '10:00', closeTime1: '14:00', openTime2: '16:00', closeTime2: '19:00' },
      { day: 3, dayName: 'Jueves', open: true, openTime1: '10:00', closeTime1: '14:00', openTime2: '16:00', closeTime2: '19:00' },
      { day: 4, dayName: 'Viernes', open: true, openTime1: '10:00', closeTime1: '14:00', openTime2: '16:00', closeTime2: '19:00' },
      { day: 5, dayName: 'Sábado', open: true, openTime1: '10:00', closeTime1: '14:00' },
      { day: 6, dayName: 'Domingo', open: false, openTime1: '', closeTime1: '' }
    ],
    paymentMethods: ['Efectivo', 'Tarjeta', 'Bizum'],
    shippingPolicy: 'Envíos a toda España peninsular en 24-48h. Embalaje isotérmico para garantizar la cadena de frío. Envío gratuito a partir de 50€.',
    shippingOption: 'peninsula24h',
    returnPolicy: 'Si el producto llega en mal estado, contacta con nosotros en 24h y te lo reponemos sin coste.',
    languagesServed: ['ES', 'EN', 'FR'],
    additionalNotes: 'Para grupos de más de 10 personas, contactar previamente para organizar la visita.'
  },
  location: {
    address: 'Camino del Obrador, 12',
    locality: 'Aínsa',
    province: 'Huesca',
    community: 'Aragón',
    lat: 42.4175,
    lng: 0.1394,
    howToGet: [
      { id: 'htg-1', icon: 'Car', title: 'En coche', description: 'A 1h de Huesca por la A-138. Parking gratuito junto al obrador.' },
      { id: 'htg-2', icon: 'Bus', title: 'En bus', description: 'Línea Huesca-Aínsa (Alosa). Parada a 500m del obrador.' },
      { id: 'htg-3', icon: 'MapPin', title: 'GPS', description: '42.4175, 0.1394' }
    ],
    googleMapsUrl: 'https://maps.google.com/?q=42.4175,0.1394'
  },
  visitCta: {
    title: 'Visítanos en el obrador',
    subtitle: 'Ven a conocernos, prueba nuestros quesos y llévate un pedacito del Pirineo a casa',
    primaryCta: { text: 'Reservar visita', url: '/reservar' },
    phone: '+34 974 500 123',
    whatsapp: '+34 628 123 456'
  },
  memberOffers: {
    eyebrow: 'Ventajas socios',
    title: 'Ofertas exclusivas para socios LPMBE',
    offers: [
      {
        id: 'offer-1',
        icon: 'Percent',
        title: 'Descuento en visitas',
        highlight: '−15%',
        description: 'Todas las visitas guiadas y talleres con descuento exclusivo para socios del Club.',
        conditions: 'Presenta tu carnet de socio',
        featured: true,
        badge: 'Destacada'
      },
      {
        id: 'offer-2',
        icon: 'Truck',
        title: 'Envío gratuito',
        highlight: 'Gratis',
        description: 'Gastos de envío gratuitos en pedidos online superiores a 30€.',
        conditions: 'Código LPMBE30 en checkout',
        featured: false,
        badge: 'Solo socios'
      },
      {
        id: 'offer-3',
        icon: 'Gift',
        title: 'Queso de bienvenida',
        highlight: 'Regalo',
        description: 'Cuña de queso semicurado de regalo en tu primera visita como socio.',
        conditions: 'Válido hasta fin de existencias',
        featured: false,
        badge: 'Nueva'
      }
    ]
  },
  social: {
    instagram: 'https://instagram.com/quesospirineoPardo',
    facebook: 'https://facebook.com/quesospirineopardo',
    youtube: '',
    tiktok: '',
    x: '',
    tripadvisor: 'https://tripadvisor.com/quesos-pirineo-pardo',
    web: 'https://quesosdelpirineopardo.com'
  },
  contact: {
    phone: '+34 974 500 123',
    email: 'hola@quesosdelpirineopardo.com',
    whatsapp: '+34 628 123 456',
    contactPerson: 'Lucía García',
    contactFormUrl: ''
  }
}

// Helper to parse and validate initial config
export function parseInitialConfig(raw: unknown): CommerceLandingConfig {
  if (!raw || typeof raw !== 'object') {
    return { ...defaultCommerceConfig }
  }

  try {
    const config = raw as Partial<CommerceLandingConfig>
    
    // Validate required sections exist
    if (!config.identity || !config.hero || !config.products) {
      return { ...defaultCommerceConfig }
    }
    
    // Merge with defaults to fill missing fields
    return {
      identity: { ...defaultCommerceConfig.identity, ...config.identity },
      hero: { ...defaultCommerceConfig.hero, ...config.hero },
      stats: { ...defaultCommerceConfig.stats, ...config.stats },
      story: { ...defaultCommerceConfig.story, ...config.story },
      products: { ...defaultCommerceConfig.products, ...config.products },
      process: { ...defaultCommerceConfig.process, ...config.process },
      place: { ...defaultCommerceConfig.place, ...config.place },
      experiences: { ...defaultCommerceConfig.experiences, ...config.experiences },
      awards: { ...defaultCommerceConfig.awards, ...config.awards },
      testimonials: { ...defaultCommerceConfig.testimonials, ...config.testimonials },
      practicalInfo: { ...defaultCommerceConfig.practicalInfo, ...config.practicalInfo },
      location: { ...defaultCommerceConfig.location, ...config.location },
      visitCta: { ...defaultCommerceConfig.visitCta, ...config.visitCta },
      memberOffers: { ...defaultCommerceConfig.memberOffers, ...config.memberOffers },
      social: { ...defaultCommerceConfig.social, ...config.social },
      contact: { ...defaultCommerceConfig.contact, ...config.contact }
    }
  } catch {
    return { ...defaultCommerceConfig }
  }
}

// Generate unique IDs
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
