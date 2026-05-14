import {
  ImageIcon,
  BarChart3,
  BookOpen,
  BedDouble,
  Compass,
  Coffee,
  Grid2x2,
  Star,
  Info,
  MapPin,
  Calendar,
  Crown,
  Share2,
  Sparkles,
} from 'lucide-react'

import type { SectionMeta } from '@/app/gestion/asociacion/negocios/[slug]/_editor-shared/SectionsLayoutEditor'

/**
 * Lista canónica de secciones que componen la **página pública** premium
 * de alojamiento (HOTEL / CASA_RURAL). El editor controla `_layout` sobre
 * estas claves; la pública aplica `landingConfig.v0._layout`.
 */
export const ALOJAMIENTO_PUBLIC_SECTIONS: SectionMeta[] = [
  { key: 'hero',          label: 'Portada (hero)',         description: 'Carrusel principal',                   icon: ImageIcon, required: true },
  { key: 'quickStats',    label: 'Stats rápidas',          description: 'Check-in, habitaciones, precio…',      icon: BarChart3 },
  { key: 'aboutStory',    label: 'Historia',               description: 'Relato del alojamiento',               icon: BookOpen },
  { key: 'rooms',         label: 'Habitaciones',           description: 'Estancias e imágenes',                 icon: BedDouble },
  { key: 'experiences',   label: 'Experiencias',           description: 'Actividades incluidas',                icon: Compass },
  { key: 'breakfast',     label: 'Desayuno / gastronomía', description: 'Imagen y descripción',                 icon: Coffee },
  { key: 'amenities',     label: 'Servicios',              description: 'Listado de amenities',                 icon: Grid2x2 },
  { key: 'reviews',       label: 'Reseñas',                description: 'Puntuación y reseñas',                 icon: Star },
  { key: 'practicalInfo', label: 'Información práctica',   description: 'Check-in, mascotas, pagos…',           icon: Info },
  { key: 'location',      label: 'Ubicación',              description: 'Mapa, dirección, cómo llegar',         icon: MapPin },
  { key: 'booking',       label: 'Banner de reserva',      description: 'CTA de reserva',                       icon: Calendar },
  { key: 'memberOffers',  label: 'Ofertas para socios',    description: 'Beneficios LPMBE',                     icon: Crown },
  { key: 'social',        label: 'Redes sociales',         description: 'Enlaces a perfiles',                   icon: Share2 },
  { key: 'joinCTA',       label: 'Únete al Club',          description: 'Cierre con CTA',                       icon: Sparkles },
]

export const ALOJAMIENTO_PUBLIC_SECTION_KEYS = ALOJAMIENTO_PUBLIC_SECTIONS.map(
  (s) => s.key,
)
