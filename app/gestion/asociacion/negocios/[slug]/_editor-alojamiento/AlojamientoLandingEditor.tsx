'use client'

import { useState, useCallback } from 'react'
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
  BedDouble,
  Compass,
  Coffee,
  Grid2x2,
  Star,
  Info,
  MapPin,
  Calendar,
  Crown,
  Download,
  Eye,
  RotateCcw,
  CheckCheck,
  ExternalLink,
} from 'lucide-react'

import { defaultConfig } from './lodging-default-config'
import type { LodgingLandingConfig } from './lodging-types'

import { HeroEditor }          from './HeroEditor'
import { QuickStatsEditor }    from './QuickStatsEditor'
import { StoryEditor }         from './StoryEditor'
import { RoomsEditor }         from './RoomsEditor'
import { ExperiencesEditor }   from './ExperiencesEditor'
import { BreakfastEditor }     from './BreakfastEditor'
import { AmenitiesEditor }     from './AmenitiesEditor'
import { ReviewsEditor }       from './ReviewsEditor'
import { PracticalInfoEditor } from './PracticalInfoEditor'
import { LocationEditor }      from './LocationEditor'
import { BookingEditor }       from './BookingEditor'
import { MemberOffersEditor }  from './MemberOffersEditor'

// ─── Section definitions ──────────────────────────────────────────────────────

type SectionKey = keyof LodgingLandingConfig

interface SectionDef {
  key: SectionKey
  label: string
  description: string
  icon: React.ElementType
}

