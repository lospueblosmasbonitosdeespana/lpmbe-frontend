'use client'

import { useState, useMemo } from 'react'
import { 
  Mountain, Clock, Users, Award, MapPin, Calendar,
  Shield, Phone, Cross, HardHat, BadgeCheck, Check,
  Backpack, Anchor, Bike, Footprints, Binoculars,
  Gauge, Baby, Globe, XCircle, ShoppingBag,
  Car, Bus, Plane,
  Gift, Percent, Sparkles, Crown, Star,
  Plus, Trash2, Save, Eye, GripVertical, ImageIcon,
  ChevronRight
} from 'lucide-react'
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/app/components/ui/accordion'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { Label } from '@/app/components/ui/label'
import { Badge } from '@/app/components/ui/badge'
import { Switch } from '@/app/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { 
  ActivityLandingConfig, 
  defaultActivityConfig,
  StatIcon,
  ActivityCategory,
  Difficulty,
  SeasonKey,
  SafetyIcon,
  EquipmentIcon,
  PracticalIcon,
  DirectionIcon,
  OfferIcon
} from './activity-config'
import { SectionsLayoutEditor } from '../_editor-shared/SectionsLayoutEditor'
import { ImageUploadField } from '../_editor-shared/ImageUploadField'
import { ACTIVIDAD_PUBLIC_SECTIONS } from '@/app/_components/actividad/actividad-sections'
import {
  resolveLayout,
  type SectionLayoutItem,
} from '@/app/_lib/landing/sections-layout'

// Icon maps for selectors
const statIcons: Record<StatIcon, React.ReactNode> = {
  mountain: <Mountain className="h-4 w-4" />,
  clock: <Clock className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  award: <Award className="h-4 w-4" />,
  'map-pin': <MapPin className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
}

const categoryLabels: Record<ActivityCategory, string> = {
  senderismo: 'Senderismo',
  agua: 'Actividades acuáticas',
  nieve: 'Nieve',
  cultura: 'Cultural',
  btt: 'BTT / Ciclismo',
  aire: 'Actividades aéreas',
  otro: 'Otro',
}

const difficultyLabels: Record<Difficulty, string> = {
  facil: 'Fácil',
  moderada: 'Moderada',
  exigente: 'Exigente',
}

const seasonLabels: Record<SeasonKey, string> = {
  primavera: 'Primavera',
  verano: 'Verano',
  otono: 'Otoño',
  invierno: 'Invierno',
}

const safetyIconOptions: SafetyIcon[] = ['shield', 'phone', 'first-aid', 'helmet', 'license', 'check']
const equipmentIconOptions: EquipmentIcon[] = ['backpack', 'helmet', 'rope', 'paddle', 'bike', 'snowshoe', 'binoculars']
const practicalIconOptions: PracticalIcon[] = ['map-pin', 'clock', 'gauge', 'users', 'baby', 'globe', 'x-circle', 'shopping-bag']
const directionIconOptions: DirectionIcon[] = ['car', 'bus', 'plane']
const offerIconOptions: OfferIcon[] = ['gift', 'percent', 'sparkles', 'crown', 'star']

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  negocioId: number
  negocioNombre: string
  negocioSlug: string
  puebloSlug: string
  initialLandingConfig: any
  onSaved?: () => void
}

/**
 * El editor V0 vive bajo `landingConfig.v0` para no chocar con el schema
 * legacy en español que consume la página pública (ActividadPremiumDetail).
 * Si no existe, arrancamos con `defaultActivityConfig`.
 */
function parseInitial(raw: unknown): ActivityLandingConfig {
  if (!raw || typeof raw !== 'object') return defaultActivityConfig
  const v0 = (raw as { v0?: ActivityLandingConfig }).v0
  if (!v0 || typeof v0 !== 'object') return defaultActivityConfig
  if (!v0.hero && !v0.highlights && !v0.story) return defaultActivityConfig
  return { ...defaultActivityConfig, ...v0 }
}

