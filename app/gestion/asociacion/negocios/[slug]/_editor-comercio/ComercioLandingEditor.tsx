'use client'

import * as React from 'react'
import { useState, useCallback, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { uploadImageToR2 } from '@/src/lib/uploadHelper'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { Label } from '@/app/components/ui/label'
import { Switch } from '@/app/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Separator } from '@/app/components/ui/separator'
import { Slider } from '@/app/components/ui/slider'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog'
import {
  Building2,
  Image as ImageIcon,
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
  Phone as PhoneIcon,
  Gift,
  Share2,
  Mail,
  Plus,
  Trash2,
  GripVertical,
  ArrowLeft,
  Eye,
  Save,
  Check,
  X,
  Instagram,
  Facebook,
  Youtube,
  Music2,
  Globe,
  Star,
  Percent,
  Crown,
  Truck,
  Car,
  Bus,
  Upload,
  Loader2,
} from 'lucide-react'
import type {
  CommerceLandingConfig,
  HeroImage,
  Badge as BadgeType,
  Stat,
  StoryPhoto,
  Product,
  ProductBadge,
  ProcessStep,
  Experience,
  AwardLogo,
  PressQuote,
  Testimonial,
  HowToGet,
  MemberOffer,
  ScheduleDay,
} from './commerce-types'
import {
  BUSINESS_TYPES,
  LANGUAGES,
  PAYMENT_METHODS,
  PRODUCT_BADGES,
  HERO_BADGES,
  OFFER_ICONS,
  OFFER_BADGE_OPTIONS,
  HOW_TO_GET_ICONS,
} from './commerce-types'
import { defaultCommerceConfig, parseInitialConfig, generateId } from './commerce-default-config'
import { SectionsLayoutEditor } from '../_editor-shared/SectionsLayoutEditor'
import { COMERCIO_PUBLIC_SECTIONS } from '@/app/_components/comercio/comercio-sections'
import {
  resolveLayout,
  type SectionLayoutItem,
} from '@/app/_lib/landing/sections-layout'

// Dynamic import for Leaflet to avoid SSR issues
const MapPreview = dynamic(() => import('./MapPreview'), { ssr: false })

interface ComercioLandingEditorProps {
  negocioId: number
  negocioNombre: string
  negocioSlug: string
  puebloSlug: string
  initialLandingConfig: unknown
  onSaved?: () => void
  // Legacy / opcionales
  onSave?: (config: CommerceLandingConfig) => void | Promise<void>
  onBack?: () => void
  onPreview?: () => void
}

/**
 * El editor V0 vive bajo `landingConfig.v0` para no chocar con el schema legacy
 * (en español) que consume la página pública del comercio. Si no existe o no es
 * válido, arrancamos con `defaultCommerceConfig`.
 */
function parseV0(raw: unknown): CommerceLandingConfig {
  if (!raw || typeof raw !== 'object') return parseInitialConfig(undefined)
  const v0 = (raw as { v0?: unknown }).v0
  if (!v0 || typeof v0 !== 'object') return parseInitialConfig(undefined)
  return parseInitialConfig(v0)
}

// Section definition type
interface SectionDef {
  id: string
  title: string
  description: string
  icon: React.ElementType
}

// Sections configuration
const SECTIONS: SectionDef[] = [
  { id: 'identity', title: 'Identidad básica', description: 'Nombre, tipo de negocio, región', icon: Building2 },
  { id: 'hero', title: 'Hero', description: 'Imágenes del carrusel, títulos, CTAs', icon: ImageIcon },
  { id: 'stats', title: 'Stats rápidas', description: 'Cifras destacadas del negocio', icon: BarChart3 },
  { id: 'story', title: 'Nuestra historia', description: 'Texto, fotos y cita destacada', icon: BookOpen },
  { id: 'products', title: 'Productos destacados', description: 'Catálogo de productos', icon: ShoppingBag },
  { id: 'process', title: 'El proceso', description: '4 pasos de elaboración', icon: Cog },
  { id: 'place', title: 'Nuestro obrador', description: 'Imagen y descripción del lugar', icon: MapPin },
  { id: 'experiences', title: 'Experiencias', description: 'Visitas y talleres para visitantes', icon: Sparkles },
  { id: 'awards', title: 'Premios y prensa', description: 'Reconocimientos y citas', icon: Award },
  { id: 'testimonials', title: 'Testimonios', description: 'Opiniones de clientes', icon: MessageSquare },
  { id: 'practicalInfo', title: 'Información práctica', description: 'Horarios, pagos, envíos', icon: Clock },
  { id: 'location', title: 'Ubicación', description: 'Dirección, mapa, cómo llegar', icon: Navigation },
  { id: 'visitCta', title: 'Banner de visita', description: 'CTA principal para reservas', icon: PhoneIcon },
  { id: 'memberOffers', title: 'Ofertas socios LPMBE', description: 'Ventajas exclusivas', icon: Gift },
  { id: 'social', title: 'Redes sociales', description: 'Enlaces a perfiles', icon: Share2 },
  { id: 'contact', title: 'Contacto', description: 'Teléfono, email, WhatsApp', icon: Mail },
]

// Utility: Calculate section completion
function getSectionCompletion(section: string, config: CommerceLandingConfig): 'empty' | 'partial' | 'complete' {
  switch (section) {
    case 'identity':
      const id = config.identity
      const idFields = [id.businessName, id.tagline, id.businessType, id.region]
      const idFilled = idFields.filter(Boolean).length
      if (idFilled === 0) return 'empty'
      if (idFilled === idFields.length && id.foundedYear > 0) return 'complete'
      return 'partial'
    case 'hero':
      const h = config.hero
      if (h.images.length === 0 && !h.h1) return 'empty'
      if (h.images.length > 0 && h.h1 && h.primaryCta.text) return 'complete'
      return 'partial'
    case 'stats':
      if (config.stats.stats.length === 0) return 'empty'
      if (config.stats.stats.length >= 3) return 'complete'
      return 'partial'
    case 'story':
      const s = config.story
      if (!s.title && s.paragraphs.every(p => !p)) return 'empty'
      if (s.title && s.paragraphs.filter(Boolean).length >= 2) return 'complete'
      return 'partial'
    case 'products':
      if (config.products.products.length === 0) return 'empty'
      if (config.products.products.length >= 3) return 'complete'
      return 'partial'
    case 'process':
      const steps = config.process.steps
      if (steps.every(st => !st.title && !st.description)) return 'empty'
      if (steps.every(st => st.title && st.description)) return 'complete'
      return 'partial'
    case 'place':
      if (!config.place.showSection) return 'complete' // Hidden = complete
      if (!config.place.title && !config.place.description) return 'empty'
      if (config.place.title && config.place.description) return 'complete'
      return 'partial'
    case 'experiences':
      if (config.experiences.experiences.length === 0) return 'empty'
      if (config.experiences.experiences.length >= 2) return 'complete'
      return 'partial'
    case 'awards':
      if (config.awards.logos.length === 0 && config.awards.pressQuotes.length === 0) return 'empty'
      if (config.awards.logos.length > 0 || config.awards.pressQuotes.length > 0) return 'complete'
      return 'partial'
    case 'testimonials':
      if (config.testimonials.testimonials.length === 0) return 'empty'
      if (config.testimonials.testimonials.length >= 2) return 'complete'
      return 'partial'
    case 'practicalInfo':
      const pi = config.practicalInfo
      if (pi.schedule.every(d => !d.open) && pi.paymentMethods.length === 0) return 'empty'
      if (pi.schedule.some(d => d.open) && pi.paymentMethods.length > 0) return 'complete'
      return 'partial'
    case 'location':
      const loc = config.location
      if (!loc.address && !loc.locality) return 'empty'
      if (loc.address && loc.locality && loc.lat !== 0) return 'complete'
      return 'partial'
    case 'visitCta':
      const vc = config.visitCta
      if (!vc.title && !vc.primaryCta.text) return 'empty'
      if (vc.title && vc.primaryCta.text) return 'complete'
      return 'partial'
    case 'memberOffers':
      if (config.memberOffers.offers.length === 0) return 'empty'
      if (config.memberOffers.offers.length >= 2) return 'complete'
      return 'partial'
    case 'social':
      const soc = config.social
      const socFilled = [soc.instagram, soc.facebook, soc.web].filter(Boolean).length
      if (socFilled === 0) return 'empty'
      if (socFilled >= 2) return 'complete'
      return 'partial'
    case 'contact':
      const ct = config.contact
      if (!ct.phone && !ct.email) return 'empty'
      if (ct.phone && ct.email) return 'complete'
      return 'partial'
    default:
      return 'partial'
  }
}

// Calculate overall completion percentage
function getOverallCompletion(config: CommerceLandingConfig): number {
  let score = 0
  SECTIONS.forEach(sec => {
    const status = getSectionCompletion(sec.id, config)
    if (status === 'complete') score += 1
    else if (status === 'partial') score += 0.5
  })
  return Math.round((score / SECTIONS.length) * 100)
}

// Character counter component
function CharCounter({ current, max }: { current: number; max: number }) {
  const ratio = current / max
  let colorClass = 'text-muted-foreground'
  if (ratio >= 0.9 && ratio < 1) colorClass = 'text-amber-600'
  if (ratio >= 1) colorClass = 'text-destructive'
  return (
    <span className={`text-xs ${colorClass}`}>
      {current}/{max} caracteres
    </span>
  )
}

// Sortable item wrapper
function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-3 cursor-grab text-muted-foreground hover:text-foreground focus:outline-none"
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}

