// ─────────────────────────────────────────────────────────────────────────────
// LandingConfig — shape of the JSON object edited in the admin panel
// and consumed by the public premium listing page.
// ─────────────────────────────────────────────────────────────────────────────

export type StatIcon =
  | 'chef-hat'
  | 'award'
  | 'map-pin'
  | 'clock'
  | 'star'
  | 'heart'

export interface ChefStat {
  icon: StatIcon
  label: string
  value: string
}

export interface ChefConfig {
  eyebrow: string
  name: string
  bio1: string
  bio2: string
  stats: ChefStat[]
}

// ─────────────────────────────────────────────────────────────────────────────

export type PhilosophyIcon =
  | 'leaf'
  | 'calendar'
  | 'wine'
  | 'flame'
  | 'sprout'
  | 'utensils'

export interface PhilosophyPillar {
  id: string
  icon: PhilosophyIcon
  title: string
  description: string
}

export interface PhilosophyConfig {
  eyebrow: string
  title: string
  pillars: PhilosophyPillar[]
}

// ─────────────────────────────────────────────────────────────────────────────

export interface MenuCourse {
  id: string
  text: string
}

export interface MenuItem {
  id: string
  name: string
  price: string
  priceNote: string
  description: string
  chip: string
  courses: MenuCourse[]
  featured: boolean
  badgeText: string
}

export interface MenusConfig {
  eyebrow: string
  title: string
  items: MenuItem[]
}

// ─────────────────────────────────────────────────────────────────────────────

export interface DishItem {
  id: string
  name: string
  price: string
  wide: boolean
  imageUrl: string
}

export interface DishesConfig {
  eyebrow: string
  title: string
  items: DishItem[]
}

// ─────────────────────────────────────────────────────────────────────────────

export interface AmbianceBlock {
  id: string
  imageUrl: string
  alt: string
  title: string
  description: string
  imageLeft: boolean
}

export interface AmbianceConfig {
  blocks: AmbianceBlock[]
}

// ─────────────────────────────────────────────────────────────────────────────

export type DietOption =
  | 'VEGAN'
  | 'VEGETARIAN'
  | 'GLUTEN_FREE'
  | 'LACTOSE_FREE'
  | 'KETO'
  | 'HALAL'
  | 'KOSHER'

export interface PracticalInfoConfig {
  capacity: string
  serviceType: string
  avgTime: string
  childrenPolicy: string
  petPolicy: string
  reservationNote: string
  dietOptions: DietOption[]
  cancellationText: string
}

// ─────────────────────────────────────────────────────────────────────────────

export interface AccessConfig {
  parking: string
  transport: string
  accessibility: string
}

// ─────────────────────────────────────────────────────────────────────────────

export interface HeroBadge {
  id: string
  text: string
}

export interface HeroConfig {
  tagline: string
  locationText: string
  badges: HeroBadge[]
}

// ─────────────────────────────────────────────────────────────────────────────

export interface MemberOffer {
  id: string
  icon: 'gift' | 'percent' | 'sparkles' | 'crown' | 'wine' | 'star'
  title: string
  description: string
  highlight: string
  isFeatured: boolean
  badgeText: string
}

export interface MemberOffersConfig {
  eyebrow: string
  title: string
  offers: MemberOffer[]
}

// ─────────────────────────────────────────────────────────────────────────────

