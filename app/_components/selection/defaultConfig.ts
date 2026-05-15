import type { HotelConfig } from './types'

export const defaultHotelConfig: HotelConfig = {
  name: 'Hotel & Spa Palacio de Cristal',
  tagline: 'Un refugio de lujo en el corazón del Pirineo Aragonés',
  location: {
    village: 'Aínsa, Huesca',
    region: 'Pirineo Aragonés',
    address: 'Calle Mayor, 12 · 22330 Aínsa, Huesca, España',
    phone: '+34 974 500 100',
    email: 'reservas@palaciodecristal.es',
  },
  heroImage: '/images/hero.jpg',
  badges: [
    { label: 'Relais & Châteaux' },
    { label: '5 Estrellas Gran Lujo' },
    { label: 'Spa & Wellness' },
    { label: 'Restaurante Gastronómico' },
  ],
  stats: [
    { icon: 'BedDouble', label: 'Habitaciones', value: '12' },
    { icon: 'Calendar', label: 'Fundación', value: '1847' },
    { icon: 'UtensilsCrossed', label: 'Restaurantes', value: '2' },
    { icon: 'Waves', label: 'Spa', value: '800 m²' },
    { icon: 'Star', label: 'Valoración media', value: '4.9 ★' },
    { icon: 'Droplets', label: 'Piscina', value: 'Infinita' },
  ],
  story: {
    eyebrow: 'Nuestra Historia',
    title: 'Un palacio del siglo XIX convertido en refugio contemporáneo',
    image: '/images/story-portrait.jpg',
    paragraphs: [
      'Construido en 1847 por el arquitecto barcelonés Josep Molins por encargo del barón de Aínsa, el Palacio de Cristal fue durante décadas el corazón social del Pirineo aragonés. Sus salones de piedra caliza y sus jardines de estilo francés acogieron a reyes, diplomáticos y artistas que encontraron en estas tierras un refugio de extraordinaria belleza.',
      'Tras una meticulosa restauración que duró cinco años, el palacio abrió sus puertas como hotel de lujo en 2018. Cada elemento ha sido tratado con la máxima fidelidad histórica: las bóvedas de crucería originales, los suelos de mosaico hidráulico y las galerías acristaladas que dan nombre al establecimiento han sido restaurados por artesanos especializados en patrimonio arquitectónico.',
      'Hoy, el Palacio de Cristal ofrece doce suites únicas en las que conviven la arquitectura centenaria y el confort más contemporáneo, rodeadas de los paisajes incomparables del Parque Nacional de Ordesa y el casco medieval de Aínsa, declarado uno de los pueblos más bonitos de España.',
    ],
    pullQuote: 'Cada piedra cuenta una historia de 175 años',
  },
  awards: [
    {
      icon: 'Award',
      name: 'Relais & Châteaux',
      year: 'Miembro desde 2018',
      description: 'Integrado en la red internacional de hoteles y restaurantes de excelencia.',
    },
    {
      icon: 'BookOpen',
      name: 'Condé Nast Traveler',
      year: 'Best Hotels in Spain 2025',
      description: 'Reconocido entre los mejores establecimientos hoteleros de la Península Ibérica.',
    },
    {
      icon: 'Star',
      name: "TripAdvisor Travelers' Choice",
      year: 'Top 1% mundial · 2024',
      description: 'Situado en el top 1% de los hoteles más valorados a nivel mundial.',
    },
    {
      icon: 'Leaf',
      name: 'Biosphere Hotel',
      year: 'Certificación 2023',
      description: 'Comprometidos con la sostenibilidad y el turismo responsable en el Pirineo.',
    },
  ],
  rooms: [
    {
      name: 'Suite Real',
      size: '95 m²',
      priceFrom: 'Desde 480€ / noche',
      amenities: ['Terraza privada', 'Bañera exenta', 'Vistas al Pirineo'],
      image: '/images/suite-real.jpg',
    },
    {
      name: 'Suite Torre',
      size: '72 m²',
      priceFrom: 'Desde 380€ / noche',
      amenities: ['Bóveda histórica', 'Ducha lluvia', 'Vista 360°'],
      image: '/images/suite-torre.jpg',
    },
    {
      name: 'Suite Jardín',
      size: '65 m²',
      priceFrom: 'Desde 320€ / noche',
      amenities: ['Acceso jardines privados', 'Chimenea', 'Salón independiente'],
      image: '/images/suite-jardin.jpg',
    },
    {
      name: 'Habitación Señorial',
      size: '42 m²',
      priceFrom: 'Desde 280€ / noche',
      amenities: ['Suelo hidráulico original', 'Mini-bar premium', 'Escritorio histórico'],
      image: '/images/suite-real.jpg',
    },
  ],
  gastronomy: {
    eyebrow: 'Gastronomía',
    restaurantName: 'El Cristal · Cocina de Paisaje',
    description:
      'El restaurante El Cristal propone una cocina de raíces pirenaicas llevada a su máxima expresión contemporánea. Los ingredientes proceden de productores locales de las comarcas del Sobrarbe y la Ribagorza, elaborados con técnicas que respetan la esencia de cada producto. Una experiencia gastronómica que traduce el paisaje en el plato.',
    chefName: 'Marcos Velilla',
    chefTitle: 'Chef ejecutivo · 1 Estrella Michelin',
    chefImage: '/images/chef.jpg',
    dishes: [
      'Trucha del río Ara, mantequilla noisette y trufa negra de Graus',
      'Cordero del Pirineo, jugo de sus huesos y hierbas silvestres',
      'Hongos del Sobrarbe, yema curada y tierra de avellana',
      'Tarta de requesón de La Fueva, miel de montaña y sorbete de romero',
    ],
    michelinStar: true,
    image: '/images/restaurant.jpg',
  },
  spa: {
    title: 'Spa Palacio · 800 m² de bienestar',
    description:
      'Diseñado en los sótanos históricos del palacio, el Spa Palacio ofrece un espacio de regeneración absoluta. El circuito termal de 25 metros, las cabinas de tratamiento con vistas al jardín y el salón de relajación con chimenea crean un santuario donde el tiempo se detiene. Todos los tratamientos utilizan aceites esenciales y productos elaborados con plantas del Pirineo.',
    treatments: [
      {
        icon: 'Waves',
        name: 'Circuito Termal',
        description: 'Piscina de 25 m, jacuzzi, sauna finlandesa, baño turco y duchas de contrastes.',
      },
      {
        icon: 'Heart',
        name: 'Masajes',
        description: 'Masaje relajante, deportivo, de piedras calientes y ritual pirenaico con arcilla.',
      },
      {
        icon: 'Sparkles',
        name: 'Tratamientos Faciales',
        description: 'Protocolos de firma con extractos de plantas alpinas y técnicas antiedad.',
      },
      {
        icon: 'Wind',
        name: 'Yoga & Meditación',
        description: 'Sesiones de yoga con instructor certificado en el jardín o en el salón de piedra.',
      },
    ],
    image: '/images/spa.jpg',
  },
  gallery: [
    { src: '/images/hero.jpg', alt: 'Vista exterior del palacio', aspectClass: 'col-span-2 row-span-2' },
    { src: '/images/gallery-1.jpg', alt: 'Piscina infinita', aspectClass: 'col-span-1 row-span-1' },
    { src: '/images/gallery-2.jpg', alt: 'Casco medieval de Aínsa', aspectClass: 'col-span-1 row-span-2' },
    { src: '/images/gallery-3.jpg', alt: 'Gastronomía de autor', aspectClass: 'col-span-1 row-span-1' },
    { src: '/images/gallery-4.jpg', alt: 'Biblioteca del palacio', aspectClass: 'col-span-1 row-span-1' },
    { src: '/images/gallery-5.jpg', alt: 'Vuelo en globo sobre Ordesa', aspectClass: 'col-span-2 row-span-1' },
    { src: '/images/gallery-6.jpg', alt: 'Desayuno en terraza', aspectClass: 'col-span-1 row-span-1' },
    { src: '/images/spa.jpg', alt: 'Spa y wellness', aspectClass: 'col-span-1 row-span-1' },
  ],
  press: [
    {
      outlet: 'Condé Nast Traveler',
      quote: 'El Palacio de Cristal redefine el concepto de lujo rural en España. Una experiencia que sobrepasa cualquier expectativa.',
      date: 'Febrero 2025',
    },
    {
      outlet: 'Forbes Travel',
      quote: 'Entre los 25 hoteles más extraordinarios de Europa. Un lujo inesperado en el corazón del Pirineo aragonés.',
      date: 'Enero 2025',
    },
    {
      outlet: 'El País Viajes',
      quote: 'La joya oculta del turismo de lujo español. Un palacio vivo donde cada detalle cuenta su propia historia.',
      date: 'Noviembre 2024',
    },
    {
      outlet: 'The Financial Times',
      quote: 'Remarkable. A genuinely special place that manages to feel both historic and perfectly of the moment.',
      date: 'Octubre 2024',
    },
    {
      outlet: 'Monocle',
      quote: 'Proof that the best luxury is always contextual. Palacio de Cristal belongs to its landscape.',
      date: 'Septiembre 2024',
    },
  ],
  surroundings: [
    {
      name: 'Parque Nacional de Ordesa',
      distance: '25 min en coche',
      description: 'El gran cañón pirenaico, Patrimonio de la Humanidad. Rutas de senderismo para todos los niveles.',
      image: '/images/surroundings.jpg',
    },
    {
      name: 'Casco medieval de Aínsa',
      distance: '5 min a pie',
      description: 'Una de las plazas medievales mejor conservadas de Aragón. Mercado artesanal los domingos.',
      image: '/images/gallery-2.jpg',
    },
    {
      name: 'Estación de esquí Cerler',
      distance: '45 min en coche',
      description: 'La estación más alta del Pirineo aragonés, con 79 pistas y 57 km esquiables.',
      image: '/images/gallery-5.jpg',
    },
    {
      name: 'Bodegas del Somontano',
      distance: '40 min en coche',
      description: 'La D.O. Somontano, una de las zonas vinícolas más innovadoras y premiadas de España.',
      image: '/images/exp-wine.jpg',
    },
  ],
  experiences: [
    {
      title: 'Ruta a caballo por el Pirineo',
      duration: '4 horas',
      exclusive: true,
      description: 'Recorra valles y pastizales de alta montaña a lomos de caballos de raza pirenaica.',
      image: '/images/exp-horses.jpg',
    },
    {
      title: 'Cata de vinos del Somontano',
      duration: '2.5 horas',
      exclusive: false,
      description: 'Visita privada a una bodega centenaria con cata de seis vinos D.O. Somontano y maridaje.',
      image: '/images/exp-wine.jpg',
    },
    {
      title: 'Vuelo en globo sobre Ordesa',
      duration: '3 horas',
      exclusive: true,
      description: 'Una perspectiva única del Parque Nacional. Champagne al aterrizaje y traslado privado.',
      image: '/images/exp-balloon.jpg',
    },
  ],
  offers: [
    {
      discount: '−20%',
      title: 'Escapada romántica de otoño',
      description:
        'Dos noches en Suite con desayuno incluido, acceso ilimitado al spa, botella de cava Reserva y detalle de bienvenida.',
      validity: '30 noviembre 2025',
      conditions: 'Exclusivo para socios Club LPMBE. No acumulable con otras ofertas.',
      priceFrom: 'Desde 560€',
    },
    {
      discount: '−15%',
      title: 'Gastronomía & Wellness',
      description:
        'Tres noches con media pensión en el restaurante El Cristal, circuito termal diario y un masaje de 60 minutos por estancia.',
      validity: '28 febrero 2026',
      conditions: 'Mínimo 3 noches. Sujeto a disponibilidad. Reserva anticipada recomendada.',
      priceFrom: 'Desde 840€',
    },
    {
      discount: '−25%',
      title: 'Early Bird Semana Santa',
      description:
        'Reserva con más de 60 días de antelación y obtén el máximo descuento en cualquier categoría de habitación.',
      validity: '15 marzo 2026',
      conditions: 'Válido para estancias entre el 1-7 de abril. No reembolsable.',
      priceFrom: 'Desde 420€',
    },
  ],
  reviews: {
    overall: 4.9,
    count: 312,
    items: [
      {
        quote:
          'Un lugar absolutamente mágico. El equilibrio entre el patrimonio histórico y el lujo contemporáneo es perfecto. El equipo es extraordinario, atento sin ser invasivo.',
        author: 'Charlotte M.',
        origin: 'Londres, Reino Unido',
        date: 'Marzo 2025',
      },
      {
        quote:
          'La mejor experiencia hotelera de mi vida, y he visitado Aman, Four Seasons y Belmond. La cocina de Marcos Velilla es simplemente sublime.',
        author: 'Jean-Philippe D.',
        origin: 'París, Francia',
        date: 'Febrero 2025',
      },
      {
        quote:
          'El Pirineo aragonés merece ser descubierto y este palacio es la puerta perfecta. Volveremos sin duda.',
        author: 'Ana García-Novoa',
        origin: 'Madrid, España',
        date: 'Enero 2025',
      },
    ],
  },
  practicalInfo: [
    { icon: 'Clock', label: 'Check-in', value: 'A partir de las 15:00 h' },
    { icon: 'Key', label: 'Check-out', value: 'Hasta las 12:00 h' },
    { icon: 'Languages', label: 'Idiomas', value: 'Español, English, Français, Deutsch' },
    { icon: 'Car', label: 'Aparcamiento', value: 'Gratuito · Garaje cubierto · 15 plazas' },
    { icon: 'PawPrint', label: 'Mascotas', value: 'No se admiten mascotas' },
    { icon: 'Accessibility', label: 'Accesibilidad', value: 'Habitación adaptada disponible' },
    { icon: 'Wifi', label: 'WiFi', value: 'Gratuito en todo el establecimiento' },
    { icon: 'ShieldCheck', label: 'Cancelación', value: 'Flexible hasta 48h antes' },
  ],
  social: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    twitter: 'https://twitter.com',
  },
}