// Multi-chip select component
function ChipMultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Añadir...',
}: {
  label: string
  options: readonly string[]
  selected: string[]
  onChange: (val: string[]) => void
  placeholder?: string
}) {
  const [inputValue, setInputValue] = useState('')

  const addChip = (val: string) => {
    if (val && !selected.includes(val)) {
      onChange([...selected, val])
    }
    setInputValue('')
  }

  const removeChip = (val: string) => {
    onChange(selected.filter(v => v !== val))
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {selected.map(chip => (
          <Badge
            key={chip}
            variant="secondary"
            className="bg-copper/10 text-copper-light hover:bg-copper/20 px-2 py-1"
          >
            {chip}
            <button
              type="button"
              onClick={() => removeChip(chip)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Select value="" onValueChange={addChip}>
          <SelectTrigger className="w-auto min-w-[120px] h-7 text-xs">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options
              .filter(opt => !selected.includes(opt))
              .map(opt => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// Image input with R2 upload + preview
function ImageInput({
  label,
  value,
  onChange,
  altValue,
  onAltChange,
  className = '',
  folder = 'negocios/comercio',
}: {
  label: string
  value: string
  onChange: (val: string) => void
  altValue?: string
  onAltChange?: (val: string) => void
  className?: string
  folder?: string
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const { url } = await uploadImageToR2(file, folder)
      onChange(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error subiendo imagen')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />
      <div className="flex gap-3">
        {value ? (
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-border">
            <img src={value} alt={altValue || ''} className="h-full w-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-4 w-4 text-white animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => !uploading && inputRef.current?.click()}
            className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted hover:bg-muted/70 transition-colors"
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            )}
          </button>
        )}
        <div className="flex flex-1 flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 self-start"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            {uploading ? 'Subiendo a R2…' : value ? 'Cambiar imagen' : 'Subir a Cloudflare R2'}
          </Button>
          {onAltChange !== undefined && (
            <Input
              placeholder="Texto alternativo (alt)"
              value={altValue || ''}
              onChange={e => onAltChange(e.target.value)}
              className="text-xs h-8"
            />
          )}
          {error && <p className="text-[11px] text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  )
}

// Section header with completion indicator
function SectionHeader({ section, completion }: { section: SectionDef; completion: 'empty' | 'partial' | 'complete' }) {
  const Icon = section.icon
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-copper/10">
        <Icon className="h-5 w-5 text-copper" />
      </div>
      <div className="flex-1">
        <h3 className="font-serif text-base font-medium text-foreground">{section.title}</h3>
        <p className="text-xs text-muted-foreground">{section.description}</p>
      </div>
      <div
        className={`h-3 w-3 rounded-full ${
          completion === 'complete'
            ? 'bg-olive'
            : completion === 'partial'
            ? 'bg-copper'
            : 'border-2 border-border bg-transparent'
        }`}
      />
    </div>
  )
}

// Offer icon selector
function OfferIconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const icons: Record<string, React.ElementType> = {
    Gift,
    Percent,
    Sparkles,
    Crown,
    Star,
    ShoppingBag,
    Truck,
  }
  const Icon = icons[value] || Gift
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-20">
        <Icon className="h-4 w-4" />
      </SelectTrigger>
      <SelectContent>
        {OFFER_ICONS.map(icon => {
          const I = icons[icon]
          return (
            <SelectItem key={icon} value={icon}>
              <div className="flex items-center gap-2">
                <I className="h-4 w-4" />
                <span>{icon}</span>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

// How to get icon selector
function HowToGetIconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const icons: Record<string, React.ElementType> = { Car, Bus, MapPin }
  const Icon = icons[value] || MapPin
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-20">
        <Icon className="h-4 w-4" />
      </SelectTrigger>
      <SelectContent>
        {HOW_TO_GET_ICONS.map(icon => {
          const I = icons[icon]
          return (
            <SelectItem key={icon} value={icon}>
              <div className="flex items-center gap-2">
                <I className="h-4 w-4" />
                <span>{icon}</span>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

// Star rating slider
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex">
        {[1, 2, 3, 4, 5].map(n => (
          <Star
            key={n}
            className={`h-5 w-5 cursor-pointer ${
              n <= value ? 'fill-copper text-copper' : 'text-muted-foreground'
            }`}
            onClick={() => onChange(n)}
          />
        ))}
      </div>
      <Slider
        value={[value]}
        min={1}
        max={5}
        step={1}
        onValueChange={([v]) => onChange(v)}
        className="w-24"
      />
    </div>
  )
}

// Main Editor Component
export default function ComercioLandingEditor({
  negocioId,
  negocioNombre,
  negocioSlug,
  puebloSlug,
  initialLandingConfig,
  onSaved,
  onSave,
  onBack,
  onPreview,
}: ComercioLandingEditorProps) {
  // Parse initial config — leemos siempre de `landingConfig.v0` para no
  // pisar los campos legacy (en español) que usa la página pública.
  const [config, setConfig] = useState<CommerceLandingConfig>(() =>
    parseV0(initialLandingConfig)
  )
  const [originalConfig, setOriginalConfig] = useState<CommerceLandingConfig>(() =>
    parseV0(initialLandingConfig)
  )
  // Visibilidad y orden de las secciones de la PÁGINA PÚBLICA. Independiente
  // del orden de los acordeones de edición. Se guarda en `landingConfig.v0._layout`.
  const initialLayout = useMemo(
    () =>
      resolveLayout(
        (initialLandingConfig as { v0?: { _layout?: unknown } } | null | undefined)
          ?.v0?._layout,
        COMERCIO_PUBLIC_SECTIONS.map((s) => s.key),
      ),
    [initialLandingConfig],
  )
  const [layout, setLayout] = useState<SectionLayoutItem[]>(initialLayout)
  const [originalLayout, setOriginalLayout] = useState<SectionLayoutItem[]>(initialLayout)
  const [isSaving, setIsSaving] = useState(false)
  const [savedPill, setSavedPill] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ type: string; id: string } | null>(null)
  const [openSections, setOpenSections] = useState<string[]>(['_layout', 'identity'])

  const previewUrl = `/donde-comprar/${puebloSlug}/${negocioSlug}`

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Check if dirty
  const isDirty = useMemo(() => {
    return (
      JSON.stringify(config) !== JSON.stringify(originalConfig) ||
      JSON.stringify(layout) !== JSON.stringify(originalLayout)
    )
  }, [config, originalConfig, layout, originalLayout])

  // Completion percentage
  const completionPercent = useMemo(() => getOverallCompletion(config), [config])

  // Save handler — PATCH /api/club/negocios/:id mergeando `landingConfig.v0`
  // y preservando los campos legacy ya guardados.
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      if (onSave) {
        await onSave(config)
      } else {
        const baseRaw =
          initialLandingConfig && typeof initialLandingConfig === 'object'
            ? (initialLandingConfig as Record<string, unknown>)
            : {}
        const merged = {
          ...baseRaw,
          v0: { ...config, _layout: layout },
        }
        const res = await fetch(`/api/club/negocios/${negocioId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ landingConfig: merged }),
        })
        if (!res.ok) throw new Error('Error al guardar')
      }
      setOriginalConfig(config)
      setOriginalLayout(layout)
      setSavedPill(true)
      onSaved?.()
      setTimeout(() => setSavedPill(false), 2000)
    } catch (err) {
      console.error('[comercio-editor] Save error:', err)
      alert('Error al guardar los cambios')
    } finally {
      setIsSaving(false)
    }
  }, [config, layout, onSave, onSaved, negocioId, initialLandingConfig])

  // Generic update helper
  const updateConfig = useCallback(
    <K extends keyof CommerceLandingConfig>(
      section: K,
      updates: Partial<CommerceLandingConfig[K]>
    ) => {
      setConfig(prev => ({
        ...prev,
        [section]: { ...prev[section], ...updates },
      }))
    },
    []
  )

  // DnD handlers for various lists
  const handleDragEnd = useCallback(
    (
      event: DragEndEvent,
      section: keyof CommerceLandingConfig,
      listKey: string
    ) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      setConfig(prev => {
        const sectionData = prev[section] as unknown as Record<string, unknown[]>
        const items = [...(sectionData[listKey] as { id: string }[])]
        const oldIndex = items.findIndex(i => i.id === active.id)
        const newIndex = items.findIndex(i => i.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        return {
          ...prev,
          [section]: { ...sectionData, [listKey]: newItems },
        }
      })
    },
    []
  )

  // Delete confirmation handler
  const confirmDelete = useCallback(() => {
    if (!deleteDialog) return
    const { type, id } = deleteDialog

    setConfig(prev => {
      switch (type) {
        case 'heroImage':
          return {
            ...prev,
            hero: {
              ...prev.hero,
              images: prev.hero.images.filter(i => i.id !== id),
            },
          }
        case 'heroBadge':
          return {
            ...prev,
            hero: {
              ...prev.hero,
              badges: prev.hero.badges.filter(b => b.id !== id),
            },
          }
        case 'stat':
          return {
            ...prev,
            stats: {
              ...prev.stats,
              stats: prev.stats.stats.filter(s => s.id !== id),
            },
          }
        case 'storyPhoto':
          return {
            ...prev,
            story: {
              ...prev.story,
              photos: prev.story.photos.filter(p => p.id !== id),
            },
          }
        case 'product':
          return {
            ...prev,
            products: {
              ...prev.products,
              products: prev.products.products.filter(p => p.id !== id),
            },
          }
        case 'experience':
          return {
            ...prev,
            experiences: {
              ...prev.experiences,
              experiences: prev.experiences.experiences.filter(e => e.id !== id),
            },
          }
        case 'awardLogo':
          return {
            ...prev,
            awards: {
              ...prev.awards,
              logos: prev.awards.logos.filter(l => l.id !== id),
            },
          }
        case 'pressQuote':
          return {
            ...prev,
            awards: {
              ...prev.awards,
              pressQuotes: prev.awards.pressQuotes.filter(q => q.id !== id),
            },
          }
        case 'testimonial':
          return {
            ...prev,
            testimonials: {
              ...prev.testimonials,
              testimonials: prev.testimonials.testimonials.filter(t => t.id !== id),
            },
          }
        case 'howToGet':
          return {
            ...prev,
            location: {
              ...prev.location,
              howToGet: prev.location.howToGet.filter(h => h.id !== id),
            },
          }
        case 'memberOffer':
          return {
            ...prev,
            memberOffers: {
              ...prev.memberOffers,
              offers: prev.memberOffers.offers.filter(o => o.id !== id),
            },
          }
        default:
          return prev
      }
    })
    setDeleteDialog(null)
  }, [deleteDialog])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            {onBack ? (
              <>
                <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
                <Separator orientation="vertical" className="h-6" />
              </>
            ) : null}
            <div>
              <h1 className="font-serif text-lg font-semibold text-foreground">
                {negocioNombre || config.identity.businessName || 'Sin nombre'}
              </h1>
              <p className="text-xs text-muted-foreground">
                Editor de página premium · Comercio artesano
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => (onPreview ? onPreview() : window.open(previewUrl, '_blank'))}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Vista previa
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              {savedPill ? (
                <>
                  <Check className="h-4 w-4" />
                  <span className="rounded-full bg-olive px-2 py-0.5 text-xs text-primary-foreground">
                    Guardado ✓
                  </span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar cambios
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="space-y-3"
        >
          {/* 0. Visibilidad y orden de secciones (público) */}
          <AccordionItem value="_layout" className="rounded-xl border border-amber-200 bg-amber-50/40">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <GripVertical className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Visibilidad y orden de secciones</p>
                  <p className="text-xs text-muted-foreground">
                    Decide qué bloques se muestran en tu página pública y en qué orden
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <SectionsLayoutEditor
                sections={COMERCIO_PUBLIC_SECTIONS}
                value={layout}
                onChange={setLayout}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 1. Identity Section */}
          <AccordionItem value="identity" className="rounded-xl border border-border bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionHeader
                section={SECTIONS[0]}
                completion={getSectionCompletion('identity', config)}
              />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Nombre comercial</Label>
                  <Input
                    id="businessName"
                    value={config.identity.businessName}
                    onChange={e =>
                      updateConfig('identity', { businessName: e.target.value })
                    }
                    placeholder="Ej: Quesos del Pirineo Pardo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessType">Tipo de negocio</Label>
                  <Select
                    value={config.identity.businessType}
                    onValueChange={v => updateConfig('identity', { businessType: v })}
                  >
                    <SelectTrigger id="businessType">
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Textarea
                    id="tagline"
                    value={config.identity.tagline}
                    onChange={e =>
                      updateConfig('identity', {
                        tagline: e.target.value.slice(0, 120),
                      })
                    }
                    placeholder="Descripción breve del negocio"
                    maxLength={120}
                    rows={2}
                  />
                  <CharCounter current={config.identity.tagline.length} max={120} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="foundedYear">Año de fundación</Label>
                  <Input
                    id="foundedYear"
                    type="number"
                    value={config.identity.foundedYear || ''}
                    onChange={e =>
                      updateConfig('identity', {
                        foundedYear: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Ej: 1987"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Comarca / Región</Label>
                  <Input
                    id="region"
                    value={config.identity.region}
                    onChange={e => updateConfig('identity', { region: e.target.value })}
                    placeholder="Ej: Sobrarbe, Huesca"
                  />
                </div>
                <div className="md:col-span-2">
                  <ChipMultiSelect
                    label="Idiomas en los que se atiende"
                    options={LANGUAGES}
                    selected={config.identity.languages}
                    onChange={languages => updateConfig('identity', { languages })}
                    placeholder="+ Añadir idioma"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 2. Hero Section */}
          <AccordionItem value="hero" className="rounded-xl border border-border bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionHeader
                section={SECTIONS[1]}
                completion={getSectionCompletion('hero', config)}
              />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-6">
                {/* Hero Images */}
                <div className="space-y-3">
                  <Label>Imágenes del carrusel (1–5)</Label>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={e => handleDragEnd(e, 'hero', 'images')}
                  >
                    <SortableContext
                      items={config.hero.images.map(i => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {config.hero.images.map((img, idx) => (
                        <SortableItem key={img.id} id={img.id}>
                          <Card className="p-3">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <ImageInput
                                  label={`Imagen ${idx + 1}`}
                                  value={img.url}
                                  onChange={url => {
                                    const newImages = [...config.hero.images]
                                    newImages[idx] = { ...img, url }
                                    updateConfig('hero', { images: newImages })
                                  }}
                                  altValue={img.alt}
                                  onAltChange={alt => {
                                    const newImages = [...config.hero.images]
                                    newImages[idx] = { ...img, alt }
                                    updateConfig('hero', { images: newImages })
                                  }}
                                  folder="negocios/comercio/hero"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() =>
                                  setDeleteDialog({ type: 'heroImage', id: img.id })
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </Card>
                        </SortableItem>
                      ))}
                    </SortableContext>
                  </DndContext>
                  {config.hero.images.length < 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed"
                      onClick={() => {
                        const newImage: HeroImage = {
                          id: generateId('hero'),
                          url: '',
                          alt: '',
                          order: config.hero.images.length,
                        }
                        updateConfig('hero', {
                          images: [...config.hero.images, newImage],
                        })
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Añadir imagen
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Hero Text */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="heroH1">H1 / Nombre</Label>
                    <Input
                      id="heroH1"
                      value={config.hero.h1}
                      onChange={e => updateConfig('hero', { h1: e.target.value })}
                      placeholder="Título principal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heroTagline">Tagline (cursiva)</Label>
                    <Input
                      id="heroTagline"
                      value={config.hero.taglineItalic}
                      onChange={e =>
                        updateConfig('hero', { taglineItalic: e.target.value })
                      }
                      placeholder="Subtítulo en cursiva"
                    />
                  </div>
                </div>

                {/* Hero Badges */}
                <div className="space-y-3">
                  <Label>Badges (hasta 4)</Label>
                  <div className="flex flex-wrap gap-2">
                    {config.hero.badges.map((badge, idx) => (
                      <Badge
                        key={badge.id}
                        variant="secondary"
                        className="bg-copper/10 px-3 py-1"
                      >
                        <Input
                          value={badge.text}
                          onChange={e => {
                            const newBadges = [...config.hero.badges]
                            newBadges[idx] = { ...badge, text: e.target.value }
                            updateConfig('hero', { badges: newBadges })
                          }}
                          className="h-6 w-auto min-w-[100px] border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteDialog({ type: 'heroBadge', id: badge.id })
                          }
                          className="ml-1 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {config.hero.badges.length < 4 && (
                      <Select
                        value=""
                        onValueChange={v => {
                          const newBadge: BadgeType = {
                            id: generateId('badge'),
                            text: v,
                          }
                          updateConfig('hero', {
                            badges: [...config.hero.badges, newBadge],
                          })
                        }}
                      >
                        <SelectTrigger className="h-7 w-auto min-w-[120px]">
                          <Plus className="mr-1 h-3 w-3" />
                          <span className="text-xs">Añadir badge</span>
                        </SelectTrigger>
                        <SelectContent>
                          {HERO_BADGES.filter(
                            b => !config.hero.badges.some(hb => hb.text === b)
                          ).map(b => (
                            <SelectItem key={b} value={b}>
                              {b}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <Separator />

                {/* CTAs */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>CTA primario</Label>
                    <Input
                      value={config.hero.primaryCta.text}
                      onChange={e =>
                        updateConfig('hero', {
                          primaryCta: { ...config.hero.primaryCta, text: e.target.value },
                        })
                      }
                      placeholder="Texto del botón"
                    />
                    <Input
                      value={config.hero.primaryCta.url}
                      onChange={e =>
                        updateConfig('hero', {
                          primaryCta: { ...config.hero.primaryCta, url: e.target.value },
                        })
                      }
                      placeholder="URL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA secundario</Label>
                    <Input
                      value={config.hero.secondaryCta.text}
                      onChange={e =>
                        updateConfig('hero', {
                          secondaryCta: {
                            ...config.hero.secondaryCta,
                            text: e.target.value,
                          },
                        })
                      }
                      placeholder="Texto del botón"
                    />
                    <Input
                      value={config.hero.secondaryCta.url}
                      onChange={e =>
                        updateConfig('hero', {
                          secondaryCta: {
                            ...config.hero.secondaryCta,
                            url: e.target.value,
                          },
                        })
                      }
                      placeholder="URL"
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 3. Stats Section */}
          <AccordionItem value="stats" className="rounded-xl border border-border bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionHeader
                section={SECTIONS[2]}
                completion={getSectionCompletion('stats', config)}
              />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                <Label>Stats (hasta 5)</Label>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={e => handleDragEnd(e, 'stats', 'stats')}
                >
                  <SortableContext
                    items={config.stats.stats.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {config.stats.stats.map((stat, idx) => (
                      <SortableItem key={stat.id} id={stat.id}>
                        <Card className="p-3">
                          <div className="flex items-center gap-3">
                            <Input
                              value={stat.number}
                              onChange={e => {
                                const newStats = [...config.stats.stats]
                                newStats[idx] = { ...stat, number: e.target.value }
                                updateConfig('stats', { stats: newStats })
                              }}
                              placeholder="37"
                              className="w-24 text-center font-serif text-lg font-bold"
                            />
                            <Input
                              value={stat.label}
                              onChange={e => {
                                const newStats = [...config.stats.stats]
                                newStats[idx] = { ...stat, label: e.target.value }
                                updateConfig('stats', { stats: newStats })
                              }}
                              placeholder="Años de tradición"
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteDialog({ type: 'stat', id: stat.id })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      </SortableItem>
                    ))}
                  </SortableContext>
                </DndContext>
                {config.stats.stats.length < 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed"
                    onClick={() => {
                      const newStat: Stat = {
                        id: generateId('stat'),
                        number: '',
                        label: '',
                      }
                      updateConfig('stats', {
                        stats: [...config.stats.stats, newStat],
                      })
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir stat
                  </Button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 4. Story Section */}
          <AccordionItem value="story" className="rounded-xl border border-border bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionHeader
                section={SECTIONS[3]}
                completion={getSectionCompletion('story', config)}
              />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="storyEyebrow">Eyebrow</Label>
                    <Input
                      id="storyEyebrow"
                      value={config.story.eyebrow}
                      onChange={e =>
                        updateConfig('story', { eyebrow: e.target.value })
                      }
                      placeholder="El oficio"
                      className="uppercase tracking-wider"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storyTitle">Título</Label>
                    <Input
                      id="storyTitle"
                      value={config.story.title}
                      onChange={e => updateConfig('story', { title: e.target.value })}
                      placeholder="Nuestra historia"
                    />
                  </div>
                </div>

                {/* Paragraphs */}
                <div className="space-y-3">
                  <Label>Párrafos (2–4)</Label>
                  {config.story.paragraphs.map((para, idx) => (
                    <div key={idx} className="space-y-1">
                      <Textarea
                        value={para}
                        onChange={e => {
                          const newParagraphs = [...config.story.paragraphs]
                          newParagraphs[idx] = e.target.value
                          updateConfig('story', { paragraphs: newParagraphs })
                        }}
                        placeholder={`Párrafo ${idx + 1}`}
                        rows={3}
                      />
                    </div>
                  ))}
                  {config.story.paragraphs.length < 4 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-dashed"
                      onClick={() => {
                        updateConfig('story', {
                          paragraphs: [...config.story.paragraphs, ''],
                        })
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Añadir párrafo
                    </Button>
                  )}
                </div>

                {/* Pull Quote */}
                <div className="space-y-2">
                  <Label htmlFor="pullQuote">Cita destacada</Label>
                  <Textarea
                    id="pullQuote"
                    value={config.story.pullQuote}
                    onChange={e =>
                      updateConfig('story', {
                        pullQuote: e.target.value.slice(0, 200),
                      })
                    }
                    placeholder="Una frase memorable..."
                    maxLength={200}
                    rows={2}
                    className="italic"
                  />
                  <CharCounter current={config.story.pullQuote.length} max={200} />
                </div>

                <Separator />

                {/* Story Photos */}
                <div className="space-y-3">
                  <Label>Fotos con año (3)</Label>
                  <div className="grid gap-3 md:grid-cols-3">
                    {config.story.photos.map((photo, idx) => (
                      <Card key={photo.id} className="p-3">
                        <div className="space-y-2">
                          {photo.url ? (
                            <img
                              src={photo.url}
                              alt={photo.alt}
                              className="h-32 w-full rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-32 items-center justify-center rounded-lg bg-muted">
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <Input
                            value={photo.url}
                            onChange={e => {
                              const newPhotos = [...config.story.photos]
                              newPhotos[idx] = { ...photo, url: e.target.value }
                              updateConfig('story', { photos: newPhotos })
                            }}
                            placeholder="URL"
                          />
                          <div className="flex gap-2">
                            <Input
                              value={photo.year}
                              onChange={e => {
                                const newPhotos = [...config.story.photos]
                                newPhotos[idx] = { ...photo, year: e.target.value }
                                updateConfig('story', { photos: newPhotos })
                              }}
                              placeholder="Año"
                              className="w-20"
                            />
                            <Input
                              value={photo.alt}
                              onChange={e => {
                                const newPhotos = [...config.story.photos]
                                newPhotos[idx] = { ...photo, alt: e.target.value }
                                updateConfig('story', { photos: newPhotos })
                              }}
                              placeholder="Alt"
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 5. Products Section */}
          <AccordionItem value="products" className="rounded-xl border border-border bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionHeader
                section={SECTIONS[4]}
                completion={getSectionCompletion('products', config)}
              />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Eyebrow</Label>
                    <Input
                      value={config.products.eyebrow}
                      onChange={e =>
                        updateConfig('products', { eyebrow: e.target.value })
                      }
                      placeholder="Productos"
                      className="uppercase tracking-wider"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={config.products.title}
                      onChange={e =>
                        updateConfig('products', { title: e.target.value })
                      }
                      placeholder="Nuestros quesos"
                    />
                  </div>
                </div>

                <Separator />

                {/* Products List */}
                <div className="space-y-3">
                  <Label>Productos (hasta 12)</Label>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={e => handleDragEnd(e, 'products', 'products')}
                  >
                    <SortableContext
                      items={config.products.products.map(p => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {config.products.products.map((product, idx) => (
                        <SortableItem key={product.id} id={product.id}>
                          <Card className="p-4">
                            <div className="space-y-3">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <Input
                                    value={product.name}
                                    onChange={e => {
                                      const newProducts = [...config.products.products]
                                      newProducts[idx] = {
                                        ...product,
                                        name: e.target.value,
                                      }
                                      updateConfig('products', {
                                        products: newProducts,
                                      })
                                    }}
                                    placeholder="Nombre del producto"
                                    className="font-medium"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ml-2 text-muted-foreground hover:text-destructive shrink-0"
                                    onClick={() =>
                                      setDeleteDialog({
                                        type: 'product',
                                        id: product.id,
                                      })
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <ImageInput
                                  label="Foto del producto"
                                  value={product.imageUrl}
                                  onChange={url => {
                                    const newProducts = [...config.products.products]
                                    newProducts[idx] = {
                                      ...product,
                                      imageUrl: url,
                                    }
                                    updateConfig('products', { products: newProducts })
                                  }}
                                  folder="negocios/comercio/products"
                                />
                              </div>
                              <Textarea
                                value={product.description}
                                onChange={e => {
                                  const newProducts = [...config.products.products]
                                  newProducts[idx] = {
                                    ...product,
                                    description: e.target.value.slice(0, 100),
                                  }
                                  updateConfig('products', { products: newProducts })
                                }}
                                placeholder="Descripción breve"
                                maxLength={100}
                                rows={2}
                              />
                              <CharCounter
                                current={product.description.length}
                                max={100}
                              />
                              <div className="grid gap-2 md:grid-cols-3">
                                <Input
                                  value={product.format}
                                  onChange={e => {
                                    const newProducts = [...config.products.products]
                                    newProducts[idx] = {
                                      ...product,
                                      format: e.target.value,
                                    }
                                    updateConfig('products', { products: newProducts })
                                  }}
                                  placeholder="Formato (ej: Pieza 700g)"
                                />
                                <Input
                                  value={product.price}
                                  onChange={e => {
                                    const newProducts = [...config.products.products]
                                    newProducts[idx] = {
                                      ...product,
                                      price: e.target.value,
                                    }
                                    updateConfig('products', { products: newProducts })
                                  }}
                                  placeholder="Precio (ej: 16 €)"
                                />
                                <Input
                                  value={product.purchaseUrl}
                                  onChange={e => {
                                    const newProducts = [...config.products.products]
                                    newProducts[idx] = {
                                      ...product,
                                      purchaseUrl: e.target.value,
                                    }
                                    updateConfig('products', { products: newProducts })
                                  }}
                                  placeholder="URL de compra (vacío = solo obrador)"
                                />
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {product.badges.map((badge, bidx) => (
                                  <Badge
                                    key={badge.id}
                                    variant="outline"
                                    className="border-copper/30 text-copper"
                                  >
                                    {badge.text}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newProducts = [...config.products.products]
                                        newProducts[idx] = {
                                          ...product,
                                          badges: product.badges.filter(
                                            (_, i) => i !== bidx
                                          ),
                                        }
                                        updateConfig('products', {
                                          products: newProducts,
                                        })
                                      }}
                                      className="ml-1 hover:text-destructive"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                                <Select
                                  value=""
                                  onValueChange={v => {
                                    const newProducts = [...config.products.products]
                                    newProducts[idx] = {
                                      ...product,
                                      badges: [
                                        ...product.badges,
                                        { id: generateId('pb'), text: v },
                                      ],
                                    }
                                    updateConfig('products', { products: newProducts })
                                  }}
                                >
                                  <SelectTrigger className="h-6 w-auto">
                                    <Plus className="h-3 w-3" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {PRODUCT_BADGES.filter(
                                      b => !product.badges.some(pb => pb.text === b)
                                    ).map(b => (
                                      <SelectItem key={b} value={b}>
                                        {b}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="ml-auto flex items-center gap-2">
                                  <Label
                                    htmlFor={`featured-${product.id}`}
                                    className="text-xs"
                                  >
                                    Destacado
                                  </Label>
                                  <Switch
                                    id={`featured-${product.id}`}
                                    checked={product.featured}
                                    onCheckedChange={checked => {
                                      const newProducts = [...config.products.products]
                                      newProducts[idx] = {
                                        ...product,
                                        featured: checked,
                                      }
                                      updateConfig('products', {
                                        products: newProducts,
                                      })
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </Card>
                        </SortableItem>
                      ))}
                    </SortableContext>
                  </DndContext>
                  {config.products.products.length < 12 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed"
                      onClick={() => {
                        const newProduct: Product = {
                          id: generateId('prod'),
                          imageUrl: '',
                          name: '',
                          description: '',
                          format: '',
                          price: '',
                          badges: [],
                          purchaseUrl: '',
                          featured: false,
                        }
                        updateConfig('products', {
                          products: [...config.products.products, newProduct],
                        })
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Añadir producto
                    </Button>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 6. Process Section */}
          <AccordionItem value="process" className="rounded-xl border border-border bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionHeader
                section={SECTIONS[5]}
                completion={getSectionCompletion('process', config)}
              />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Eyebrow</Label>
                    <Input
                      value={config.process.eyebrow}
                      onChange={e =>
                        updateConfig('process', { eyebrow: e.target.value })
                      }
                      placeholder="El proceso"
                      className="uppercase tracking-wider"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={config.process.title}
                      onChange={e =>
                        updateConfig('process', { title: e.target.value })
                      }
                      placeholder="Cómo hacemos nuestro queso"
                    />
                  </div>
                </div>

                <Separator />

                {/* 4 Fixed Steps */}
                <div className="space-y-3">
                  <Label>4 Pasos del proceso</Label>
                  {config.process.steps.map((step, idx) => (
                    <Card key={step.id} className="p-4">
                      <div className="flex gap-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-copper/10 font-serif text-lg font-bold text-copper">
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          <Input
                            value={step.title}
                            onChange={e => {
                              const newSteps = [...config.process.steps]
                              newSteps[idx] = { ...step, title: e.target.value }
                              updateConfig('process', { steps: newSteps })
                            }}
                            placeholder="Título del paso"
                            className="font-medium"
                          />
                          <Textarea
                            value={step.description}
                            onChange={e => {
                              const newSteps = [...config.process.steps]
                              newSteps[idx] = { ...step, description: e.target.value }
                              updateConfig('process', { steps: newSteps })
                            }}
                            placeholder="Descripción breve"
                            rows={2}
                          />
                          <ImageInput
                            label="Foto del paso"
                            value={step.photoUrl}
                            onChange={url => {
                              const newSteps = [...config.process.steps]
                              newSteps[idx] = { ...step, photoUrl: url }
                              updateConfig('process', { steps: newSteps })
                            }}
                            folder="negocios/comercio/process"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 7. Place Section */}
          <AccordionItem value="place" className="rounded-xl border border-border bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionHeader
                section={SECTIONS[6]}
                completion={getSectionCompletion('place', config)}
              />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Mostrar esta sección</Label>
                  <Switch
                    checked={config.place.showSection}
                    onCheckedChange={checked =>
                      updateConfig('place', { showSection: checked })
                    }
                  />
                </div>

                {config.place.showSection && (
                  <>
                    <ImageInput
                      label="Imagen full-bleed"
                      value={config.place.imageUrl}
                      onChange={url => updateConfig('place', { imageUrl: url })}
                    />
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input
                        value={config.place.title}
                        onChange={e =>
                          updateConfig('place', { title: e.target.value })
                        }
                        placeholder="Nuestro obrador y cueva de maduración"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Textarea
                        value={config.place.description}
                        onChange={e =>
                          updateConfig('place', {
                            description: e.target.value.slice(0, 300),
                          })
                        }
                        maxLength={300}
                        rows={3}
                        placeholder="Descripción del lugar..."
                      />
                      <CharCounter current={config.place.description.length} max={300} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>CTA Texto</Label>
                        <Input
                          value={config.place.cta.text}
                          onChange={e =>
                            updateConfig('place', {
                              cta: { ...config.place.cta, text: e.target.value },
                            })
                          }
                          placeholder="Reserva una visita"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CTA URL</Label>
                        <Input
                          value={config.place.cta.url}
                          onChange={e =>
                            updateConfig('place', {
                              cta: { ...config.place.cta, url: e.target.value },
                            })
                          }
                          placeholder="/reservar"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 8. Experiences Section */}
          <AccordionItem value="experiences" className="rounded-xl border border-border bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionHeader
                section={SECTIONS[7]}
                completion={getSectionCompletion('experiences', config)}
              />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Eyebrow</Label>
                    <Input
                      value={config.experiences.eyebrow}
                      onChange={e =>
                        updateConfig('experiences', { eyebrow: e.target.value })
                      }
                      placeholder="Experiencias"
                      className="uppercase tracking-wider"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={config.experiences.title}
                      onChange={e =>
                        updateConfig('experiences', { title: e.target.value })
                      }
                      placeholder="Vive la quesería"
                    />
                  </div>
                </div>

                <Separator />

                {config.experiences.experiences.length === 0 ? (
                  <Card className="border-dashed p-8 text-center">
                    <Sparkles className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Próximamente — añade tu primera experiencia
                    </p>
                  </Card>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={e => handleDragEnd(e, 'experiences', 'experiences')}
                  >
                    <SortableContext
                      items={config.experiences.experiences.map(ex => ex.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {config.experiences.experiences.map((exp, idx) => (
                        <SortableItem key={exp.id} id={exp.id}>
                          <Card className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <Input
                                  value={exp.title}
                                  onChange={e => {
                                    const newExps = [
                                      ...config.experiences.experiences,
                                    ]
                                    newExps[idx] = {
                                      ...exp,
                                      title: e.target.value,
                                    }
                                    updateConfig('experiences', {
                                      experiences: newExps,
                                    })
                                  }}
                                  placeholder="Título de la experiencia"
                                  className="font-medium"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="ml-2 text-muted-foreground hover:text-destructive shrink-0"
                                  onClick={() =>
                                    setDeleteDialog({
                                      type: 'experience',
                                      id: exp.id,
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <ImageInput
                                label="Imagen de la experiencia"
                                value={exp.imageUrl}
                                onChange={url => {
                                  const newExps = [
                                    ...config.experiences.experiences,
                                  ]
                                  newExps[idx] = {
                                    ...exp,
                                    imageUrl: url,
                                  }
                                  updateConfig('experiences', {
                                    experiences: newExps,
                                  })
                                }}
                                folder="negocios/comercio/experiences"
                              />
                              <div className="grid gap-2 md:grid-cols-4">
                                <Input
                                  value={exp.duration}
                                  onChange={e => {
                                    const newExps = [...config.experiences.experiences]
                                    newExps[idx] = { ...exp, duration: e.target.value }
                                    updateConfig('experiences', { experiences: newExps })
                                  }}
                                  placeholder="Duración (ej: 1h 30)"
                                />
                                <Input
                                  value={exp.groupSize}
                                  onChange={e => {
                                    const newExps = [...config.experiences.experiences]
                                    newExps[idx] = { ...exp, groupSize: e.target.value }
                                    updateConfig('experiences', { experiences: newExps })
                                  }}
                                  placeholder="Grupo (ej: 2-10 pers.)"
                                />
                                <Input
                                  value={exp.price}
                                  onChange={e => {
                                    const newExps = [...config.experiences.experiences]
                                    newExps[idx] = { ...exp, price: e.target.value }
                                    updateConfig('experiences', { experiences: newExps })
                                  }}
                                  placeholder="Precio (ej: desde 15€)"
                                />
                                <Input
                                  value={exp.reservationUrl}
                                  onChange={e => {
                                    const newExps = [...config.experiences.experiences]
                                    newExps[idx] = {
                                      ...exp,
                                      reservationUrl: e.target.value,
                                    }
                                    updateConfig('experiences', { experiences: newExps })
                                  }}
                                  placeholder="URL de reserva"
                                />
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    id={`lpmbe-${exp.id}`}
                                    checked={exp.lpmbeDiscount}
                                    onCheckedChange={checked => {
                                      const newExps = [
                                        ...config.experiences.experiences,
                                      ]
                                      newExps[idx] = {
                                        ...exp,
                                        lpmbeDiscount: checked,
                                      }
                                      updateConfig('experiences', {
                                        experiences: newExps,
                                      })
                                    }}
                                  />
                                  <Label
                                    htmlFor={`lpmbe-${exp.id}`}
                                    className="text-xs"
                                  >
                                    Descuento socios LPMBE
                                  </Label>
                                </div>
                                {exp.lpmbeDiscount && (
                                  <Input
                                    type="number"
                                    value={exp.discountPercent}
                                    onChange={e => {
                                      const newExps = [
                                        ...config.experiences.experiences,
                                      ]
                                      newExps[idx] = {
                                        ...exp,
                                        discountPercent:
                                          parseInt(e.target.value) || 0,
                                      }
                                      updateConfig('experiences', {
                                        experiences: newExps,
                                      })
                                    }}
                                    placeholder="%"
                                    className="w-20"
                                  />
                                )}
                              </div>
                            </div>
                          </Card>
                        </SortableItem>
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
                {config.experiences.experiences.length < 6 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed"
                    onClick={() => {
                      const newExp: Experience = {
                        id: generateId('exp'),
                        imageUrl: '',
                        title: '',
                        duration: '',
                        groupSize: '',
                        price: '',
                        lpmbeDiscount: false,
                        discountPercent: 0,
                        reservationUrl: '',
                      }
                      updateConfig('experiences', {
                        experiences: [...config.experiences.experiences, newExp],
                      })
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir experiencia
                  </Button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 9. Awards Section */}
          <AccordionItem value="awards" className="rounded-xl border border-border bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionHeader
                section={SECTIONS[8]}
                completion={getSectionCompletion('awards', config)}
              />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-6">
                {/* Award Logos */}
                <div className="space-y-3">
                  <Label>Logos de premios (hasta 8)</Label>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={e => handleDragEnd(e, 'awards', 'logos')}
                  >
                    <SortableContext
                      items={config.awards.logos.map(l => l.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {config.awards.logos.map((logo, idx) => (
                        <SortableItem key={logo.id} id={logo.id}>
                          <Card className="p-3">
                            <div className="flex items-center gap-3">
                              {logo.url ? (
                                <img
                                  src={logo.url}
                                  alt={logo.alt}
                                  className="h-12 w-20 object-contain"
                                />
                              ) : (
                                <div className="flex h-12 w-20 items-center justify-center bg-muted">
                                  <Award className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <Input
                                value={logo.url}
                                onChange={e => {
                                  const newLogos = [...config.awards.logos]
                                  newLogos[idx] = { ...logo, url: e.target.value }
                                  updateConfig('awards', { logos: newLogos })
                                }}
                                placeholder="URL del logo"
                                className="flex-1"
                              />
                              <Input
                                value={logo.alt}
                                onChange={e => {
                                  const newLogos = [...config.awards.logos]
                                  newLogos[idx] = { ...logo, alt: e.target.value }
                                  updateConfig('awards', { logos: newLogos })
                                }}
                                placeholder="Nombre del premio"
                                className="flex-1"
                              />
                              <Input
                                value={logo.year || ''}
                                onChange={e => {
                                  const newLogos = [...config.awards.logos]
                                  newLogos[idx] = { ...logo, year: e.target.value }
                                  updateConfig('awards', { logos: newLogos })
                                }}
                                placeholder="Año"
                                className="w-20"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() =>
                                  setDeleteDialog({ type: 'awardLogo', id: logo.id })
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </Card>
                        </SortableItem>
                      ))}
                    </SortableContext>
                  </DndContext>
                  {config.awards.logos.length < 8 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed"
                      onClick={() => {
                        const newLogo: AwardLogo = {
                          id: generateId('award'),
                          url: '',
                          alt: '',
                          year: '',
                        }
                        updateConfig('awards', {
                          logos: [...config.awards.logos, newLogo],
                        })
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Añadir premio
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Press Quotes */}
                <div className="space-y-3">
                  <Label>Citas de prensa (hasta 4)</Label>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={e => handleDragEnd(e, 'awards', 'pressQuotes')}
                  >
                    <SortableContext
                      items={config.awards.pressQuotes.map(q => q.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {config.awards.pressQuotes.map((quote, idx) => (
                        <SortableItem key={quote.id} id={quote.id}>
                          <Card className="p-3">
                            <div className="space-y-2">
                              <Textarea
                                value={quote.text}
                                onChange={e => {
                                  const newQuotes = [...config.awards.pressQuotes]
                                  newQuotes[idx] = { ...quote, text: e.target.value }
                                  updateConfig('awards', { pressQuotes: newQuotes })
                                }}
                                placeholder="Cita de prensa..."
                                rows={2}
                                className="italic"
                              />
                              <div className="flex gap-2">
                                <Input
                                  value={quote.medium}
                                  onChange={e => {
                                    const newQuotes = [...config.awards.pressQuotes]
                                    newQuotes[idx] = {
                                      ...quote,
                                      medium: e.target.value,
                                    }
                                    updateConfig('awards', { pressQuotes: newQuotes })
                                  }}
                                  placeholder="Medio (ej: El País)"
                                  className="flex-1"
                                />
                                <Input
                                  value={quote.year}
                                  onChange={e => {
                                    const newQuotes = [...config.awards.pressQuotes]
                                    newQuotes[idx] = { ...quote, year: e.target.value }
                                    updateConfig('awards', { pressQuotes: newQuotes })
                                  }}
                                  placeholder="Año"
                                  className="w-20"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={() =>
                                    setDeleteDialog({
                                      type: 'pressQuote',
                                      id: quote.id,
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        </SortableItem>
                      ))}
                    </SortableContext>
                  </DndContext>
                  {config.awards.pressQuotes.length < 4 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed"
                      onClick={() => {
                        const newQuote: PressQuote = {
                          id: generateId('press'),
                          text: '',
                          medium: '',
                          year: '',
                        }
                        updateConfig('awards', {
                          pressQuotes: [...config.awards.pressQuotes, newQuote],
                        })
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Añadir cita
                    </Button>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 10. Testimonials Section */}
          <AccordionItem value="testimonials" className="rounded-xl border border-border bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionHeader
                section={SECTIONS[9]}
                completion={getSectionCompletion('testimonials', config)}
              />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                <Label>Testimonios (hasta 8)</Label>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={e => handleDragEnd(e, 'testimonials', 'testimonials')}
                >
                  <SortableContext
                    items={config.testimonials.testimonials.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {config.testimonials.testimonials.map((test, idx) => (
                      <SortableItem key={test.id} id={test.id}>
                        <Card className="p-4">
                          <div className="space-y-3">
                            <div className="flex gap-3">
                              {test.photoUrl ? (
                                <img
                                  src={test.photoUrl}
                                  alt={test.name}
                                  className="h-14 w-14 flex-shrink-0 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                                  <MessageSquare className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="grid flex-1 gap-2 md:grid-cols-2">
                                    <Input
                                      value={test.name}
                                      onChange={e => {
                                        const newTests = [
                                          ...config.testimonials.testimonials,
                                        ]
                                        newTests[idx] = {
                                          ...test,
                                          name: e.target.value,
                                        }
                                        updateConfig('testimonials', {
                                          testimonials: newTests,
                                        })
                                      }}
                                      placeholder="Nombre"
                                    />
                                    <Input
                                      value={test.origin}
                                      onChange={e => {
                                        const newTests = [
                                          ...config.testimonials.testimonials,
                                        ]
                                        newTests[idx] = {
                                          ...test,
                                          origin: e.target.value,
                                        }
                                        updateConfig('testimonials', {
                                          testimonials: newTests,
                                        })
                                      }}
                                      placeholder="Ciudad / Origen"
                                    />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ml-2 text-muted-foreground hover:text-destructive"
                                    onClick={() =>
                                      setDeleteDialog({
                                        type: 'testimonial',
                                        id: test.id,
                                      })
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <ImageInput
                                  label="Foto del cliente (opcional)"
                                  value={test.photoUrl || ''}
                                  onChange={url => {
                                    const newTests = [
                                      ...config.testimonials.testimonials,
                                    ]
                                    newTests[idx] = {
                                      ...test,
                                      photoUrl: url,
                                    }
                                    updateConfig('testimonials', {
                                      testimonials: newTests,
                                    })
                                  }}
                                  folder="negocios/comercio/testimonials"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <StarRating
                                value={test.stars}
                                onChange={stars => {
                                  const newTests = [
                                    ...config.testimonials.testimonials,
                                  ]
                                  newTests[idx] = { ...test, stars }
                                  updateConfig('testimonials', {
                                    testimonials: newTests,
                                  })
                                }}
                              />
                              <Input
                                value={test.date}
                                onChange={e => {
                                  const newTests = [
                                    ...config.testimonials.testimonials,
                                  ]
                                  newTests[idx] = { ...test, date: e.target.value }
                                  updateConfig('testimonials', {
                                    testimonials: newTests,
                                  })
                                }}
                                placeholder="Fecha (ej: Oct 2024)"
                                className="w-32"
                              />
                              <div className="ml-auto flex items-center gap-2">
                                <Label
                                  htmlFor={`feat-${test.id}`}
                                  className="text-xs"
                                >
                                  Destacado
                                </Label>
                                <Switch
                                  id={`feat-${test.id}`}
                                  checked={test.featured}
                                  onCheckedChange={checked => {
                                    const newTests = [
                                      ...config.testimonials.testimonials,
                                    ]
                                    newTests[idx] = { ...test, featured: checked }
                                    updateConfig('testimonials', {
                                      testimonials: newTests,
                                    })
                                  }}
                                />
                              </div>
                            </div>
                            <Textarea
                              value={test.text}
                              onChange={e => {
                                const newTests = [...config.testimonials.testimonials]
                                newTests[idx] = {
                                  ...test,
                                  text: e.target.value.slice(0, 280),
                                }
                                updateConfig('testimonials', {
                                  testimonials: newTests,
                                })
                              }}
                              maxLength={280}
                              placeholder="Texto del testimonio..."
                              rows={2}
                            />
                            <CharCounter current={test.text.length} max={280} />
                          </div>
                        </Card>
                      </SortableItem>
                    ))}
                  </SortableContext>
                </DndContext>
                {config.testimonials.testimonials.length < 8 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed"
                    onClick={() => {
                      const newTest: Testimonial = {
                        id: generateId('test'),
                        photoUrl: '',
                        name: '',
                        origin: '',
                        stars: 5,
                        text: '',
                        date: '',
                        featured: false,
                      }
                      updateConfig('testimonials', {
                        testimonials: [...config.testimonials.testimonials, newTest],
                      })
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir testimonio
                  </Button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 11. Practical Info Section */}
          <AccordionItem value="practicalInfo" className="rounded-xl border border-border bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionHeader
                section={SECTIONS[10]}
                completion={getSectionCompletion('practicalInfo', config)}
              />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-6">
                {/* Schedule */}
                <div className="space-y-3">
                  <Label>Horario</Label>
                  <div className="space-y-2">
                    {config.practicalInfo.schedule.map((day, idx) => (
                      <Card key={day.day} className="p-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="w-24 font-medium">{day.dayName}</span>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={day.open}
                              onCheckedChange={checked => {
                                const newSchedule = [...config.practicalInfo.schedule]
                                newSchedule[idx] = { ...day, open: checked }
                                updateConfig('practicalInfo', {
                                  schedule: newSchedule,
                                })
                              }}
                            />
                            <span className="text-sm text-muted-foreground">
                              {day.open ? 'Abierto' : 'Cerrado'}
                            </span>
                          </div>
                          {day.open && (
                            <>
                              <Input
                                type="time"
                                value={day.openTime1}
                                onChange={e => {
                                  const newSchedule = [
                                    ...config.practicalInfo.schedule,
                                  ]
                                  newSchedule[idx] = {
                                    ...day,
                                    openTime1: e.target.value,
                                  }
                                  updateConfig('practicalInfo', {
                                    schedule: newSchedule,
                                  })
                                }}
                                className="w-28"
                              />
                              <span>–</span>
                              <Input
                                type="time"
                                value={day.closeTime1}
                                onChange={e => {
                                  const newSchedule = [
                                    ...config.practicalInfo.schedule,
                                  ]
                                  newSchedule[idx] = {
                                    ...day,
                                    closeTime1: e.target.value,
                                  }
                                  updateConfig('practicalInfo', {
                                    schedule: newSchedule,
                                  })
                                }}
                                className="w-28"
                              />
                              <span className="text-muted-foreground">|</span>
                              <Input
                                type="time"
                                value={day.openTime2 || ''}
                                onChange={e => {
                                  const newSchedule = [
                                    ...config.practicalInfo.schedule,
                                  ]
                                  newSchedule[idx] = {
                                    ...day,
                                    openTime2: e.target.value,
                                  }
                                  updateConfig('practicalInfo', {
                                    schedule: newSchedule,
                                  })
                                }}
                                className="w-28"
                                placeholder="Tarde"
                              />
                              <span>–</span>
                              <Input
                                type="time"
                                value={day.closeTime2 || ''}
                                onChange={e => {
                                  const newSchedule = [
                                    ...config.practicalInfo.schedule,
                                  ]
                                  newSchedule[idx] = {
                                    ...day,
                                    closeTime2: e.target.value,
                                  }
                                  updateConfig('practicalInfo', {
                                    schedule: newSchedule,
                                  })
                                }}
                                className="w-28"
                              />
                            </>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Payment Methods */}
                <ChipMultiSelect
                  label="Formas de pago"
                  options={PAYMENT_METHODS}
                  selected={config.practicalInfo.paymentMethods}
                  onChange={paymentMethods =>
                    updateConfig('practicalInfo', { paymentMethods })
                  }
                  placeholder="+ Añadir"
                />

                {/* Shipping */}
                <div className="space-y-2">
                  <Label>Política de envíos</Label>
                  <div className="flex gap-2">
                    {[
                      { value: 'peninsula24h', label: 'España peninsular 24-48h' },
                      { value: 'peninsulaBaleares', label: 'Península y Baleares' },
                      { value: 'soloObrador', label: 'Solo entrega en obrador' },
                    ].map(opt => (
                      <Badge
                        key={opt.value}
                        variant={
                          config.practicalInfo.shippingOption === opt.value
                            ? 'default'
                            : 'outline'
                        }
                        className={`cursor-pointer ${
                          config.practicalInfo.shippingOption === opt.value
                            ? 'bg-primary'
                            : ''
                        }`}
                        onClick={() =>
                          updateConfig('practicalInfo', {
                            shippingOption: opt.value as typeof config.practicalInfo.shippingOption,
                          })
                        }
                      >
                        {opt.label}
                      </Badge>
                    ))}
                  </div>
                  <Textarea
                    value={config.practicalInfo.shippingPolicy}
                    onChange={e =>
                      updateConfig('practicalInfo', {
                        shippingPolicy: e.target.value,
                      })
                    }
                    placeholder="Detalles de la política de envíos..."
                    rows={2}
                  />
                </div>

                {/* Return Policy */}
                <div className="space-y-2">
                  <Label>Política de devoluciones</Label>
                  <Textarea
                    value={config.practicalInfo.returnPolicy}
                    onChange={e =>
                      updateConfig('practicalInfo', {
                        returnPolicy: e.target.value.slice(0, 280),
                      })
                    }
                    maxLength={280}
                    rows={2}
                    placeholder="Política de devoluciones..."
                  />
                  <CharCounter
                    current={config.practicalInfo.returnPolicy.length}
                    max={280}
                  />
                </div>

                {/* Languages */}
                <ChipMultiSelect
                  label="Idiomas atendidos"
                  options={LANGUAGES}
                  selected={config.practicalInfo.languagesServed}
                  onChange={languagesServed =>
                    updateConfig('practicalInfo', { languagesServed })
                  }
                  placeholder="+ Añadir idioma"
                />

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label>Notas adicionales (opcional)</Label>
                  <Textarea
                    value={config.practicalInfo.additionalNotes}
                    onChange={e =>
                      updateConfig('practicalInfo', {
                        additionalNotes: e.target.value,
                      })
                    }
                    placeholder="Información adicional..."
                    rows={2}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 12. Location Section */}
          <AccordionItem value="location" className="rounded-xl border border-border bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionHeader
                section={SECTIONS[11]}
                completion={getSectionCompletion('location', config)}
              />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input
                    value={config.location.address}
                    onChange={e =>
                      updateConfig('location', { address: e.target.value })
                    }
                    placeholder="Camino del Obrador, 12"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Localidad</Label>
                    <Input
                      value={config.location.locality}
                      onChange={e =>
                        updateConfig('location', { locality: e.target.value })
                      }
                      placeholder="Aínsa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Provincia</Label>
                    <Input
                      value={config.location.province}
                      onChange={e =>
                        updateConfig('location', { province: e.target.value })
                      }
                      placeholder="Huesca"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Comunidad</Label>
                    <Input
                      value={config.location.community}
                      onChange={e =>
                        updateConfig('location', { community: e.target.value })
                      }
                      placeholder="Aragón"
                    />
                  </div>
                </div>

                {/* Coordinates + Map */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Latitud</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          value={config.location.lat}
                          onChange={e => {
                            const lat = parseFloat(e.target.value) || 0
                            updateConfig('location', {
                              lat,
                              googleMapsUrl: `https://maps.google.com/?q=${lat},${config.location.lng}`,
                            })
                          }}
                          placeholder="42.4175"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Longitud</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          value={config.location.lng}
                          onChange={e => {
                            const lng = parseFloat(e.target.value) || 0
                            updateConfig('location', {
                              lng,
                              googleMapsUrl: `https://maps.google.com/?q=${config.location.lat},${lng}`,
                            })
                          }}
                          placeholder="0.1394"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>URL de Google Maps</Label>
                      <Input
                        value={config.location.googleMapsUrl}
                        onChange={e =>
                          updateConfig('location', { googleMapsUrl: e.target.value })
                        }
                        placeholder="https://maps.google.com/?q=..."
                      />
                    </div>
                  </div>
                  <div className="h-48 overflow-hidden rounded-xl border border-border">
                    <MapPreview
                      lat={config.location.lat}
                      lng={config.location.lng}
                      onPositionChange={(lat, lng) =>
                        updateConfig('location', {
                          lat,
                          lng,
                          googleMapsUrl: `https://maps.google.com/?q=${lat},${lng}`,
                        })
                      }
                    />
                  </div>
                </div>

                <Separator />

                {/* How to Get */}
                <div className="space-y-3">
                  <Label>Cómo llegar</Label>
                  {config.location.howToGet.map((htg, idx) => (
                    <Card key={htg.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <HowToGetIconSelect
                          value={htg.icon}
                          onChange={icon => {
                            const newHtg = [...config.location.howToGet]
                            newHtg[idx] = { ...htg, icon: icon as HowToGet['icon'] }
                            updateConfig('location', { howToGet: newHtg })
                          }}
                        />
                        <div className="flex-1 space-y-2">
                          <Input
                            value={htg.title}
                            onChange={e => {
                              const newHtg = [...config.location.howToGet]
                              newHtg[idx] = { ...htg, title: e.target.value }
                              updateConfig('location', { howToGet: newHtg })
                            }}
                            placeholder="En coche"
                          />
                          <Textarea
                            value={htg.description}
                            onChange={e => {
                              const newHtg = [...config.location.howToGet]
                              newHtg[idx] = { ...htg, description: e.target.value }
                              updateConfig('location', { howToGet: newHtg })
                            }}
                            placeholder="Descripción..."
                            rows={2}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            setDeleteDialog({ type: 'howToGet', id: htg.id })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {config.location.howToGet.length < 3 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed"
                      onClick={() => {
                        const newHtg: HowToGet = {
                          id: generateId('htg'),
                          icon: 'Car',
                          title: '',
                          description: '',
                        }
                        updateConfig('location', {
                          howToGet: [...config.location.howToGet, newHtg],
                        })
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Añadir opción
                    </Button>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 13. Visit CTA Section */}
          <AccordionItem value="visitCta" className="rounded-xl border border-border bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionHeader
                section={SECTIONS[12]}
                completion={getSectionCompletion('visitCta', config)}
              />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={config.visitCta.title}
                      onChange={e =>
                        updateConfig('visitCta', { title: e.target.value })
                      }
                      placeholder="Visítanos en el obrador"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtítulo</Label>
                    <Input
                      value={config.visitCta.subtitle}
                      onChange={e =>
                        updateConfig('visitCta', { subtitle: e.target.value })
                      }
                      placeholder="Ven a conocernos..."
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>CTA Principal - Texto</Label>
                    <Input
                      value={config.visitCta.primaryCta.text}
                      onChange={e =>
                        updateConfig('visitCta', {
                          primaryCta: {
                            ...config.visitCta.primaryCta,
                            text: e.target.value,
                          },
                        })
                      }
                      placeholder="Reservar visita"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Principal - URL</Label>
                    <Input
                      value={config.visitCta.primaryCta.url}
                      onChange={e =>
                        updateConfig('visitCta', {
                          primaryCta: {
                            ...config.visitCta.primaryCta,
                            url: e.target.value,
                          },
                        })
                      }
                      placeholder="/reservar"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Teléfono (para "Llamar")</Label>
                    <Input
                      value={config.visitCta.phone}
                      onChange={e =>
                        updateConfig('visitCta', { phone: e.target.value })
                      }
                      placeholder="+34 974 500 123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input
                      value={config.visitCta.whatsapp}
                      onChange={e =>
                        updateConfig('visitCta', { whatsapp: e.target.value })
                      }
                      placeholder="+34 628 123 456"
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 14. Member Offers Section */}
          <AccordionItem value="memberOffers" className="rounded-xl border border-border bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionHeader
                section={SECTIONS[13]}
                completion={getSectionCompletion('memberOffers', config)}
              />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Eyebrow</Label>
                    <Input
                      value={config.memberOffers.eyebrow}
                      onChange={e =>
                        updateConfig('memberOffers', { eyebrow: e.target.value })
                      }
                      placeholder="Ventajas socios"
                      className="uppercase tracking-wider"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={config.memberOffers.title}
                      onChange={e =>
                        updateConfig('memberOffers', { title: e.target.value })
                      }
                      placeholder="Ofertas exclusivas para socios LPMBE"
                    />
                  </div>
                </div>

                <Separator />

                {/* Offers */}
                <div className="space-y-3">
                  <Label>Ofertas (hasta 6)</Label>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={e => handleDragEnd(e, 'memberOffers', 'offers')}
                  >
                    <SortableContext
                      items={config.memberOffers.offers.map(o => o.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {config.memberOffers.offers.map((offer, idx) => (
                        <SortableItem key={offer.id} id={offer.id}>
                          <Card className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <OfferIconSelect
                                  value={offer.icon}
                                  onChange={icon => {
                                    const newOffers = [...config.memberOffers.offers]
                                    newOffers[idx] = {
                                      ...offer,
                                      icon: icon as MemberOffer['icon'],
                                    }
                                    updateConfig('memberOffers', {
                                      offers: newOffers,
                                    })
                                  }}
                                />
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-start justify-between">
                                    <Input
                                      value={offer.title}
                                      onChange={e => {
                                        const newOffers = [
                                          ...config.memberOffers.offers,
                                        ]
                                        newOffers[idx] = {
                                          ...offer,
                                          title: e.target.value,
                                        }
                                        updateConfig('memberOffers', {
                                          offers: newOffers,
                                        })
                                      }}
                                      placeholder="Título de la oferta"
                                      className="font-medium"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="ml-2 text-muted-foreground hover:text-destructive"
                                      onClick={() =>
                                        setDeleteDialog({
                                          type: 'memberOffer',
                                          id: offer.id,
                                        })
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <Input
                                    value={offer.highlight}
                                    onChange={e => {
                                      const newOffers = [
                                        ...config.memberOffers.offers,
                                      ]
                                      newOffers[idx] = {
                                        ...offer,
                                        highlight: e.target.value,
                                      }
                                      updateConfig('memberOffers', {
                                        offers: newOffers,
                                      })
                                    }}
                                    placeholder="Destacado (ej: −15%, Gratis)"
                                    className="font-bold"
                                  />
                                </div>
                              </div>
                              <Textarea
                                value={offer.description}
                                onChange={e => {
                                  const newOffers = [...config.memberOffers.offers]
                                  newOffers[idx] = {
                                    ...offer,
                                    description: e.target.value.slice(0, 200),
                                  }
                                  updateConfig('memberOffers', {
                                    offers: newOffers,
                                  })
                                }}
                                maxLength={200}
                                placeholder="Descripción de la oferta..."
                                rows={2}
                              />
                              <CharCounter
                                current={offer.description.length}
                                max={200}
                              />
                              <Input
                                value={offer.conditions}
                                onChange={e => {
                                  const newOffers = [...config.memberOffers.offers]
                                  newOffers[idx] = {
                                    ...offer,
                                    conditions: e.target.value,
                                  }
                                  updateConfig('memberOffers', { offers: newOffers })
                                }}
                                placeholder="Condiciones"
                              />
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    id={`ofeat-${offer.id}`}
                                    checked={offer.featured}
                                    onCheckedChange={checked => {
                                      const newOffers = [
                                        ...config.memberOffers.offers,
                                      ]
                                      newOffers[idx] = {
                                        ...offer,
                                        featured: checked,
                                      }
                                      updateConfig('memberOffers', {
                                        offers: newOffers,
                                      })
                                    }}
                                  />
                                  <Label
                                    htmlFor={`ofeat-${offer.id}`}
                                    className="text-xs"
                                  >
                                    Destacada
                                  </Label>
                                </div>
                                <Select
                                  value={offer.badge}
                                  onValueChange={v => {
                                    const newOffers = [...config.memberOffers.offers]
                                    newOffers[idx] = {
                                      ...offer,
                                      badge: v as MemberOffer['badge'],
                                    }
                                    updateConfig('memberOffers', {
                                      offers: newOffers,
                                    })
                                  }}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Badge" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {OFFER_BADGE_OPTIONS.map(b => (
                                      <SelectItem key={b || 'none'} value={b}>
                                        {b || '(Sin badge)'}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </Card>
                        </SortableItem>
                      ))}
                    </SortableContext>
                  </DndContext>
                  {config.memberOffers.offers.length < 6 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed"
                      onClick={() => {
                        const newOffer: MemberOffer = {
                          id: generateId('offer'),
                          icon: 'Gift',
                          title: '',
                          highlight: '',
                          description: '',
                          conditions: '',
                          featured: false,
                          badge: '',
                        }
                        updateConfig('memberOffers', {
                          offers: [...config.memberOffers.offers, newOffer],
                        })
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Añadir oferta
                    </Button>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 15. Social Section */}
          <AccordionItem value="social" className="rounded-xl border border-border bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionHeader
                section={SECTIONS[14]}
                completion={getSectionCompletion('social', config)}
              />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { key: 'instagram', icon: Instagram, placeholder: 'https://instagram.com/...' },
                  { key: 'facebook', icon: Facebook, placeholder: 'https://facebook.com/...' },
                  { key: 'youtube', icon: Youtube, placeholder: 'https://youtube.com/...' },
                  { key: 'tiktok', icon: Music2, placeholder: 'https://tiktok.com/@...' },
                  { key: 'x', icon: X, placeholder: 'https://x.com/...' },
                  { key: 'tripadvisor', icon: Star, placeholder: 'https://tripadvisor.com/...' },
                  { key: 'web', icon: Globe, placeholder: 'https://...' },
                ].map(({ key, icon: Icon, placeholder }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    <Input
                      value={config.social[key as keyof typeof config.social]}
                      onChange={e =>
                        updateConfig('social', { [key]: e.target.value })
                      }
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 16. Contact Section */}
          <AccordionItem value="contact" className="rounded-xl border border-border bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <SectionHeader
                section={SECTIONS[15]}
                completion={getSectionCompletion('contact', config)}
              />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={config.contact.phone}
                    onChange={e =>
                      updateConfig('contact', { phone: e.target.value })
                    }
                    placeholder="+34 974 500 123"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={config.contact.email}
                    onChange={e =>
                      updateConfig('contact', { email: e.target.value })
                    }
                    placeholder="hola@quesosdelpirineopardo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input
                    value={config.contact.whatsapp}
                    onChange={e =>
                      updateConfig('contact', { whatsapp: e.target.value })
                    }
                    placeholder="+34 628 123 456"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Persona de contacto (opcional)</Label>
                  <Input
                    value={config.contact.contactPerson}
                    onChange={e =>
                      updateConfig('contact', { contactPerson: e.target.value })
                    }
                    placeholder="Lucía García"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>URL formulario de contacto externo (opcional)</Label>
                  <Input
                    value={config.contact.contactFormUrl}
                    onChange={e =>
                      updateConfig('contact', { contactFormUrl: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </main>

      {/* Sticky Bottom Save Bar */}
      <footer className="sticky bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={`${
                completionPercent === 100
                  ? 'border-olive bg-olive/10 text-olive'
                  : 'border-copper bg-copper/10 text-copper'
              }`}
            >
              Perfil completo {completionPercent}%
            </Badge>
            {isDirty && (
              <span className="text-xs text-amber-600">Cambios sin guardar</span>
            )}
            {!isDirty && (
              <span className="text-xs text-muted-foreground">Sin cambios</span>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            {savedPill ? (
              <>
                <Check className="h-4 w-4" />
                <span className="rounded-full bg-olive px-2 py-0.5 text-xs">
                  Guardado ✓
                </span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar cambios
              </>
            )}
          </Button>
        </div>
      </footer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteDialog}
        onOpenChange={open => !open && setDeleteDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este elemento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El elemento se eliminará
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
