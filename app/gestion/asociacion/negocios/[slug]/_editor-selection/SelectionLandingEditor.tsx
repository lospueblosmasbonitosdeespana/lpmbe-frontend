'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import {
  Image as ImageIcon,
  BarChart3,
  BookOpen,
  Award,
  BedDouble,
  UtensilsCrossed,
  Waves,
  Images,
  Newspaper,
  MapPin,
  Compass,
  Gift,
  MessageSquare,
  Info,
  Phone,
  Star,
  Grid2x2,
  Download,
  Eye,
  RotateCcw,
  CheckCheck,
  ExternalLink,
} from 'lucide-react'

import { defaultHotelConfig } from '@/app/_components/selection/defaultConfig'
import type { HotelConfig } from '@/app/_components/selection/types'

import { SectionsLayoutEditor } from '../_editor-shared/SectionsLayoutEditor'
import {
  SELECTION_PUBLIC_SECTIONS,
  SELECTION_PUBLIC_SECTION_KEYS,
} from '@/app/_components/selection/selection-sections'
import {
  resolveLayout,
  type SectionLayoutItem,
} from '@/app/_lib/landing/sections-layout'

import { HeroEditor }            from './HeroEditor'
import { StatsEditor }           from './StatsEditor'
import { StoryEditor }           from './StoryEditor'
import { AwardsEditor }          from './AwardsEditor'
import { RoomsEditor }           from './RoomsEditor'
import { GastronomyEditor }      from './GastronomyEditor'
import { SpaEditor }             from './SpaEditor'
import { GalleryEditor }         from './GalleryEditor'
import { PressEditor }           from './PressEditor'
import { SurroundingsEditor }    from './SurroundingsEditor'
import { ExperiencesEditor }     from './ExperiencesEditor'
import { OffersEditor }          from './OffersEditor'
import { ReviewsEditor }         from './ReviewsEditor'
import { PracticalInfoEditor }   from './PracticalInfoEditor'
import { LocationContactEditor } from './LocationContactEditor'
import { SocialEditor }          from './SocialEditor'

interface SectionDef {
  key: string
  label: string
  description: string
  icon: React.ElementType
}

const SECTIONS: SectionDef[] = [
  { key: 'hero',          label: 'Hero',                 description: 'Portada cinematográfica, nombre y badges',           icon: ImageIcon       },
  { key: 'stats',         label: 'Estadísticas rápidas', description: 'Barra con datos clave (habitaciones, fundación...)', icon: BarChart3       },
  { key: 'story',         label: 'La historia',          description: 'Relato editorial con foto y cita destacada',         icon: BookOpen        },
  { key: 'awards',        label: 'Reconocimientos',      description: 'Premios, certificaciones y distinciones',            icon: Award           },
  { key: 'rooms',         label: 'Suites & Habitaciones', description: 'Carrusel de estancias con precios e imágenes',      icon: BedDouble       },
  { key: 'gastronomy',    label: 'Gastronomía',          description: 'Restaurante, chef y platos de autor',                icon: UtensilsCrossed },
  { key: 'spa',           label: 'Spa & Bienestar',      description: 'Zona wellness con tratamientos',                     icon: Waves           },
  { key: 'gallery',       label: 'Galería inmersiva',    description: 'Grid masonry con lightbox cinematográfico',          icon: Images          },
  { key: 'press',         label: 'En los medios',        description: 'Menciones en prensa internacional',                  icon: Newspaper       },
  { key: 'surroundings',  label: 'El entorno',           description: 'Puntos de interés cercanos',                         icon: MapPin          },
  { key: 'experiences',   label: 'Experiencias',         description: 'Actividades exclusivas del hotel y entorno',         icon: Compass         },
  { key: 'offers',        label: 'Ofertas Club LPMBE',   description: 'Descuentos exclusivos para socios',                  icon: Gift            },
  { key: 'reviews',       label: 'Opiniones',            description: 'Valoración global y testimonios',                    icon: MessageSquare   },
  { key: 'practicalInfo', label: 'Información práctica', description: 'Horarios, idiomas, parking, mascotas...',            icon: Info            },
  { key: 'location',      label: 'Ubicación y contacto', description: 'Dirección, teléfono y email para reservas',          icon: Phone           },
  { key: 'social',        label: 'Redes & Cobranding',   description: 'Footer con enlaces sociales y sello LPMBE',          icon: Star            },
]

