/**
 * Datos demo para restaurantes premium sin `landingConfig` configurado.
 *
 * Permiten que cualquier restaurante recién promocionado a PREMIUM se vea
 * estéticamente completo desde el primer momento, hasta que el negocio rellene
 * su contenido propio desde el panel del colaborador. Imágenes provienen de
 * /public/restaurante-demo/ (libres y genéricas: cocina autor, comedor, etc).
 */

import type { ChefStat } from './RestauranteChefSection';
import type { PhilosophyPillar } from './RestauranteCuisinePhilosophy';
import type { MenuItem } from './RestauranteMenusSection';
import type { SignatureDish } from './RestauranteSignatureDishes';
import type { AmbienteBlock } from './RestauranteAmbienteSection';

const DEMO_BASE = '/restaurante-demo';

export interface RestaurantePremiumLandingConfig {
  template?: 'restaurante-premium';
  badges?: string[];
  tagline?: string | null;
  ubicacionExtra?: string | null;
  chef?: {
    nombre: string;
    fotoUrl?: string;
    eyebrow?: string;
    bio: string[];
    stats?: ChefStat[];
  };
  filosofia?: {
    eyebrow?: string;
    title?: string;
    pillars: PhilosophyPillar[];
  };
  menus?: {
    eyebrow?: string;
    title?: string;
    items: MenuItem[];
  };
  platos?: {
    eyebrow?: string;
    title?: string;
    items: SignatureDish[];
  };
  ambiente?: {
    blocks: AmbienteBlock[];
  };
  infoPractica?: {
    aforo?: string | null;
    tipoServicio?: string | null;
    tiempoMedio?: string | null;
    politicaNinos?: string | null;
    politicaMascotas?: string | null;
    dietas?: string[];
    notaReserva?: string | null;
  };
  acceso?: {
    aparcamiento?: string;
    transportePublico?: string;
    accesibilidad?: string;
  };
  cancelacionTexto?: string | null;
}

export function getDemoHeroImages(): { id: number; url: string; alt: string | null; orden: number }[] {
  return [
    { id: -101, url: `${DEMO_BASE}/hero-1.jpg`, alt: 'Restaurante con vistas al pueblo', orden: 0 },
    { id: -102, url: `${DEMO_BASE}/hero-2.jpg`, alt: 'Comedor principal', orden: 1 },
    { id: -103, url: `${DEMO_BASE}/hero-3.jpg`, alt: 'Plato de temporada', orden: 2 },
    { id: -104, url: `${DEMO_BASE}/hero-4.jpg`, alt: 'Terraza exterior', orden: 3 },
  ];
}

export function getDemoChef(): RestaurantePremiumLandingConfig['chef'] {
  return {
    nombre: 'Marina Ferrer',
    fotoUrl: `${DEMO_BASE}/chef.jpg`,
    eyebrow: 'El chef',
    bio: [
      'Formada en el Basque Culinary Center y con estancias en restaurantes de referencia, nuestra chef regresó a su tierra natal con una misión clara: elevar el producto local a la altura que merece.',
      'Su cocina es un diálogo íntimo con la huerta y el monte. Cada plato nace de la temporada, del productor de confianza y de la memoria gastronómica más auténtica.',
    ],
    stats: [
      { icon: 'chef-hat', label: 'Años de experiencia', value: '14' },
      { icon: 'award', label: 'Plato insignia', value: 'Cordero del Pirineo' },
      { icon: 'map-pin', label: 'Origen culinario', value: 'Aragón' },
    ],
  };
}

export function getDemoFilosofia(): RestaurantePremiumLandingConfig['filosofia'] {
  return {
    eyebrow: 'Filosofía',
    title: 'Nuestra cocina',
    pillars: [
      {
        icon: 'leaf',
        title: 'Producto de proximidad',
        desc: 'Trabajamos solo con productores locales en un radio de 30 km. Conocemos a quienes cultivan y crían cada ingrediente que llega a nuestra cocina.',
      },
      {
        icon: 'calendar',
        title: 'Cocina de temporada',
        desc: 'Nuestra carta evoluciona cada dos meses según la huerta y los mercados. No repetimos plato hasta que la temporada lo pide de nuevo.',
      },
      {
        icon: 'wine',
        title: 'Maridaje cuidado',
        desc: 'Más de 200 referencias de vinos con foco en pequeñas bodegas de la zona. Nuestro sumiller diseña maridajes a medida para cada menú.',
      },
    ],
  };
}