export interface LandingConfig {
  hero: HeroConfig
  chef: ChefConfig
  philosophy: PhilosophyConfig
  menus: MenusConfig
  dishes: DishesConfig
  ambiance: AmbianceConfig
  practicalInfo: PracticalInfoConfig
  access: AccessConfig
  memberOffers: MemberOffersConfig
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo / default data matching the existing public page
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_CONFIG: LandingConfig = {
  hero: {
    tagline: 'Cocina de autor · Pirineo Aragonés',
    locationText: 'Aínsa, Huesca · Sobrarbe',
    badges: [
      { id: 'b1', text: 'Guía Michelin' },
      { id: 'b2', text: 'Premium LPMBE' },
      { id: 'b3', text: 'Km0 Certificado' },
    ],
  },
  chef: {
    eyebrow: 'El Chef',
    name: 'Marina Ferrer',
    bio1:
      'Formada en el Basque Culinary Center y con estancias en restaurantes de referencia como El Portal del Echaurren y Mugaritz, Marina regresó al Sobrarbe con una misión clara: elevar el producto local a la altura que merece.',
    bio2:
      'Su cocina es un diálogo íntimo con la huerta y el monte del Pirineo. Cada plato nace de la temporada, del productor de confianza y de la memoria gastronómica del Aragón más auténtico.',
    stats: [
      { icon: 'chef-hat', label: 'Años de experiencia', value: '14' },
      { icon: 'award', label: 'Plato insignia', value: 'Cordero del Pirineo' },
      { icon: 'map-pin', label: 'Origen culinario', value: 'Sobrarbe, Aragón' },
    ],
  },
  philosophy: {
    eyebrow: 'Nuestra cocina',
    title: 'Los tres pilares de Casa Oliveira',
    pillars: [
      {
        id: 'p1',
        icon: 'leaf',
        title: 'Producto local',
        description:
          'Trabajamos con productores del Sobrarbe y el Pirineo. Cada ingrediente tiene nombre y origen.',
      },
      {
        id: 'p2',
        icon: 'calendar',
        title: 'Temporalidad',
        description:
          'La carta cambia con las estaciones. La naturaleza dicta el ritmo de nuestra cocina.',
      },
      {
        id: 'p3',
        icon: 'wine',
        title: 'Maridaje',
        description:
          'Selección de vinos de pequeñas bodegas aragonesas y nacionales curada por nuestra sumiller.',
      },
    ],
  },
  menus: {
    eyebrow: 'Experiencia gastronómica',
    title: 'Nuestros menús',
    items: [
      {
        id: 'm1',
        name: 'Menú del día',
        price: '20',
        priceNote: '',
        description:
          'Propuesta diaria con primero, segundo y postre elaborados con producto de temporada.',
        chip: 'Solo mediodía L–V',
        courses: [],
        featured: false,
        badgeText: '',
      },
      {
        id: 'm2',
        name: 'Menú degustación',
        price: '65',
        priceNote: '/ 7 pases',
        description:
          'Un recorrido completo por la despensa del Pirineo Aragonés. Elaboraciones técnicas y honestidad de producto en cada pase.',
        chip: '',
        courses: [
          { id: 'c1', text: 'Aperitivo de bienvenida' },
          { id: 'c2', text: 'Entrante frío de temporada' },
          { id: 'c3', text: 'Pescado de río del Sobrarbe' },
          { id: 'c4', text: 'Carne del Pirineo con jugo de montaña' },
          { id: 'c5', text: 'Selección de quesos artesanos' },
          { id: 'c6', text: 'Pre-postre helado' },
          { id: 'c7', text: 'Postre de temporada' },
        ],
        featured: true,
        badgeText: 'Más popular',
      },
      {
        id: 'm3',
        name: 'Menú maridaje',
        price: '95',
        priceNote: '/ 7 pases + 5 copas',
        description:
          'El menú degustación completo acompañado de cinco vinos cuidadosamente seleccionados.',
        chip: '',
        courses: [],
        featured: false,
        badgeText: '',
      },
    ],
  },
  dishes: {
    eyebrow: 'Platos estrella',
    title: 'Nuestras creaciones',
    items: [
      { id: 'd1', name: 'Jamón ibérico con tomate del Pirineo', price: '18€', wide: false, imageUrl: '/images/dish-1.jpg' },
      { id: 'd2', name: 'Trucha del Sobrarbe, ajo silvestre y alcachofa', price: '24€', wide: true, imageUrl: '/images/dish-2.jpg' },
      { id: 'd3', name: 'Cordero del Pirineo, trufa negra y raíces', price: '32€', wide: false, imageUrl: '/images/dish-3.jpg' },
      { id: 'd4', name: 'Tabla de quesos artesanos', price: '16€', wide: false, imageUrl: '/images/dish-4.jpg' },
      { id: 'd5', name: 'Esfera de chocolate blanco y frutos del bosque', price: '12€', wide: false, imageUrl: '/images/dish-5.jpg' },
      { id: 'd6', name: 'Amuse-bouche de bienvenida', price: 'Incluido', wide: true, imageUrl: '/images/dish-6.jpg' },
    ],
  },
  ambiance: {
    blocks: [
      {
        id: 'a1',
        imageUrl: '/images/comedor.jpg',
        alt: 'Comedor principal de Casa Oliveira',
        title: 'El Comedor',
        description:
          'Bóveda de piedra, vigas de madera y mesas vestidas con lino natural. El comedor principal de Casa Oliveira es un espacio íntimo y cálido donde el tiempo se detiene.',
        imageLeft: false,
      },
      {
        id: 'a2',
        imageUrl: '/images/bodega.jpg',
        alt: 'Bodega privada para catas',
        title: 'La Bodega',
        description:
          'Arcos de ladrillo y más de 400 referencias entre sus estantes. La bodega es el corazón secreto del restaurante, disponible para catas privadas y maridajes exclusivos.',
        imageLeft: true,
      },
    ],
  },
  practicalInfo: {
    capacity: '28 comensales (máximo)',
    serviceType: 'Almuerzo · Cena · Eventos privados',
    avgTime: '2 h 30 min – 3 h',
    childrenPolicy: 'Bienvenidos, menú infantil disponible',
    petPolicy: 'Permitidas en terraza exterior',
    reservationNote: 'Recomendamos reservar con al menos 48 horas de antelación, especialmente en fin de semana.',
    dietOptions: ['VEGETARIAN', 'GLUTEN_FREE', 'LACTOSE_FREE', 'VEGAN'],
    cancellationText: 'Cancelación gratuita hasta 24 horas antes. Cancelaciones posteriores pueden incurrir en un cargo del 50%.',
  },
  access: {
    parking: 'Aparcamiento gratuito a 100 m en el Parking Medieval de Aínsa. Acceso directo desde la N-260.',
    transport: 'Servicio de bus Alosa desde Barbastro y Huesca. Parada en Plaza Mayor de Aínsa (5 min a pie).',
    accessibility: 'Acceso por rampa lateral. Baño adaptado disponible. Consultar para necesidades específicas.',
  },
  memberOffers: {
    eyebrow: 'Ventajas socios Club LPMBE',
    title: 'Ofertas exclusivas',
    offers: [
      {
        id: 'o1',
        icon: 'gift',
        title: 'Copa de cava de bienvenida',
        description: 'Recibe a tu llegada una copa de cava artesano de bodegas del Somontano, solo por ser socio del club.',
        highlight: 'Gratis',
        isFeatured: true,
        badgeText: 'Destacada',
      },
      {
        id: 'o2',
        icon: 'percent',
        title: '10% en menú degustación',
        description: 'Descuento exclusivo del 10% aplicable al menú degustación y al menú maridaje en cualquier visita.',
        highlight: '−10%',
        isFeatured: false,
        badgeText: '',
      },
      {
        id: 'o3',
        icon: 'sparkles',
        title: 'Cata de vinos privada',
        description: 'Acceso preferente a sesiones privadas de cata en nuestra bodega. Capacidad limitada a 8 socios.',
        highlight: 'Bajo reserva',
        isFeatured: false,
        badgeText: 'Nueva',
      },
    ],
  },
}
