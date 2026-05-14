import {
  Mountain,
  Target,
  BookOpen,
  Compass,
  Star,
  Users,
  Calendar,
  MessageSquare,
  Shield,
  Info,
  MapPin,
  CalendarCheck,
  Crown,
  Sparkles,
} from 'lucide-react'

import type { SectionMeta } from '@/app/gestion/asociacion/negocios/[slug]/_editor-shared/SectionsLayoutEditor'

/**
 * Lista canónica de secciones que componen la **página pública** premium
 * de actividades / experiencias / aventura.
 */
export const ACTIVIDAD_PUBLIC_SECTIONS: SectionMeta[] = [
  { key: 'hero',          label: 'Portada (hero)',         description: 'Vídeo o imagen principal',           icon: Mountain, required: true },
  { key: 'highlights',    label: 'Destacados',             description: 'Stats clave de la actividad',        icon: Target },
  { key: 'aboutStory',    label: 'Historia / sobre',       description: 'Quiénes somos y qué hacemos',        icon: BookOpen },
  { key: 'activitiesGrid',label: 'Catálogo de actividades',description: 'Grid de actividades ofertadas',      icon: Compass },
  { key: 'featured',      label: 'Experiencia destacada',  description: 'La actividad estrella',              icon: Star },
  { key: 'guidesTeam',    label: 'Equipo de guías',        description: 'Profesionales que te acompañan',     icon: Users },
  { key: 'seasonCalendar',label: 'Calendario de temporada',description: 'Cuándo se hace cada actividad',      icon: Calendar },
  { key: 'testimonials',  label: 'Testimonios',            description: 'Opiniones de clientes',              icon: MessageSquare },
  { key: 'safety',        label: 'Seguridad y equipo',     description: 'Certificaciones y material',         icon: Shield },
  { key: 'practicalInfo', label: 'Información práctica',   description: 'Edad, idiomas, qué llevar…',         icon: Info },
  { key: 'location',      label: 'Ubicación',              description: 'Mapa y cómo llegar',                 icon: MapPin },
  { key: 'booking',       label: 'Banner de reserva',      description: 'CTA principal',                      icon: CalendarCheck },
  { key: 'memberOffers',  label: 'Ofertas para socios',    description: 'Beneficios LPMBE',                   icon: Crown },
  { key: 'joinCTA',       label: 'Únete al Club',          description: 'Cierre con CTA',                     icon: Sparkles },
]

export const ACTIVIDAD_PUBLIC_SECTION_KEYS = ACTIVIDAD_PUBLIC_SECTIONS.map(
  (s) => s.key,
)