interface Props {
  negocioId: number
  negocioNombre: string
  negocioSlug: string
  puebloSlug: string
  initialLandingConfig: any
  onSaved?: () => void
}

/**
 * Lee el HotelConfig de `landingConfig.v0`. Si está vacío, arranca con el
 * defaultHotelConfig (fotos y textos del Hotel & Spa Palacio de Cristal).
 * Mergea por sección para no perder nada si se añaden campos en el futuro.
 */
function parseInitial(raw: unknown): HotelConfig {
  if (!raw || typeof raw !== 'object') return defaultHotelConfig
  const v0 = (raw as { v0?: HotelConfig }).v0
  if (!v0 || typeof v0 !== 'object') return defaultHotelConfig
  return {
    ...defaultHotelConfig,
    ...v0,
    location: { ...defaultHotelConfig.location, ...(v0.location ?? {}) },
    story: { ...defaultHotelConfig.story, ...(v0.story ?? {}) },
    gastronomy: { ...defaultHotelConfig.gastronomy, ...(v0.gastronomy ?? {}) },
    spa: { ...defaultHotelConfig.spa, ...(v0.spa ?? {}) },
    reviews: { ...defaultHotelConfig.reviews, ...(v0.reviews ?? {}) },
    social: { ...defaultHotelConfig.social, ...(v0.social ?? {}) },
  }
}