export function getDemoMenus(): RestaurantePremiumLandingConfig['menus'] {
  return {
    eyebrow: 'Experiencia gastronómica',
    title: 'Nuestros menús',
    items: [
      {
        nombre: 'Menú del día',
        precio: 20,
        descripcion: 'Propuesta diaria con primero, segundo y postre elaborados con producto de temporada de la huerta local.',
        chip: 'Solo mediodía L–V',
      },
      {
        nombre: 'Menú degustación',
        precio: 65,
        precioNota: '/ 7 pases',
        descripcion: 'Un recorrido completo por la despensa de la zona. Elaboraciones técnicas y honestidad de producto en cada pase.',
        cursos: [
          'Aperitivo de bienvenida',
          'Entrante frío de temporada',
          'Pescado de río',
          'Carne de la zona con jugo de montaña',
          'Selección de quesos artesanos',
          'Pre-postre helado',
          'Postre de temporada',
        ],
        destacado: true,
        badge: 'Más popular',
      },
      {
        nombre: 'Menú maridaje',
        precio: 95,
        precioNota: '/ 7 pases + 5 copas',
        descripcion: 'El menú degustación completo acompañado de cinco vinos cuidadosamente seleccionados por nuestra sumiller para realzar cada pase.',
        chip: 'Vinos de pequeñas bodegas locales',
      },
    ],
  };
}

export function getDemoPlatos(): RestaurantePremiumLandingConfig['platos'] {
  return {
    eyebrow: 'La carta',
    title: 'Platos imprescindibles',
    items: [
      { fotoUrl: `${DEMO_BASE}/dish-1.jpg`, nombre: 'Jamón ibérico con tomate de la huerta', precio: '18€', wide: false },
      { fotoUrl: `${DEMO_BASE}/dish-2.jpg`, nombre: 'Trucha de río con ajo negro y alcachofa', precio: '26€', wide: true },
      { fotoUrl: `${DEMO_BASE}/dish-3.jpg`, nombre: 'Cordero con jugo de montaña', precio: '32€', wide: true },
      { fotoUrl: `${DEMO_BASE}/dish-4.jpg`, nombre: 'Tabla de quesos artesanos', precio: '16€', wide: false },
      { fotoUrl: `${DEMO_BASE}/dish-5.jpg`, nombre: 'Esfera de chocolate blanco con frutos del bosque', precio: '14€', wide: false },
      { fotoUrl: `${DEMO_BASE}/dish-6.jpg`, nombre: 'Aperitivos de bienvenida de temporada', precio: '—', wide: false },
    ],
  };
}

export function getDemoAmbiente(): RestaurantePremiumLandingConfig['ambiente'] {
  return {
    blocks: [
      {
        fotoUrl: `${DEMO_BASE}/comedor.jpg`,
        alt: 'Comedor principal',
        title: 'El comedor principal',
        body: 'El salón principal ocupa la antigua bodega de una masía centenaria. Las bóvedas de piedra y los candelabros de hierro forjado crean una atmósfera íntima y cálida, perfecta para una experiencia gastronómica que trasciende lo culinario. Aforo limitado para garantizar la atención y el silencio que cada plato merece.',
        imageLeft: true,
      },
      {
        fotoUrl: `${DEMO_BASE}/bodega.jpg`,
        alt: 'Bodega y catas privadas',
        title: 'Bodega y catas privadas',
        body: 'Bajo el comedor, la bodega atesora más de 200 referencias, con especial énfasis en pequeños productores locales. El espacio admite grupos reducidos para catas privadas maridadas con platos de cocina en miniatura. Un entorno único para celebraciones, eventos de empresa o simplemente una noche diferente.',
        imageLeft: false,
      },
    ],
  };
}

export function getDemoInfoPractica(): RestaurantePremiumLandingConfig['infoPractica'] {
  return {
    aforo: '28 comensales (máximo)',
    tipoServicio: 'Almuerzo · Cena · Eventos privados',
    tiempoMedio: '2 h 30 min – 3 h',
    politicaNinos: 'Bienvenidos, menú infantil disponible',
    politicaMascotas: 'Permitidas en terraza exterior',
    dietas: ['VEGANO', 'VEGETARIANO', 'SIN_GLUTEN', 'SIN_LACTOSA'],
    notaReserva: 'Recomendamos reservar con al menos 48 horas de antelación, especialmente en fin de semana.',
  };
}

export function getDemoAcceso(puebloNombre?: string): RestaurantePremiumLandingConfig['acceso'] {
  const lugar = puebloNombre ?? 'el casco histórico';
  return {
    aparcamiento: `Aparcamiento gratuito en ${lugar} a pocos minutos a pie del restaurante. Zona azul disponible junto a la plaza principal.`,
    transportePublico: 'Bien comunicado en autobús desde las localidades cercanas. Servicio de taxi local disponible bajo petición.',
    accesibilidad: 'Acceso adaptado por entrada lateral. Baño adaptado en planta baja. Consultadnos necesidades especiales al reservar y lo preparamos todo.',
  };
}
