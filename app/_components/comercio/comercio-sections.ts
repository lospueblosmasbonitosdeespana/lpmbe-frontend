import {
  ImageIcon,
  BarChart3,
  BookOpen,
  ShoppingBag,
  Cog,
  MapPin,
  Sparkles,
  Award,
  MessageSquare,
  Clock,
  Navigation,
  Phone,
  Gift,
  Share2,
  Mail,
} from 'lucide-react'

import type { SectionMeta } from '@/app/gestion/asociacion/negocios/[slug]/_editor-shared/SectionsLayoutEditor'

/**
 * Lista canónica de secciones que componen la **página pública** premium
 * de comercio / artesanía. El usuario decide cuáles mostrar y en qué
 * orden desde el editor; la pública aplica `landingConfig.v0._layout`
 * sobre estas claves.
 */
export const COMERCIO_PUBLIC_SECTIONS: SectionMeta[] = [
  { key: 'hero',          label: 'Portada (hero)',         description: 'Carrusel principal y título',          icon: ImageIcon,    required: true },
  { key: 'stats',         label: 'Stats rápidas',          description: 'Cifras destacadas del negocio',        icon: BarChart3 },
  { key: 'history',       label: 'Nuestra historia',       description: 'Texto, fotos y cita destacada',        icon: BookOpen },
  { key: 'products',      label: 'Productos destacados',   description: 'Catálogo con fotos, precio y CTA',     icon: ShoppingBag },
  { key: 'process',       label: 'El proceso',             description: 'Pasos de elaboración con foto',         icon: Cog },
  { key: 'obrador',       label: 'Nuestro obrador',        description: 'Imagen y descripción del lugar',        icon: MapPin },
  { key: 'experiences',   label: 'Experiencias',           description: 'Visitas y talleres para visitantes',   icon: Sparkles },
  { key: 'awards',        label: 'Premios y prensa',       description: 'Reconocimientos y citas',               icon: Award },
  { key: 'testimonials',  label: 'Testimonios',            description: 'Opiniones de clientes',                 icon: MessageSquare },
  { key: 'practicalInfo', label: 'Información práctica',   description: 'Horarios, pagos, envíos',               icon: Clock },
  { key: 'location',      label: 'Ubicación',              description: 'Dirección, mapa y cómo llegar',         icon: Navigation },
  { key: 'ctaReserva',    label: 'Banner de reserva',      description: 'CTA principal para reservas',           icon: Phone },
  { key: 'clubOffers',    label: 'Ofertas para socios',    description: 'Ventajas exclusivas LPMBE',             icon: Gift },
  { key: 'social',        label: 'Redes sociales',         description: 'Enlaces a perfiles',                    icon: Share2 },
  { key: 'clubCTA',       label: 'Cierre / Únete al Club', description: 'Llamada final a la acción',             icon: Mail },
]

export const COMERCIO_PUBLIC_SECTION_KEYS = COMERCIO_PUBLIC_SECTIONS.map(
  (s) => s.key,
)