export default function SelectionLandingEditor({
  negocioId,
  negocioNombre,
  negocioSlug,
  initialLandingConfig,
  onSaved,
}: Props) {
  const initialConfig = useMemo(() => parseInitial(initialLandingConfig), [initialLandingConfig])
  const initialLayout = useMemo(
    () =>
      resolveLayout(
        (initialLandingConfig as { v0?: { _layout?: unknown } } | null | undefined)
          ?.v0?._layout,
        SELECTION_PUBLIC_SECTION_KEYS,
      ),
    [initialLandingConfig],
  )

  const [config, setConfig] = useState<HotelConfig>(initialConfig)
  const [layout, setLayout] = useState<SectionLayoutItem[]>(initialLayout)
  const [showJson, setShowJson] = useState(false)
  const [saved, setSaved] = useState(false)
  const [openSection, setOpenSection] = useState<string>('_layout')

  const updateField = useCallback(
    <K extends keyof HotelConfig>(key: K, value: HotelConfig[K]) => {
      setSaved(false)
      setConfig(prev => ({ ...prev, [key]: value }))
    },
    [],
  )

  // Hero: agrupa name + tagline + heroImage + badges
  const heroValue = useMemo(
    () => ({
      name: config.name,
      tagline: config.tagline,
      heroImage: config.heroImage,
      badges: config.badges,
    }),
    [config.name, config.tagline, config.heroImage, config.badges],
  )

  const handleSave = async () => {
    try {
      const baseRaw =
        initialLandingConfig && typeof initialLandingConfig === 'object'
          ? initialLandingConfig
          : {}
      const merged = {
        ...baseRaw,
        template: 'selection',
        v0: { ...config, _layout: layout },
      }
      const res = await fetch(`/api/club/negocios/${negocioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landingConfig: merged }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      setSaved(true)
      onSaved?.()
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      alert('Error al guardar los cambios')
    }
  }

  const handleReset = () => {
    if (window.confirm('¿Restaurar la configuración predeterminada? Se perderán los cambios no guardados.')) {
      setConfig(defaultHotelConfig)
      setSaved(false)
    }
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `selection-${negocioSlug || 'config'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const previewUrl = `/selection/${negocioSlug}`

  // Selection usa una paleta dorada/oscura distinta a los otros editores
  const accent = 'oklch(0.72 0.10 80)' // gold suave
  const accentDark = 'oklch(0.45 0.10 75)'

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-52px)]">
      <main className="flex-1 min-w-0 py-8 px-4 md:px-8 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: 'oklch(0.22 0.04 250)', fontFamily: 'var(--font-serif)' }}
            >
              Editor Club LPMBE Selection
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'oklch(0.50 0.05 50)' }}>
              {negocioNombre}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(previewUrl, '_blank')}
              className="gap-1.5 text-xs"
              style={{ borderColor: accent, color: accentDark }}
            >
              <ExternalLink size={13} />
              Vista previa
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowJson(s => !s)}
              className="gap-1.5 text-xs"
              style={{ borderColor: accent, color: accentDark }}
            >
              <Eye size={13} />
              {showJson ? 'Ocultar JSON' : 'Ver JSON'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-1.5 text-xs"
              style={{ borderColor: accent, color: accentDark }}
            >
              <Download size={13} />
              Exportar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 text-xs"
              style={{ borderColor: accent, color: accentDark }}
            >
              <RotateCcw size={13} />
              Restablecer
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="gap-1.5 text-xs font-semibold"
              style={{
                background: saved ? 'oklch(0.55 0.14 145)' : 'oklch(0.30 0.04 250)',
                color: '#fff',
                border: 'none',
              }}
            >
              {saved ? <CheckCheck size={13} /> : null}
              {saved ? 'Guardado' : 'Guardar cambios'}
            </Button>
          </div>
        </div>

        <Accordion
          type="single"
          collapsible
          value={openSection}
          onValueChange={v => setOpenSection(v ?? '')}
          className="space-y-2"
        >
          {/* Visibilidad y orden de secciones */}
          <AccordionItem
            value="_layout"
            className="rounded-xl overflow-hidden border-0"
            style={{
              background: '#fff',
              boxShadow:
                openSection === '_layout'
                  ? `0 0 0 2px ${accent}, 0 4px 20px oklch(0.30 0.04 250 / 0.10)`
                  : '0 1px 4px oklch(0.30 0.04 250 / 0.06)',
            }}
          >
            <AccordionTrigger className="px-5 py-4 hover:no-underline group" style={{ textDecoration: 'none' }}>
              <div className="flex items-center gap-3 text-left">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                  style={{ background: openSection === '_layout' ? accent : `${accent} / 0.15` }}
                >
                  <Grid2x2
                    size={15}
                    style={{ color: openSection === '_layout' ? '#fff' : accentDark }}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none mb-0.5" style={{ color: 'oklch(0.25 0.04 250)' }}>
                    Visibilidad y orden de secciones
                  </p>
                  <p className="text-xs" style={{ color: 'oklch(0.55 0.05 50)' }}>
                    Decide qué bloques se muestran en tu página pública y en qué orden
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-6 pt-1">
              <div className="pt-4 border-t" style={{ borderColor: 'oklch(0.92 0.010 70)' }}>
                <SectionsLayoutEditor
                  sections={SELECTION_PUBLIC_SECTIONS}
                  value={layout}
                  onChange={setLayout}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {SECTIONS.map(({ key, label, description, icon: Icon }) => (
            <AccordionItem
              key={key}
              value={key}
              className="rounded-xl overflow-hidden border-0"
              style={{
                background: '#fff',
                boxShadow:
                  openSection === key
                    ? `0 0 0 2px ${accent}, 0 4px 20px oklch(0.30 0.04 250 / 0.10)`
                    : '0 1px 4px oklch(0.30 0.04 250 / 0.06)',
              }}
            >
              <AccordionTrigger
                className="px-5 py-4 hover:no-underline group"
                style={{ textDecoration: 'none' }}
              >
                <div className="flex items-center gap-3 text-left">
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                    style={{
                      background: openSection === key ? accent : `${accent} / 0.15`,
                    }}
                  >
                    <Icon
                      size={15}
                      style={{ color: openSection === key ? '#fff' : accentDark }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold leading-none mb-0.5"
                      style={{ color: 'oklch(0.25 0.04 250)' }}
                    >
                      {label}
                    </p>
                    <p className="text-xs" style={{ color: 'oklch(0.55 0.05 50)' }}>
                      {description}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-5 pb-6 pt-1">
                <div
                  className="pt-4 border-t"
                  style={{ borderColor: 'oklch(0.92 0.010 70)' }}
                >
                  {key === 'hero' && (
                    <HeroEditor
                      value={heroValue}
                      onChange={v => {
                        setSaved(false)
                        setConfig(prev => ({
                          ...prev,
                          name: v.name,
                          tagline: v.tagline,
                          heroImage: v.heroImage,
                          badges: v.badges,
                        }))
                      }}
                    />
                  )}
                  {key === 'stats'         && <StatsEditor          value={config.stats}         onChange={v => updateField('stats', v)} />}
                  {key === 'story'         && <StoryEditor          value={config.story}         onChange={v => updateField('story', v)} />}
                  {key === 'awards'        && <AwardsEditor         value={config.awards}        onChange={v => updateField('awards', v)} />}
                  {key === 'rooms'         && <RoomsEditor          value={config.rooms}         onChange={v => updateField('rooms', v)} />}
                  {key === 'gastronomy'    && <GastronomyEditor     value={config.gastronomy}    onChange={v => updateField('gastronomy', v)} />}
                  {key === 'spa'           && <SpaEditor            value={config.spa}           onChange={v => updateField('spa', v)} />}
                  {key === 'gallery'       && <GalleryEditor        value={config.gallery}       onChange={v => updateField('gallery', v)} />}
                  {key === 'press'         && <PressEditor          value={config.press}         onChange={v => updateField('press', v)} />}
                  {key === 'surroundings'  && <SurroundingsEditor   value={config.surroundings}  onChange={v => updateField('surroundings', v)} />}
                  {key === 'experiences'   && <ExperiencesEditor    value={config.experiences}   onChange={v => updateField('experiences', v)} />}
                  {key === 'offers'        && <OffersEditor         value={config.offers}        onChange={v => updateField('offers', v)} />}
                  {key === 'reviews'       && <ReviewsEditor        value={config.reviews}       onChange={v => updateField('reviews', v)} />}
                  {key === 'practicalInfo' && <PracticalInfoEditor  value={config.practicalInfo} onChange={v => updateField('practicalInfo', v)} />}
                  {key === 'location'      && <LocationContactEditor value={config.location}     onChange={v => updateField('location', v)} />}
                  {key === 'social'        && <SocialEditor         value={config.social}        onChange={v => updateField('social', v)} />}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>

      {showJson && (
        <aside
          className="w-full lg:w-[420px] shrink-0 border-l overflow-y-auto"
          style={{
            borderColor: 'oklch(0.88 0.015 70)',
            background: 'oklch(0.16 0.02 250)',
          }}
        >
          <div
            className="sticky top-0 flex items-center justify-between px-5 py-3 border-b"
            style={{ borderColor: 'oklch(0.25 0.03 250)', background: 'oklch(0.20 0.03 250)' }}
          >
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: accent }}>
              Vista previa JSON
            </p>
            <Badge
              className="text-xs"
              style={{ background: `${accent} / 0.20`, color: accent, border: 'none' }}
            >
              Selection · en tiempo real
            </Badge>
          </div>
          <pre
            className="p-5 text-xs leading-relaxed overflow-x-auto"
            style={{ color: 'oklch(0.85 0.04 80)', fontFamily: 'var(--font-mono, monospace)' }}
          >
            {JSON.stringify(config, null, 2)}
          </pre>
        </aside>
      )}
    </div>
  )
}

export { SelectionLandingEditor }
