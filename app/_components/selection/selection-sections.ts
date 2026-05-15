import { ImageIcon, BarChart3, BookOpen, Award, BedDouble, UtensilsCrossed, Waves, Images, Newspaper, MapPin, Compass, Gift, MessageSquare, Info, Phone, Star } from 'lucide-react'
import type { SectionMeta } from '@/app/gestion/asociacion/negocios/[slug]/_editor-shared/SectionsLayoutEditor'

export const SELECTION_PUBLIC_SECTIONS: SectionMeta[] = [
  { key: 'hero', label: 'Portada (hero)', description: 'Imagen cinematográfica + nombre + badges', icon: ImageIcon, required: true },
  { key: 'stats', label: 'Estadísticas rápidas', description: 'Barra con datos clave del negocio', icon: BarChart3 },
  { key: 'story', label: 'La historia (editorial)', description: 'Relato editorial con foto y cita', icon: BookOpen },
  { key: 'awards', label: 'Reconocimientos', description: 'Premios, certificaciones y distinciones', icon: Award },
  { key: 'rooms', label: 'Alojamiento / Suites', description: 'Carrusel de habitaciones con precios', icon: BedDouble },
  { key: 'gastronomy', label: 'Gastronomía', description: 'Restaurante, chef y platos de autor', icon: UtensilsCrossed },
  { key: 'spa', label: 'Spa & Bienestar', description: 'Zona wellness con tratamientos', icon: Waves },
  { key: 'gallery', label: 'Galería inmersiva', description: 'Grid masonry con lightbox', icon: Images },
  { key: 'press', label: 'En los medios', description: 'Menciones en prensa internacional', icon: Newspaper },
  { key: 'surroundings', label: 'El entorno', description: 'Puntos de interés cercanos con mapa', icon: MapPin },
  { key: 'experiences', label: 'Experiencias', description: 'Actividades exclusivas y del entorno', icon: Compass },
  { key: 'offers', label: 'Ofertas Club LPMBE', description: 'Descuentos exclusivos para socios', icon: Gift },
  { key: 'reviews', label: 'Opiniones', description: 'Valoraciones y testimonios', icon: MessageSquare },
  { key: 'practicalInfo', label: 'Información práctica', description: 'Horarios, idiomas, parking...', icon: Info },
  { key: 'booking', label: 'Reservas', description: 'Banner de contacto y reserva', icon: Phone },
  { key: 'footer', label: 'Footer cobranding', description: 'Pie con datos y sello LPMBE Selection', icon: Star },
]

export const SELECTION_PUBLIC_SECTION_KEYS = SELECTION_PUBLIC_SECTIONS.map((s) => s.key)