export default function ActividadLandingEditor({
  negocioId,
  negocioNombre,
  negocioSlug,
  puebloSlug,
  initialLandingConfig,
  onSaved,
}: Props) {
  const initialConfig = useMemo(() => parseInitial(initialLandingConfig), [initialLandingConfig])
  const initialLayout = useMemo(
    () =>
      resolveLayout(
        (initialLandingConfig as { v0?: { _layout?: unknown } } | null | undefined)
          ?.v0?._layout,
        ACTIVIDAD_PUBLIC_SECTIONS.map((s) => s.key),
      ),
    [initialLandingConfig],
  )
  const [config, setConfig] = useState<ActivityLandingConfig>(initialConfig)
  const [layout, setLayout] = useState<SectionLayoutItem[]>(initialLayout)
  const [isSaving, setIsSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [openSections, setOpenSections] = useState<string[]>(['_layout'])

  const updateConfig = <K extends keyof ActivityLandingConfig>(
    section: K,
    updates: Partial<ActivityLandingConfig[K]>
  ) => {
    setSavedOk(false)
    setConfig(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }))
  }

  const previewUrl = puebloSlug && negocioSlug ? `/donde-comprar/${puebloSlug}/${negocioSlug}` : null

  const handlePreview = () => {
    if (previewUrl) window.open(previewUrl, '_blank')
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Mergeamos: preservamos campos legacy del raw original y guardamos
      // el config V0 íntegro bajo `v0`. Aún no tenemos adapter V0↔legacy
      // para actividad (la página pública lee el legacy del seed por ahora).
      const baseRaw =
        initialLandingConfig && typeof initialLandingConfig === 'object'
          ? initialLandingConfig
          : {}
      const merged = { ...baseRaw, v0: { ...config, _layout: layout } }
      const res = await fetch(`/api/club/negocios/${negocioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landingConfig: merged }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      setSavedOk(true)
      onSaved?.()
      setTimeout(() => setSavedOk(false), 3000)
    } catch (e) {
      alert('Error al guardar los cambios')
    } finally {
      setIsSaving(false)
    }
  }

  const generateId = () => Math.random().toString(36).substring(2, 9)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'oklch(0.98 0.01 80)' }}>
      {/* Header */}
      <header 
        className="sticky top-0 z-50 border-b shadow-sm"
        style={{ 
          backgroundColor: 'oklch(0.98 0.01 80)',
          borderColor: 'oklch(0.85 0.04 70)'
        }}
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: 'oklch(0.75 0.12 70)' }}
              >
                <Mountain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>
                  {negocioNombre}
                </h1>
                <p className="text-xs" style={{ color: 'oklch(0.50 0.02 250)' }}>
                  Editor de página premium · Aventura
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {previewUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handlePreview}
                  style={{
                    borderColor: 'oklch(0.75 0.12 70)',
                    color: 'oklch(0.45 0.10 70)'
                  }}
                >
                  <Eye className="h-4 w-4" />
                  Vista previa
                </Button>
              )}
              <Button
                size="sm"
                className="gap-2"
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  backgroundColor: savedOk ? 'oklch(0.55 0.14 145)' : 'oklch(0.65 0.14 70)',
                  color: 'white'
                }}
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Guardando...' : savedOk ? 'Guardado' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Accordion 
          type="multiple" 
          value={openSections}
          onValueChange={setOpenSections}
          className="space-y-4"
        >
          {/* Visibilidad y orden de secciones */}
          <AccordionItem
            value="_layout"
            className="rounded-lg border bg-white shadow-sm"
            style={{ borderColor: 'oklch(0.78 0.10 70)' }}
          >
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-md"
                  style={{ backgroundColor: 'oklch(0.92 0.06 70)' }}
                >
                  <GripVertical className="h-4 w-4" style={{ color: 'oklch(0.55 0.12 70)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>
                    Visibilidad y orden de secciones
                  </p>
                  <p className="text-xs" style={{ color: 'oklch(0.50 0.02 250)' }}>
                    Decide qué bloques se muestran en tu página pública y en qué orden
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <SectionsLayoutEditor
                sections={ACTIVIDAD_PUBLIC_SECTIONS}
                value={layout}
                onChange={setLayout}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Hero Section */}
          <AccordionItem 
            value="hero" 
            className="rounded-lg border bg-white shadow-sm"
            style={{ borderColor: 'oklch(0.90 0.02 70)' }}
          >
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="flex items-center gap-3">
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-md"
                  style={{ backgroundColor: 'oklch(0.92 0.04 70)' }}
                >
                  <ImageIcon className="h-4 w-4" style={{ color: 'oklch(0.55 0.12 70)' }} />
                </div>
                <div className="text-left">
                  <span className="font-medium" style={{ color: 'oklch(0.25 0.02 250)' }}>Hero</span>
                  <p className="text-xs" style={{ color: 'oklch(0.50 0.02 250)' }}>
                    Imagen/vídeo principal, eslogan y distintivos
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Eslogan principal</Label>
                    <Input
                      id="tagline"
                      value={config.hero.tagline}
                      onChange={e => updateConfig('hero', { tagline: e.target.value })}
                      placeholder="Descubre la aventura..."
                      maxLength={80}
                    />
                    <p className="text-xs text-muted-foreground">{config.hero.tagline.length}/80 caracteres</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="locationText">Ubicación</Label>
                    <Input
                      id="locationText"
                      value={config.hero.locationText}
                      onChange={e => updateConfig('hero', { locationText: e.target.value })}
                      placeholder="Aínsa · Huesca, Aragón"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="categoryLabel">Categoría</Label>
                    <Input
                      id="categoryLabel"
                      value={config.hero.categoryLabel}
                      onChange={e => updateConfig('hero', { categoryLabel: e.target.value })}
                      placeholder="Aventura y Naturaleza"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="videoUrl">URL del vídeo (opcional)</Label>
                    <Input
                      id="videoUrl"
                      value={config.hero.videoUrl || ''}
                      onChange={e => updateConfig('hero', { videoUrl: e.target.value || undefined })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <ImageUploadField
                  label="Imagen de fondo del hero"
                  hint="Imagen panorámica horizontal (1920×1080 recomendado)"
                  value={config.hero.posterImageUrl}
                  onChange={url => updateConfig('hero', { posterImageUrl: url })}
                  folder="negocios/actividad/hero"
                />
                
                {/* Badges */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Distintivos (máx. 4)</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (config.hero.badges.length < 4) {
                          updateConfig('hero', {
                            badges: [...config.hero.badges, { id: generateId(), text: '' }]
                          })
                        }
                      }}
                      disabled={config.hero.badges.length >= 4}
                      style={{ 
                        borderColor: 'oklch(0.75 0.12 70)',
                        color: 'oklch(0.45 0.10 70)'
                      }}
                    >
                      <Plus className="mr-1 h-3 w-3" /> Añadir
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {config.hero.badges.map((badge, idx) => (
                      <div key={badge.id} className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Input
                          value={badge.text}
                          onChange={e => {
                            const newBadges = [...config.hero.badges]
                            newBadges[idx] = { ...badge, text: e.target.value }
                            updateConfig('hero', { badges: newBadges })
                          }}
                          placeholder="Distintivo..."
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            updateConfig('hero', {
                              badges: config.hero.badges.filter(b => b.id !== badge.id)
                            })
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Highlights Section */}
          <AccordionItem 
            value="highlights" 
            className="rounded-lg border bg-white shadow-sm"
            style={{ borderColor: 'oklch(0.90 0.02 70)' }}
          >
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="flex items-center gap-3">
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-md"
                  style={{ backgroundColor: 'oklch(0.92 0.04 70)' }}
                >
                  <Award className="h-4 w-4" style={{ color: 'oklch(0.55 0.12 70)' }} />
                </div>
                <div className="text-left">
                  <span className="font-medium" style={{ color: 'oklch(0.25 0.02 250)' }}>Destacados</span>
                  <p className="text-xs" style={{ color: 'oklch(0.50 0.02 250)' }}>
                    Estadísticas y cifras clave
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Elementos destacados (máx. 6)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (config.highlights.items.length < 6) {
                        updateConfig('highlights', {
                          items: [...config.highlights.items, { 
                            id: generateId(), 
                            icon: 'mountain', 
                            label: '', 
                            detail: '' 
                          }]
                        })
                      }
                    }}
                    disabled={config.highlights.items.length >= 6}
                    style={{ 
                      borderColor: 'oklch(0.75 0.12 70)',
                      color: 'oklch(0.45 0.10 70)'
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Añadir
                  </Button>
                </div>
                <div className="space-y-3">
                  {config.highlights.items.map((item, idx) => (
                    <div key={item.id} className="flex items-start gap-2 rounded-lg border p-3" style={{ borderColor: 'oklch(0.92 0.02 70)' }}>
                      <GripVertical className="mt-2 h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <Select
                            value={item.icon}
                            onValueChange={(value: StatIcon) => {
                              const newItems = [...config.highlights.items]
                              newItems[idx] = { ...item, icon: value }
                              updateConfig('highlights', { items: newItems })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statIcons).map(([key, icon]) => (
                                <SelectItem key={key} value={key}>
                                  <span className="flex items-center gap-2">
                                    {icon}
                                    {key}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={item.label}
                            onChange={e => {
                              const newItems = [...config.highlights.items]
                              newItems[idx] = { ...item, label: e.target.value }
                              updateConfig('highlights', { items: newItems })
                            }}
                            placeholder="15+ rutas"
                          />
                          <Input
                            value={item.detail}
                            onChange={e => {
                              const newItems = [...config.highlights.items]
                              newItems[idx] = { ...item, detail: e.target.value }
                              updateConfig('highlights', { items: newItems })
                            }}
                            placeholder="por todo el Sobrarbe"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          updateConfig('highlights', {
                            items: config.highlights.items.filter(i => i.id !== item.id)
                          })
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Story Section */}
          <AccordionItem 
            value="story" 
            className="rounded-lg border bg-white shadow-sm"
            style={{ borderColor: 'oklch(0.90 0.02 70)' }}
          >
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="flex items-center gap-3">
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-md"
                  style={{ backgroundColor: 'oklch(0.92 0.04 70)' }}
                >
                  <BookIcon className="h-4 w-4" style={{ color: 'oklch(0.55 0.12 70)' }} />
                </div>
                <div className="text-left">
                  <span className="font-medium" style={{ color: 'oklch(0.25 0.02 250)' }}>Nuestra Historia</span>
                  <p className="text-xs" style={{ color: 'oklch(0.50 0.02 250)' }}>
                    Texto de presentación e imágenes
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="storyEyebrow">Encabezado</Label>
                    <Input
                      id="storyEyebrow"
                      value={config.story.eyebrow}
                      onChange={e => updateConfig('story', { eyebrow: e.target.value })}
                      placeholder="Nuestra historia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storyTitle">Título</Label>
                    <Input
                      id="storyTitle"
                      value={config.story.title}
                      onChange={e => updateConfig('story', { title: e.target.value })}
                      placeholder="Pasión por la montaña desde 2012"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Párrafos (2-3)</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (config.story.paragraphs.length < 3) {
                          updateConfig('story', {
                            paragraphs: [...config.story.paragraphs, '']
                          })
                        }
                      }}
                      disabled={config.story.paragraphs.length >= 3}
                      style={{ 
                        borderColor: 'oklch(0.75 0.12 70)',
                        color: 'oklch(0.45 0.10 70)'
                      }}
                    >
                      <Plus className="mr-1 h-3 w-3" /> Añadir párrafo
                    </Button>
                  </div>
                  {config.story.paragraphs.map((para, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Textarea
                        value={para}
                        onChange={e => {
                          const newParas = [...config.story.paragraphs]
                          newParas[idx] = e.target.value
                          updateConfig('story', { paragraphs: newParas })
                        }}
                        placeholder="Escribe un párrafo..."
                        maxLength={400}
                      />
                      {config.story.paragraphs.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            updateConfig('story', {
                              paragraphs: config.story.paragraphs.filter((_, i) => i !== idx)
                            })
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pullQuote">Cita destacada</Label>
                  <Textarea
                    id="pullQuote"
                    value={config.story.pullQuote}
                    onChange={e => updateConfig('story', { pullQuote: e.target.value })}
                    placeholder="La montaña no es solo un destino..."
                  />
                </div>

                <div className="space-y-3">
                  <Label>Imágenes (2)</Label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {config.story.images.map((img, idx) => (
                      <div key={img.id} className="space-y-2 rounded-lg border p-3" style={{ borderColor: 'oklch(0.92 0.02 70)' }}>
                        <ImageUploadField
                          label={`Imagen ${idx + 1}`}
                          value={img.url}
                          onChange={url => {
                            const newImages = [...config.story.images]
                            newImages[idx] = { ...img, url }
                            updateConfig('story', { images: newImages })
                          }}
                          folder="negocios/actividad/story"
                        />
                        <Input
                          value={img.alt}
                          onChange={e => {
                            const newImages = [...config.story.images]
                            newImages[idx] = { ...img, alt: e.target.value }
                            updateConfig('story', { images: newImages })
                          }}
                          placeholder="Texto alternativo"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Activities Section */}
          <AccordionItem 
            value="activities" 
            className="rounded-lg border bg-white shadow-sm"
            style={{ borderColor: 'oklch(0.90 0.02 70)' }}
          >
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="flex items-center gap-3">
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-md"
                  style={{ backgroundColor: 'oklch(0.92 0.04 70)' }}
                >
                  <Mountain className="h-4 w-4" style={{ color: 'oklch(0.55 0.12 70)' }} />
                </div>
                <div className="text-left">
                  <span className="font-medium" style={{ color: 'oklch(0.25 0.02 250)' }}>Actividades</span>
                  <p className="text-xs" style={{ color: 'oklch(0.50 0.02 250)' }}>
                    Catálogo de experiencias ofrecidas
                  </p>
                </div>
                <Badge variant="secondary" className="ml-2">{config.activities.items.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="activitiesEyebrow">Encabezado</Label>
                    <Input
                      id="activitiesEyebrow"
                      value={config.activities.eyebrow}
                      onChange={e => updateConfig('activities', { eyebrow: e.target.value })}
                      placeholder="Nuestras experiencias"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activitiesTitle">Título</Label>
                    <Input
                      id="activitiesTitle"
                      value={config.activities.title}
                      onChange={e => updateConfig('activities', { title: e.target.value })}
                      placeholder="Actividades para todos los niveles"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Actividades (máx. 12)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (config.activities.items.length < 12) {
                        updateConfig('activities', {
                          items: [...config.activities.items, {
                            id: generateId(),
                            title: '',
                            description: '',
                            category: 'senderismo',
                            difficulty: 'moderada',
                            durationLabel: '',
                            groupSizeLabel: '',
                            priceLabel: '',
                            imageUrl: '',
                          }]
                        })
                      }
                    }}
                    disabled={config.activities.items.length >= 12}
                    style={{ 
                      borderColor: 'oklch(0.75 0.12 70)',
                      color: 'oklch(0.45 0.10 70)'
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Añadir actividad
                  </Button>
                </div>

                <div className="space-y-4">
                  {config.activities.items.map((activity, idx) => (
                    <div 
                      key={activity.id} 
                      className="rounded-lg border p-4 space-y-4"
                      style={{ borderColor: 'oklch(0.90 0.02 70)' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium" style={{ color: 'oklch(0.35 0.02 250)' }}>
                            Actividad {idx + 1}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            updateConfig('activities', {
                              items: config.activities.items.filter(a => a.id !== activity.id)
                            })
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Título</Label>
                          <Input
                            value={activity.title}
                            onChange={e => {
                              const newItems = [...config.activities.items]
                              newItems[idx] = { ...activity, title: e.target.value }
                              updateConfig('activities', { items: newItems })
                            }}
                            placeholder="Ruta del Cañón de Añisclo"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Categoría</Label>
                          <Select
                            value={activity.category}
                            onValueChange={(value: ActivityCategory) => {
                              const newItems = [...config.activities.items]
                              newItems[idx] = { ...activity, category: value }
                              updateConfig('activities', { items: newItems })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(categoryLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Textarea
                          value={activity.description}
                          onChange={e => {
                            const newItems = [...config.activities.items]
                            newItems[idx] = { ...activity, description: e.target.value }
                            updateConfig('activities', { items: newItems })
                          }}
                          placeholder="Descripción breve de la actividad..."
                          maxLength={160}
                        />
                        <p className="text-xs text-muted-foreground">{activity.description.length}/160</p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-4">
                        <div className="space-y-2">
                          <Label>Dificultad</Label>
                          <Select
                            value={activity.difficulty}
                            onValueChange={(value: Difficulty) => {
                              const newItems = [...config.activities.items]
                              newItems[idx] = { ...activity, difficulty: value }
                              updateConfig('activities', { items: newItems })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(difficultyLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Duración</Label>
                          <Input
                            value={activity.durationLabel}
                            onChange={e => {
                              const newItems = [...config.activities.items]
                              newItems[idx] = { ...activity, durationLabel: e.target.value }
                              updateConfig('activities', { items: newItems })
                            }}
                            placeholder="5 h"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Grupo</Label>
                          <Input
                            value={activity.groupSizeLabel}
                            onChange={e => {
                              const newItems = [...config.activities.items]
                              newItems[idx] = { ...activity, groupSizeLabel: e.target.value }
                              updateConfig('activities', { items: newItems })
                            }}
                            placeholder="2-12 personas"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Precio</Label>
                          <Input
                            value={activity.priceLabel}
                            onChange={e => {
                              const newItems = [...config.activities.items]
                              newItems[idx] = { ...activity, priceLabel: e.target.value }
                              updateConfig('activities', { items: newItems })
                            }}
                            placeholder="Desde 45 €"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <ImageUploadField
                          label="Imagen de la actividad"
                          value={activity.imageUrl}
                          onChange={url => {
                            const newItems = [...config.activities.items]
                            newItems[idx] = { ...activity, imageUrl: url }
                            updateConfig('activities', { items: newItems })
                          }}
                          folder="negocios/actividad/activities"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Featured Experience Section */}
          <AccordionItem 
            value="featured" 
            className="rounded-lg border bg-white shadow-sm"
            style={{ borderColor: 'oklch(0.90 0.02 70)' }}
          >
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="flex items-center gap-3">
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-md"
                  style={{ backgroundColor: 'oklch(0.92 0.04 70)' }}
                >
                  <Star className="h-4 w-4" style={{ color: 'oklch(0.55 0.12 70)' }} />
                </div>
                <div className="text-left">
                  <span className="font-medium" style={{ color: 'oklch(0.25 0.02 250)' }}>Experiencia Destacada</span>
                  <p className="text-xs" style={{ color: 'oklch(0.50 0.02 250)' }}>
                    Sección especial para la experiencia estrella
                  </p>
                </div>
                {config.featured.enabled && (
                  <Badge style={{ backgroundColor: 'oklch(0.65 0.14 70)', color: 'white' }}>Activa</Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="featuredEnabled">Mostrar sección destacada</Label>
                  <Switch
                    id="featuredEnabled"
                    checked={config.featured.enabled}
                    onCheckedChange={checked => updateConfig('featured', { enabled: checked })}
                  />
                </div>

                {config.featured.enabled && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Encabezado</Label>
                        <Input
                          value={config.featured.eyebrow}
                          onChange={e => updateConfig('featured', { eyebrow: e.target.value })}
                          placeholder="Experiencia destacada"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                          value={config.featured.title}
                          onChange={e => updateConfig('featured', { title: e.target.value })}
                          placeholder="Travesía Ordesa - Monte Perdido"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Textarea
                        value={config.featured.description}
                        onChange={e => updateConfig('featured', { description: e.target.value })}
                        placeholder="Una aventura épica de 3 días..."
                        maxLength={400}
                      />
                      <p className="text-xs text-muted-foreground">{config.featured.description.length}/400</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Duración</Label>
                        <Input
                          value={config.featured.durationLabel}
                          onChange={e => updateConfig('featured', { durationLabel: e.target.value })}
                          placeholder="3 días"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Dificultad</Label>
                        <Select
                          value={config.featured.difficulty}
                          onValueChange={(value: Difficulty) => updateConfig('featured', { difficulty: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(difficultyLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Grupo</Label>
                        <Input
                          value={config.featured.groupSizeLabel}
                          onChange={e => updateConfig('featured', { groupSizeLabel: e.target.value })}
                          placeholder="4-8 personas"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Temporada</Label>
                        <Input
                          value={config.featured.seasonLabel}
                          onChange={e => updateConfig('featured', { seasonLabel: e.target.value })}
                          placeholder="Jun - Oct"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Precio</Label>
                        <Input
                          value={config.featured.priceLabel}
                          onChange={e => updateConfig('featured', { priceLabel: e.target.value })}
                          placeholder="Desde 295 €/persona"
                        />
                      </div>
                    </div>

                    <ImageUploadField
                      label="Imagen de la experiencia destacada"
                      value={config.featured.imageUrl}
                      onChange={url => updateConfig('featured', { imageUrl: url })}
                      folder="negocios/actividad/featured"
                    />
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Guides Section */}
          <AccordionItem 
            value="guides" 
            className="rounded-lg border bg-white shadow-sm"
            style={{ borderColor: 'oklch(0.90 0.02 70)' }}
          >
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="flex items-center gap-3">
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-md"
                  style={{ backgroundColor: 'oklch(0.92 0.04 70)' }}
                >
                  <Users className="h-4 w-4" style={{ color: 'oklch(0.55 0.12 70)' }} />
                </div>
                <div className="text-left">
                  <span className="font-medium" style={{ color: 'oklch(0.25 0.02 250)' }}>Equipo de Guías</span>
                  <p className="text-xs" style={{ color: 'oklch(0.50 0.02 250)' }}>
                    Perfiles del equipo profesional
                  </p>
                </div>
                <Badge variant="secondary" className="ml-2">{config.guides.members.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Encabezado</Label>
                    <Input
                      value={config.guides.eyebrow}
                      onChange={e => updateConfig('guides', { eyebrow: e.target.value })}
                      placeholder="Nuestro equipo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={config.guides.title}
                      onChange={e => updateConfig('guides', { title: e.target.value })}
                      placeholder="Guías apasionados"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Miembros del equipo (máx. 8)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (config.guides.members.length < 8) {
                        updateConfig('guides', {
                          members: [...config.guides.members, {
                            id: generateId(),
                            name: '',
                            role: '',
                            bio: '',
                            photoUrl: '',
                            certifications: [],
                          }]
                        })
                      }
                    }}
                    disabled={config.guides.members.length >= 8}
                    style={{ 
                      borderColor: 'oklch(0.75 0.12 70)',
                      color: 'oklch(0.45 0.10 70)'
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Añadir guía
                  </Button>
                </div>

                <div className="space-y-4">
                  {config.guides.members.map((member, idx) => (
                    <div 
                      key={member.id} 
                      className="rounded-lg border p-4 space-y-4"
                      style={{ borderColor: 'oklch(0.90 0.02 70)' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium" style={{ color: 'oklch(0.35 0.02 250)' }}>
                            Guía {idx + 1}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            updateConfig('guides', {
                              members: config.guides.members.filter(m => m.id !== member.id)
                            })
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Nombre</Label>
                          <Input
                            value={member.name}
                            onChange={e => {
                              const newMembers = [...config.guides.members]
                              newMembers[idx] = { ...member, name: e.target.value }
                              updateConfig('guides', { members: newMembers })
                            }}
                            placeholder="Carlos Martínez"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rol</Label>
                          <Input
                            value={member.role}
                            onChange={e => {
                              const newMembers = [...config.guides.members]
                              newMembers[idx] = { ...member, role: e.target.value }
                              updateConfig('guides', { members: newMembers })
                            }}
                            placeholder="Guía de montaña UIMLA"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Biografía breve</Label>
                        <Textarea
                          value={member.bio}
                          onChange={e => {
                            const newMembers = [...config.guides.members]
                            newMembers[idx] = { ...member, bio: e.target.value }
                            updateConfig('guides', { members: newMembers })
                          }}
                          placeholder="Breve descripción del guía..."
                          maxLength={140}
                        />
                        <p className="text-xs text-muted-foreground">{member.bio.length}/140</p>
                      </div>

                      <ImageUploadField
                        label="Foto del guía"
                        value={member.photoUrl}
                        onChange={url => {
                          const newMembers = [...config.guides.members]
                          newMembers[idx] = { ...member, photoUrl: url }
                          updateConfig('guides', { members: newMembers })
                        }}
                        folder="negocios/actividad/guides"
                        square
                      />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Certificaciones (máx. 4)</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (member.certifications.length < 4) {
                                const newMembers = [...config.guides.members]
                                newMembers[idx] = {
                                  ...member,
                                  certifications: [...member.certifications, { id: generateId(), text: '' }]
                                }
                                updateConfig('guides', { members: newMembers })
                              }
                            }}
                            disabled={member.certifications.length >= 4}
                            style={{ 
                              borderColor: 'oklch(0.85 0.04 70)',
                              color: 'oklch(0.50 0.06 70)'
                            }}
                          >
                            <Plus className="mr-1 h-3 w-3" /> Añadir
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {member.certifications.map((cert, certIdx) => (
                            <div key={cert.id} className="flex items-center gap-1">
                              <Input
                                className="w-40"
                                value={cert.text}
                                onChange={e => {
                                  const newMembers = [...config.guides.members]
                                  const newCerts = [...member.certifications]
                                  newCerts[certIdx] = { ...cert, text: e.target.value }
                                  newMembers[idx] = { ...member, certifications: newCerts }
                                  updateConfig('guides', { members: newMembers })
                                }}
                                placeholder="UIMLA"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  const newMembers = [...config.guides.members]
                                  newMembers[idx] = {
                                    ...member,
                                    certifications: member.certifications.filter(c => c.id !== cert.id)
                                  }
                                  updateConfig('guides', { members: newMembers })
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Seasons Section */}
          <AccordionItem 
            value="seasons" 
            className="rounded-lg border bg-white shadow-sm"
            style={{ borderColor: 'oklch(0.90 0.02 70)' }}
          >
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="flex items-center gap-3">
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-md"
                  style={{ backgroundColor: 'oklch(0.92 0.04 70)' }}
                >
                  <Calendar className="h-4 w-4" style={{ color: 'oklch(0.55 0.12 70)' }} />
                </div>
                <div className="text-left">
                  <span className="font-medium" style={{ color: 'oklch(0.25 0.02 250)' }}>Calendario Estacional</span>
                  <p className="text-xs" style={{ color: 'oklch(0.50 0.02 250)' }}>
                    Actividades por temporada
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Encabezado</Label>
                    <Input
                      value={config.seasons.eyebrow}
                      onChange={e => updateConfig('seasons', { eyebrow: e.target.value })}
                      placeholder="Todo el año"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={config.seasons.title}
                      onChange={e => updateConfig('seasons', { title: e.target.value })}
                      placeholder="Cada estación, una aventura diferente"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {config.seasons.items.map((season, idx) => (
                    <div 
                      key={season.id} 
                      className="rounded-lg border p-4 space-y-4"
                      style={{ borderColor: 'oklch(0.90 0.02 70)' }}
                    >
                      <div className="flex items-center gap-2">
                        <Badge style={{ backgroundColor: 'oklch(0.65 0.14 70)', color: 'white' }}>
                          {seasonLabels[season.season]}
                        </Badge>
                      </div>
                      
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Título</Label>
                          <Input
                            value={season.title}
                            onChange={e => {
                              const newItems = [...config.seasons.items]
                              newItems[idx] = { ...season, title: e.target.value }
                              updateConfig('seasons', { items: newItems })
                            }}
                            placeholder="Primavera explosiva"
                          />
                        </div>
                        <ImageUploadField
                          label="Imagen de la temporada"
                          value={season.imageUrl}
                          onChange={url => {
                            const newItems = [...config.seasons.items]
                            newItems[idx] = { ...season, imageUrl: url }
                            updateConfig('seasons', { items: newItems })
                          }}
                          folder="negocios/actividad/seasons"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Textarea
                          value={season.description}
                          onChange={e => {
                            const newItems = [...config.seasons.items]
                            newItems[idx] = { ...season, description: e.target.value }
                            updateConfig('seasons', { items: newItems })
                          }}
                          placeholder="Cascadas en pleno caudal y prados floridos."
                          maxLength={200}
                        />
                        <p className="text-xs text-muted-foreground">{season.description.length}/200</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Actividades destacadas (máx. 4)</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (season.featuredActivities.length < 4) {
                                const newItems = [...config.seasons.items]
                                newItems[idx] = {
                                  ...season,
                                  featuredActivities: [...season.featuredActivities, { id: generateId(), text: '' }]
                                }
                                updateConfig('seasons', { items: newItems })
                              }
                            }}
                            disabled={season.featuredActivities.length >= 4}
                            style={{ 
                              borderColor: 'oklch(0.85 0.04 70)',
                              color: 'oklch(0.50 0.06 70)'
                            }}
                          >
                            <Plus className="mr-1 h-3 w-3" /> Añadir
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {season.featuredActivities.map((act, actIdx) => (
                            <div key={act.id} className="flex items-center gap-1">
                              <Input
                                className="w-40"
                                value={act.text}
                                onChange={e => {
                                  const newItems = [...config.seasons.items]
                                  const newActs = [...season.featuredActivities]
                                  newActs[actIdx] = { ...act, text: e.target.value }
                                  newItems[idx] = { ...season, featuredActivities: newActs }
                                  updateConfig('seasons', { items: newItems })
                                }}
                                placeholder="Cañones acuáticos"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  const newItems = [...config.seasons.items]
                                  newItems[idx] = {
                                    ...season,
                                    featuredActivities: season.featuredActivities.filter(a => a.id !== act.id)
                                  }
                                  updateConfig('seasons', { items: newItems })
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Testimonials Section */}
          <AccordionItem 
            value="testimonials" 
            className="rounded-lg border bg-white shadow-sm"
            style={{ borderColor: 'oklch(0.90 0.02 70)' }}
          >
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="flex items-center gap-3">
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-md"
                  style={{ backgroundColor: 'oklch(0.92 0.04 70)' }}
                >
                  <MessageSquareIcon className="h-4 w-4" style={{ color: 'oklch(0.55 0.12 70)' }} />
                </div>
                <div className="text-left">
                  <span className="font-medium" style={{ color: 'oklch(0.25 0.02 250)' }}>Testimonios</span>
                  <p className="text-xs" style={{ color: 'oklch(0.50 0.02 250)' }}>
                    Opiniones de clientes
                  </p>
                </div>
                <Badge variant="secondary" className="ml-2">{config.testimonials.items.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Valoración media</Label>
                    <Input
                      value={config.testimonials.overallRating}
                      onChange={e => updateConfig('testimonials', { overallRating: e.target.value })}
                      placeholder="4.9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Número de reseñas</Label>
                    <Input
                      value={config.testimonials.totalReviews}
                      onChange={e => updateConfig('testimonials', { totalReviews: e.target.value })}
                      placeholder="89"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Testimonios (máx. 6)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (config.testimonials.items.length < 6) {
                        updateConfig('testimonials', {
                          items: [...config.testimonials.items, {
                            id: generateId(),
                            quote: '',
                            author: '',
                            origin: '',
                            stars: 5,
                            activity: '',
                            date: '',
                          }]
                        })
                      }
                    }}
                    disabled={config.testimonials.items.length >= 6}
                    style={{ 
                      borderColor: 'oklch(0.75 0.12 70)',
                      color: 'oklch(0.45 0.10 70)'
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Añadir testimonio
                  </Button>
                </div>

                <div className="space-y-4">
                  {config.testimonials.items.map((testimonial, idx) => (
                    <div 
                      key={testimonial.id} 
                      className="rounded-lg border p-4 space-y-4"
                      style={{ borderColor: 'oklch(0.90 0.02 70)' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium" style={{ color: 'oklch(0.35 0.02 250)' }}>
                            Testimonio {idx + 1}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            updateConfig('testimonials', {
                              items: config.testimonials.items.filter(t => t.id !== testimonial.id)
                            })
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Cita</Label>
                        <Textarea
                          value={testimonial.quote}
                          onChange={e => {
                            const newItems = [...config.testimonials.items]
                            newItems[idx] = { ...testimonial, quote: e.target.value }
                            updateConfig('testimonials', { items: newItems })
                          }}
                          placeholder="Una experiencia increíble..."
                          maxLength={320}
                        />
                        <p className="text-xs text-muted-foreground">{testimonial.quote.length}/320</p>
                      </div>
                      
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Autor</Label>
                          <Input
                            value={testimonial.author}
                            onChange={e => {
                              const newItems = [...config.testimonials.items]
                              newItems[idx] = { ...testimonial, author: e.target.value }
                              updateConfig('testimonials', { items: newItems })
                            }}
                            placeholder="María García"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Origen</Label>
                          <Input
                            value={testimonial.origin}
                            onChange={e => {
                              const newItems = [...config.testimonials.items]
                              newItems[idx] = { ...testimonial, origin: e.target.value }
                              updateConfig('testimonials', { items: newItems })
                            }}
                            placeholder="Madrid, España"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Estrellas</Label>
                          <Select
                            value={testimonial.stars.toString()}
                            onValueChange={value => {
                              const newItems = [...config.testimonials.items]
                              newItems[idx] = { ...testimonial, stars: parseInt(value) }
                              updateConfig('testimonials', { items: newItems })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map(n => (
                                <SelectItem key={n} value={n.toString()}>
                                  {'★'.repeat(n)}{'☆'.repeat(5 - n)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Actividad</Label>
                          <Input
                            value={testimonial.activity}
                            onChange={e => {
                              const newItems = [...config.testimonials.items]
                              newItems[idx] = { ...testimonial, activity: e.target.value }
                              updateConfig('testimonials', { items: newItems })
                            }}
                            placeholder="Cañón de Añisclo"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fecha</Label>
                          <Input
                            value={testimonial.date}
                            onChange={e => {
                              const newItems = [...config.testimonials.items]
                              newItems[idx] = { ...testimonial, date: e.target.value }
                              updateConfig('testimonials', { items: newItems })
                            }}
                            placeholder="Agosto 2024"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Safety Section */}
          <AccordionItem 
            value="safety" 
            className="rounded-lg border bg-white shadow-sm"
            style={{ borderColor: 'oklch(0.90 0.02 70)' }}
          >
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="flex items-center gap-3">
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-md"
                  style={{ backgroundColor: 'oklch(0.92 0.04 70)' }}
                >
                  <Shield className="h-4 w-4" style={{ color: 'oklch(0.55 0.12 70)' }} />
                </div>
                <div className="text-left">
                  <span className="font-medium" style={{ color: 'oklch(0.25 0.02 250)' }}>Seguridad y Equipamiento</span>
                  <p className="text-xs" style={{ color: 'oklch(0.50 0.02 250)' }}>
                    Medidas de seguridad y equipo incluido
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Encabezado</Label>
                    <Input
                      value={config.safety.eyebrow}
                      onChange={e => updateConfig('safety', { eyebrow: e.target.value })}
                      placeholder="Tu seguridad"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={config.safety.title}
                      onChange={e => updateConfig('safety', { title: e.target.value })}
                      placeholder="Seguridad y equipamiento"
                    />
                  </div>
                </div>

                {/* Safety Measures */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Medidas de seguridad (máx. 8)</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (config.safety.measures.length < 8) {
                          updateConfig('safety', {
                            measures: [...config.safety.measures, { id: generateId(), icon: 'shield', text: '' }]
                          })
                        }
                      }}
                      disabled={config.safety.measures.length >= 8}
                      style={{ 
                        borderColor: 'oklch(0.75 0.12 70)',
                        color: 'oklch(0.45 0.10 70)'
                      }}
                    >
                      <Plus className="mr-1 h-3 w-3" /> Añadir
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {config.safety.measures.map((measure, idx) => (
                      <div key={measure.id} className="flex items-center gap-2">
                        <Select
                          value={measure.icon}
                          onValueChange={(value: SafetyIcon) => {
                            const newMeasures = [...config.safety.measures]
                            newMeasures[idx] = { ...measure, icon: value }
                            updateConfig('safety', { measures: newMeasures })
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {safetyIconOptions.map(icon => (
                              <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          className="flex-1"
                          value={measure.text}
                          onChange={e => {
                            const newMeasures = [...config.safety.measures]
                            newMeasures[idx] = { ...measure, text: e.target.value }
                            updateConfig('safety', { measures: newMeasures })
                          }}
                          placeholder="Guías con certificación de primeros auxilios"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            updateConfig('safety', {
                              measures: config.safety.measures.filter(m => m.id !== measure.id)
                            })
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Equipment */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Equipamiento incluido (máx. 10)</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (config.safety.equipment.length < 10) {
                          updateConfig('safety', {
                            equipment: [...config.safety.equipment, { id: generateId(), icon: 'backpack', text: '' }]
                          })
                        }
                      }}
                      disabled={config.safety.equipment.length >= 10}
                      style={{ 
                        borderColor: 'oklch(0.75 0.12 70)',
                        color: 'oklch(0.45 0.10 70)'
                      }}
                    >
                      <Plus className="mr-1 h-3 w-3" /> Añadir
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {config.safety.equipment.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <Select
                          value={item.icon}
                          onValueChange={(value: EquipmentIcon) => {
                            const newEquipment = [...config.safety.equipment]
                            newEquipment[idx] = { ...item, icon: value }
                            updateConfig('safety', { equipment: newEquipment })
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {equipmentIconOptions.map(icon => (
                              <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          className="flex-1"
                          value={item.text}
                          onChange={e => {
                            const newEquipment = [...config.safety.equipment]
                            newEquipment[idx] = { ...item, text: e.target.value }
                            updateConfig('safety', { equipment: newEquipment })
                          }}
                          placeholder="Casco de montaña"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            updateConfig('safety', {
                              equipment: config.safety.equipment.filter(e => e.id !== item.id)
                            })
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nota de inclusión</Label>
                  <Input
                    value={config.safety.inclusionNote}
                    onChange={e => updateConfig('safety', { inclusionNote: e.target.value })}
                    placeholder="Todo incluido en el precio de la actividad"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Practical Info Section */}
          <AccordionItem 
            value="practicalInfo" 
            className="rounded-lg border bg-white shadow-sm"
            style={{ borderColor: 'oklch(0.90 0.02 70)' }}
          >
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="flex items-center gap-3">
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-md"
                  style={{ backgroundColor: 'oklch(0.92 0.04 70)' }}
                >
                  <InfoIcon className="h-4 w-4" style={{ color: 'oklch(0.55 0.12 70)' }} />
                </div>
                <div className="text-left">
                  <span className="font-medium" style={{ color: 'oklch(0.25 0.02 250)' }}>Información Práctica</span>
                  <p className="text-xs" style={{ color: 'oklch(0.50 0.02 250)' }}>
                    Detalles útiles para los visitantes
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Elementos informativos (máx. 8)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (config.practicalInfo.items.length < 8) {
                        updateConfig('practicalInfo', {
                          items: [...config.practicalInfo.items, { 
                            id: generateId(), 
                            icon: 'map-pin', 
                            label: '', 
                            detail: '' 
                          }]
                        })
                      }
                    }}
                    disabled={config.practicalInfo.items.length >= 8}
                    style={{ 
                      borderColor: 'oklch(0.75 0.12 70)',
                      color: 'oklch(0.45 0.10 70)'
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Añadir
                  </Button>
                </div>
                <div className="space-y-3">
                  {config.practicalInfo.items.map((item, idx) => (
                    <div key={item.id} className="flex items-start gap-2 rounded-lg border p-3" style={{ borderColor: 'oklch(0.92 0.02 70)' }}>
                      <div className="flex-1 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <Select
                            value={item.icon}
                            onValueChange={(value: PracticalIcon) => {
                              const newItems = [...config.practicalInfo.items]
                              newItems[idx] = { ...item, icon: value }
                              updateConfig('practicalInfo', { items: newItems })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {practicalIconOptions.map(icon => (
                                <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={item.label}
                            onChange={e => {
                              const newItems = [...config.practicalInfo.items]
                              newItems[idx] = { ...item, label: e.target.value }
                              updateConfig('practicalInfo', { items: newItems })
                            }}
                            placeholder="Punto de encuentro"
                          />
                          <Input
                            value={item.detail}
                            onChange={e => {
                              const newItems = [...config.practicalInfo.items]
                              newItems[idx] = { ...item, detail: e.target.value }
                              updateConfig('practicalInfo', { items: newItems })
                            }}
                            placeholder="Plaza Mayor de Aínsa"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          updateConfig('practicalInfo', {
                            items: config.practicalInfo.items.filter(i => i.id !== item.id)
                          })
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Location Section */}
          <AccordionItem 
            value="location" 
            className="rounded-lg border bg-white shadow-sm"
            style={{ borderColor: 'oklch(0.90 0.02 70)' }}
          >
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="flex items-center gap-3">
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-md"
                  style={{ backgroundColor: 'oklch(0.92 0.04 70)' }}
                >
                  <MapPin className="h-4 w-4" style={{ color: 'oklch(0.55 0.12 70)' }} />
                </div>
                <div className="text-left">
                  <span className="font-medium" style={{ color: 'oklch(0.25 0.02 250)' }}>Ubicación</span>
                  <p className="text-xs" style={{ color: 'oklch(0.50 0.02 250)' }}>
                    Cómo llegar y puntos de encuentro
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Dirección / Punto de encuentro</Label>
                  <Input
                    value={config.location.address}
                    onChange={e => updateConfig('location', { address: e.target.value })}
                    placeholder="Plaza Mayor, Aínsa, Huesca"
                  />
                </div>

                {/* Directions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Cómo llegar (máx. 3)</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (config.location.directions.length < 3) {
                          updateConfig('location', {
                            directions: [...config.location.directions, { 
                              id: generateId(), 
                              icon: 'car', 
                              title: '', 
                              content: '' 
                            }]
                          })
                        }
                      }}
                      disabled={config.location.directions.length >= 3}
                      style={{ 
                        borderColor: 'oklch(0.75 0.12 70)',
                        color: 'oklch(0.45 0.10 70)'
                      }}
                    >
                      <Plus className="mr-1 h-3 w-3" /> Añadir
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {config.location.directions.map((dir, idx) => (
                      <div key={dir.id} className="flex items-start gap-2 rounded-lg border p-3" style={{ borderColor: 'oklch(0.92 0.02 70)' }}>
                        <div className="flex-1 space-y-3">
                          <div className="grid gap-3 sm:grid-cols-3">
                            <Select
                              value={dir.icon}
                              onValueChange={(value: DirectionIcon) => {
                                const newDirs = [...config.location.directions]
                                newDirs[idx] = { ...dir, icon: value }
                                updateConfig('location', { directions: newDirs })
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {directionIconOptions.map(icon => (
                                  <SelectItem key={icon} value={icon}>
                                    <span className="flex items-center gap-2">
                                      {icon === 'car' && <Car className="h-4 w-4" />}
                                      {icon === 'bus' && <Bus className="h-4 w-4" />}
                                      {icon === 'plane' && <Plane className="h-4 w-4" />}
                                      {icon}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              value={dir.title}
                              onChange={e => {
                                const newDirs = [...config.location.directions]
                                newDirs[idx] = { ...dir, title: e.target.value }
                                updateConfig('location', { directions: newDirs })
                              }}
                              placeholder="En coche"
                            />
                          </div>
                          <Textarea
                            value={dir.content}
                            onChange={e => {
                              const newDirs = [...config.location.directions]
                              newDirs[idx] = { ...dir, content: e.target.value }
                              updateConfig('location', { directions: newDirs })
                            }}
                            placeholder="Desde Huesca, tomar la A-138..."
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            updateConfig('location', {
                              directions: config.location.directions.filter(d => d.id !== dir.id)
                            })
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nearby Meeting Points */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Puntos de encuentro cercanos (máx. 4)</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (config.location.nearbyMeetingPoints.length < 4) {
                          updateConfig('location', {
                            nearbyMeetingPoints: [...config.location.nearbyMeetingPoints, { 
                              id: generateId(), 
                              name: '', 
                              detail: '' 
                            }]
                          })
                        }
                      }}
                      disabled={config.location.nearbyMeetingPoints.length >= 4}
                      style={{ 
                        borderColor: 'oklch(0.75 0.12 70)',
                        color: 'oklch(0.45 0.10 70)'
                      }}
                    >
                      <Plus className="mr-1 h-3 w-3" /> Añadir
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {config.location.nearbyMeetingPoints.map((point, idx) => (
                      <div key={point.id} className="flex items-center gap-2">
                        <Input
                          value={point.name}
                          onChange={e => {
                            const newPoints = [...config.location.nearbyMeetingPoints]
                            newPoints[idx] = { ...point, name: e.target.value }
                            updateConfig('location', { nearbyMeetingPoints: newPoints })
                          }}
                          placeholder="Nombre del lugar"
                        />
                        <Input
                          value={point.detail}
                          onChange={e => {
                            const newPoints = [...config.location.nearbyMeetingPoints]
                            newPoints[idx] = { ...point, detail: e.target.value }
                            updateConfig('location', { nearbyMeetingPoints: newPoints })
                          }}
                          placeholder="Detalle / distancia"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            updateConfig('location', {
                              nearbyMeetingPoints: config.location.nearbyMeetingPoints.filter(p => p.id !== point.id)
                            })
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Booking Section */}
          <AccordionItem 
            value="booking" 
            className="rounded-lg border bg-white shadow-sm"
            style={{ borderColor: 'oklch(0.90 0.02 70)' }}
          >
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="flex items-center gap-3">
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-md"
                  style={{ backgroundColor: 'oklch(0.92 0.04 70)' }}
                >
                  <CalendarCheckIcon className="h-4 w-4" style={{ color: 'oklch(0.55 0.12 70)' }} />
                </div>
                <div className="text-left">
                  <span className="font-medium" style={{ color: 'oklch(0.25 0.02 250)' }}>Reservas</span>
                  <p className="text-xs" style={{ color: 'oklch(0.50 0.02 250)' }}>
                    Texto de llamada a la acción
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Encabezado</Label>
                    <Input
                      value={config.booking.eyebrow}
                      onChange={e => updateConfig('booking', { eyebrow: e.target.value })}
                      placeholder="¿Listo para la aventura?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={config.booking.title}
                      onChange={e => updateConfig('booking', { title: e.target.value })}
                      placeholder="Reserva tu experiencia"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subtítulo</Label>
                  <Input
                    value={config.booking.subtitle}
                    onChange={e => updateConfig('booking', { subtitle: e.target.value })}
                    placeholder="Grupos reducidos y atención personalizada"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Texto botón principal</Label>
                    <Input
                      value={config.booking.primaryCta}
                      onChange={e => updateConfig('booking', { primaryCta: e.target.value })}
                      placeholder="Reservar actividad"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Texto botón secundario</Label>
                    <Input
                      value={config.booking.secondaryCta}
                      onChange={e => updateConfig('booking', { secondaryCta: e.target.value })}
                      placeholder="Consultar disponibilidad"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nota para grupos</Label>
                  <Input
                    value={config.booking.groupNote}
                    onChange={e => updateConfig('booking', { groupNote: e.target.value })}
                    placeholder="Descuentos para grupos a partir de 8 personas"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Member Offers Section */}
          <AccordionItem 
            value="memberOffers" 
            className="rounded-lg border bg-white shadow-sm"
            style={{ borderColor: 'oklch(0.90 0.02 70)' }}
          >
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="flex items-center gap-3">
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-md"
                  style={{ backgroundColor: 'oklch(0.92 0.04 70)' }}
                >
                  <Gift className="h-4 w-4" style={{ color: 'oklch(0.55 0.12 70)' }} />
                </div>
                <div className="text-left">
                  <span className="font-medium" style={{ color: 'oklch(0.25 0.02 250)' }}>Ofertas para Socios</span>
                  <p className="text-xs" style={{ color: 'oklch(0.50 0.02 250)' }}>
                    Ventajas exclusivas LPMBE
                  </p>
                </div>
                <Badge variant="secondary" className="ml-2">{config.memberOffers.offers.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Encabezado</Label>
                    <Input
                      value={config.memberOffers.eyebrow}
                      onChange={e => updateConfig('memberOffers', { eyebrow: e.target.value })}
                      placeholder="Ofertas exclusivas LPMBE"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={config.memberOffers.title}
                      onChange={e => updateConfig('memberOffers', { title: e.target.value })}
                      placeholder="Ventajas para socios del club"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Ofertas (máx. 6)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (config.memberOffers.offers.length < 6) {
                        updateConfig('memberOffers', {
                          offers: [...config.memberOffers.offers, {
                            id: generateId(),
                            icon: 'gift',
                            badge: '',
                            title: '',
                            description: '',
                            conditions: '',
                            isFeatured: false,
                          }]
                        })
                      }
                    }}
                    disabled={config.memberOffers.offers.length >= 6}
                    style={{ 
                      borderColor: 'oklch(0.75 0.12 70)',
                      color: 'oklch(0.45 0.10 70)'
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Añadir oferta
                  </Button>
                </div>

                <div className="space-y-4">
                  {config.memberOffers.offers.map((offer, idx) => (
                    <div 
                      key={offer.id} 
                      className="rounded-lg border p-4 space-y-4"
                      style={{ 
                        borderColor: offer.isFeatured ? 'oklch(0.65 0.14 70)' : 'oklch(0.90 0.02 70)',
                        backgroundColor: offer.isFeatured ? 'oklch(0.98 0.02 70)' : 'transparent'
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium" style={{ color: 'oklch(0.35 0.02 250)' }}>
                            Oferta {idx + 1}
                          </span>
                          {offer.isFeatured && (
                            <Badge style={{ backgroundColor: 'oklch(0.65 0.14 70)', color: 'white' }}>
                              Destacada
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            updateConfig('memberOffers', {
                              offers: config.memberOffers.offers.filter(o => o.id !== offer.id)
                            })
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Icono</Label>
                          <Select
                            value={offer.icon}
                            onValueChange={(value: OfferIcon) => {
                              const newOffers = [...config.memberOffers.offers]
                              newOffers[idx] = { ...offer, icon: value }
                              updateConfig('memberOffers', { offers: newOffers })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {offerIconOptions.map(icon => (
                                <SelectItem key={icon} value={icon}>
                                  <span className="flex items-center gap-2">
                                    {icon === 'gift' && <Gift className="h-4 w-4" />}
                                    {icon === 'percent' && <Percent className="h-4 w-4" />}
                                    {icon === 'sparkles' && <Sparkles className="h-4 w-4" />}
                                    {icon === 'crown' && <Crown className="h-4 w-4" />}
                                    {icon === 'star' && <Star className="h-4 w-4" />}
                                    {icon}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Badge</Label>
                          <Input
                            value={offer.badge}
                            onChange={e => {
                              const newOffers = [...config.memberOffers.offers]
                              newOffers[idx] = { ...offer, badge: e.target.value }
                              updateConfig('memberOffers', { offers: newOffers })
                            }}
                            placeholder="10 %"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Título</Label>
                          <Input
                            value={offer.title}
                            onChange={e => {
                              const newOffers = [...config.memberOffers.offers]
                              newOffers[idx] = { ...offer, title: e.target.value }
                              updateConfig('memberOffers', { offers: newOffers })
                            }}
                            placeholder="Descuento en actividades"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Textarea
                          value={offer.description}
                          onChange={e => {
                            const newOffers = [...config.memberOffers.offers]
                            newOffers[idx] = { ...offer, description: e.target.value }
                            updateConfig('memberOffers', { offers: newOffers })
                          }}
                          placeholder="Descripción de la oferta..."
                          maxLength={200}
                        />
                        <p className="text-xs text-muted-foreground">{offer.description.length}/200</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Condiciones</Label>
                        <Input
                          value={offer.conditions}
                          onChange={e => {
                            const newOffers = [...config.memberOffers.offers]
                            newOffers[idx] = { ...offer, conditions: e.target.value }
                            updateConfig('memberOffers', { offers: newOffers })
                          }}
                          placeholder="Válido hasta fin de temporada"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor={`featured-${offer.id}`}>Marcar como destacada</Label>
                        <Switch
                          id={`featured-${offer.id}`}
                          checked={offer.isFeatured}
                          onCheckedChange={checked => {
                            const newOffers = [...config.memberOffers.offers]
                            newOffers[idx] = { ...offer, isFeatured: checked }
                            updateConfig('memberOffers', { offers: newOffers })
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Bottom Save Bar */}
        <div className="mt-8 flex justify-end gap-3">
          <Button 
            variant="outline"
            style={{ 
              borderColor: 'oklch(0.75 0.12 70)',
              color: 'oklch(0.45 0.10 70)'
            }}
          >
            Descartar cambios
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            style={{ 
              backgroundColor: 'oklch(0.65 0.14 70)',
              color: 'white'
            }}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </main>
    </div>
  )
}

// Custom icon components for missing icons
function BookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
    </svg>
  )
}

function MessageSquareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4"/>
      <path d="M12 8h.01"/>
    </svg>
  )
}

function CalendarCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
      <line x1="16" x2="16" y1="2" y2="6"/>
      <line x1="8" x2="8" y1="2" y2="6"/>
      <line x1="3" x2="21" y1="10" y2="10"/>
      <path d="m9 16 2 2 4-4"/>
    </svg>
  )
}