const SECTIONS: SectionDef[] = [
  { key: 'hero',          label: 'Hero',              description: 'Portada, eslogan y etiquetas',        icon: ImageIcon   },
  { key: 'quickStats',    label: 'Stats rápidas',     description: 'Check-in, habitaciones, precio…',     icon: BarChart3   },
  { key: 'story',         label: 'Historia',          description: 'Relato, párrafos y cita destacada',   icon: BookOpen    },
  { key: 'rooms',         label: 'Habitaciones',      description: 'Estancias, precios e imágenes',       icon: BedDouble   },
  { key: 'experiences',   label: 'Experiencias',      description: 'Actividades y precios',               icon: Compass     },
  { key: 'breakfast',     label: 'Desayuno',          description: 'Gastronomía, horario y destacados',   icon: Coffee      },
  { key: 'amenities',     label: 'Servicios',         description: 'Categorías y listado de amenities',   icon: Grid2x2     },
  { key: 'reviews',       label: 'Reseñas',           description: 'Puntuación global y reseñas',         icon: Star        },
  { key: 'practicalInfo', label: 'Info práctica',     description: 'Check-in, pagos, mascotas…',          icon: Info        },
  { key: 'location',      label: 'Ubicación',         description: 'Dirección, cómo llegar y puntos POI', icon: MapPin      },
  { key: 'booking',       label: 'Reserva',           description: 'Textos del banner de reserva',        icon: Calendar    },
  { key: 'memberOffers',  label: 'Ofertas Club',      description: 'Beneficios exclusivos para socios',   icon: Crown       },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  negocioId: number
  negocioNombre: string
  negocioSlug: string
  puebloSlug: string
  initialLandingConfig: any
  onSaved?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AlojamientoLandingEditor({
  negocioId,
  negocioNombre,
  negocioSlug,
  puebloSlug,
  initialLandingConfig,
  onSaved,
}: Props) {
  const [config, setConfig] = useState<LodgingLandingConfig>(initialLandingConfig ?? defaultConfig)
  const [showJson, setShowJson]     = useState(false)
  const [saved, setSaved]           = useState(false)
  const [openSection, setOpenSection] = useState<string>(SECTIONS[0].key)

  const update = useCallback(
    <K extends SectionKey>(key: K, value: LodgingLandingConfig[K]) => {
      setSaved(false)
      setConfig(prev => ({ ...prev, [key]: value }))
    },
    [],
  )

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/club/negocios/${negocioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landingConfig: config }),
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
      setConfig(initialLandingConfig ?? defaultConfig)
      setSaved(false)
    }
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'lodging-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const previewUrl = `/donde-dormir/${puebloSlug}/${negocioSlug}`

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-52px)]">
      {/* ── Left: editor panel ─────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 py-8 px-4 md:px-8 lg:px-10">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: 'oklch(0.25 0.06 50)', fontFamily: 'var(--font-serif)' }}
            >
              Editor de página de alojamiento
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'oklch(0.52 0.06 50)' }}>
              {negocioNombre}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(previewUrl, '_blank')}
              className="gap-1.5 text-xs"
              style={{ borderColor: 'oklch(0.78 0.10 60)', color: 'oklch(0.38 0.10 55)' }}
            >
              <ExternalLink size={13} />
              Vista previa
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowJson(s => !s)}
              className="gap-1.5 text-xs"
              style={{ borderColor: 'oklch(0.78 0.10 60)', color: 'oklch(0.38 0.10 55)' }}
            >
              <Eye size={13} />
              {showJson ? 'Ocultar JSON' : 'Ver JSON'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-1.5 text-xs"
              style={{ borderColor: 'oklch(0.78 0.10 60)', color: 'oklch(0.38 0.10 55)' }}
            >
              <Download size={13} />
              Exportar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 text-xs"
              style={{ borderColor: 'oklch(0.78 0.10 60)', color: 'oklch(0.38 0.10 55)' }}
            >
              <RotateCcw size={13} />
              Restablecer
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="gap-1.5 text-xs font-semibold"
              style={{
                background: saved ? 'oklch(0.55 0.14 145)' : 'oklch(0.52 0.12 60)',
                color: '#fff',
                border: 'none',
              }}
            >
              {saved ? <CheckCheck size={13} /> : null}
              {saved ? 'Guardado' : 'Guardar cambios'}
            </Button>
          </div>
        </div>

        {/* Accordion */}
        <Accordion
          type="single"
          collapsible
          value={openSection}
          onValueChange={v => setOpenSection(v ?? '')}
          className="space-y-2"
        >
          {SECTIONS.map(({ key, label, description, icon: Icon }) => (
            <AccordionItem
              key={key}
              value={key}
              className="rounded-xl overflow-hidden border-0"
              style={{
                background: '#fff',
                boxShadow: openSection === key
                  ? '0 0 0 2px oklch(0.72 0.16 60), 0 4px 20px oklch(0.52 0.12 60 / 0.12)'
                  : '0 1px 4px oklch(0.52 0.12 60 / 0.07)',
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
                      background: openSection === key
                        ? 'oklch(0.72 0.16 60)'
                        : 'oklch(0.72 0.16 60 / 0.12)',
                    }}
                  >
                    <Icon
                      size={15}
                      style={{ color: openSection === key ? '#fff' : 'oklch(0.42 0.12 55)' }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold leading-none mb-0.5"
                      style={{ color: 'oklch(0.28 0.07 50)' }}
                    >
                      {label}
                    </p>
                    <p className="text-xs" style={{ color: 'oklch(0.55 0.06 50)' }}>
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
                  {key === 'hero'          && <HeroEditor          value={config.hero}          onChange={v => update('hero', v)} />}
                  {key === 'quickStats'    && <QuickStatsEditor    value={config.quickStats}    onChange={v => update('quickStats', v)} />}
                  {key === 'story'         && <StoryEditor         value={config.story}         onChange={v => update('story', v)} />}
                  {key === 'rooms'         && <RoomsEditor         value={config.rooms}         onChange={v => update('rooms', v)} />}
                  {key === 'experiences'   && <ExperiencesEditor   value={config.experiences}   onChange={v => update('experiences', v)} />}
                  {key === 'breakfast'     && <BreakfastEditor     value={config.breakfast}     onChange={v => update('breakfast', v)} />}
                  {key === 'amenities'     && <AmenitiesEditor     value={config.amenities}     onChange={v => update('amenities', v)} />}
                  {key === 'reviews'       && <ReviewsEditor       value={config.reviews}       onChange={v => update('reviews', v)} />}
                  {key === 'practicalInfo' && <PracticalInfoEditor value={config.practicalInfo} onChange={v => update('practicalInfo', v)} />}
                  {key === 'location'      && <LocationEditor      value={config.location}      onChange={v => update('location', v)} />}
                  {key === 'booking'       && <BookingEditor       value={config.booking}       onChange={v => update('booking', v)} />}
                  {key === 'memberOffers'  && <MemberOffersEditor  value={config.memberOffers}  onChange={v => update('memberOffers', v)} />}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>

      {/* ── Right: JSON preview ─────────────────────────────────────────────── */}
      {showJson && (
        <aside
          className="w-full lg:w-[420px] shrink-0 border-l overflow-y-auto"
          style={{
            borderColor: 'oklch(0.88 0.015 70)',
            background: 'oklch(0.19 0.04 250)',
          }}
        >
          <div
            className="sticky top-0 flex items-center justify-between px-5 py-3 border-b"
            style={{ borderColor: 'oklch(0.28 0.04 250)', background: 'oklch(0.22 0.05 250)' }}
          >
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'oklch(0.65 0.08 60)' }}>
              Vista previa JSON
            </p>
            <Badge
              className="text-xs"
              style={{ background: 'oklch(0.65 0.08 60 / 0.20)', color: 'oklch(0.75 0.10 60)', border: 'none' }}
            >
              en tiempo real
            </Badge>
          </div>
          <pre
            className="p-5 text-xs leading-relaxed overflow-x-auto"
            style={{ color: 'oklch(0.82 0.04 250)', fontFamily: 'var(--font-mono, monospace)' }}
          >
            {JSON.stringify(config, null, 2)}
          </pre>
        </aside>
      )}
    </div>
  )
}

export { AlojamientoLandingEditor }
