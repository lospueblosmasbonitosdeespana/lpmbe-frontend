import {
  ImageIcon,
  ChefHat,
  Sparkles,
  BookOpen,
  Utensils,
  Camera,
  Clock,
  Calendar,
  MapPin,
  Gift,
  Share2,
  Crown,
} from 'lucide-react'

import type { SectionMeta } from '@/app/gestion/asociacion/negocios/[slug]/_editor-shared/SectionsLayoutEditor'

/**
 * Lista canónica de secciones que componen la **página pública** premium
 * de un restaurante / bar / bodega. El editor controla `_layout` sobre
 * estas claves; la pública aplica `landingConfig.v0._layout`.
 */
export const RESTAURANTE_PUBLIC_SECTIONS: SectionMeta[] = [
  { key: 'hero',              label: 'Portada (hero)',           description: 'Carrusel principal y datos clave',  icon: ImageIcon, required: true },
  { key: 'chef',              label: 'Chef',                     description: 'Foto, bio y stats',                  icon: ChefHat },
  { key: 'filosofia',         label: 'Filosofía / cocina',       description: 'Pilares de la cocina',               icon: Sparkles },
  { key: 'menus',             label: 'Menús',                    description: 'Carta y menús destacados',           icon: BookOpen },
  { key: 'platos',            label: 'Platos signature',         description: 'Imprescindibles',                    icon: Utensils },
  { key: 'ambiente',          label: 'Ambiente',                 description: 'Imágenes del local',                 icon: Camera },
  { key: 'infoPractica',      label: 'Información práctica',     description: 'Aforo, horario, dietas, mascotas',   icon: Clock },
  { key: 'reservaBanner',     label: 'Banner de reserva',        description: 'CTA principal de reserva',           icon: Calendar },
  { key: 'contactoUbicacion', label: 'Contacto y ubicación',     description: 'Mapa, dirección, cómo llegar',       icon: MapPin },
  { key: 'ofertas',           label: 'Ofertas socios',           description: 'Ventajas para socios LPMBE',         icon: Gift },
  { key: 'siguenos',          label: 'Síguenos / Redes',         description: 'Enlaces a redes sociales',           icon: Share2 },
  { key: 'becomeMember',      label: 'Únete al Club',            description: 'Cierre con CTA al Club',             icon: Crown },
]

export const RESTAURANTE_PUBLIC_SECTION_KEYS = RESTAURANTE_PUBLIC_SECTIONS.map(
  (s) => s.key,
)
