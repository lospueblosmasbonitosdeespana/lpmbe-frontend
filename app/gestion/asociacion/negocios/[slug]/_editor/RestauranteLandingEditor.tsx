'use client'

import { useState, useCallback, useMemo } from 'react'
import { Accordion } from '@/app/components/ui/accordion'
import { Settings2, Store } from 'lucide-react'

import { type LandingConfig } from './landing-config'
import { legacyToV0, v0ToLegacy } from './landing-config-adapter'
import { HeroEditor } from './hero-editor'
import { ChefEditor } from './chef-editor'
import { PhilosophyEditor } from './philosophy-editor'
import { MenusEditor } from './menus-editor'
import { DishesEditor } from './dishes-editor'
import { AmbianceEditor } from './ambiance-editor'
import { PracticalInfoEditor } from './practical-info-editor'
import { AccessEditor } from './access-editor'
import { MemberOffersEditor } from './member-offers-editor'
import { SaveBar } from './save-bar'

function calcCompletion(cfg: LandingConfig): number {
  const checks: boolean[] = [
    !!cfg.hero.tagline,
    !!cfg.hero.locationText,
    cfg.hero.badges.length > 0,
    !!cfg.chef.name,
    !!cfg.chef.bio1,
    cfg.chef.stats.length > 0,
    !!cfg.philosophy.title,
    cfg.philosophy.pillars.length >= 2,
    cfg.menus.items.length > 0,
    cfg.menus.items.some((m) => m.featured),
    cfg.dishes.items.length >= 2,
    cfg.ambiance.blocks.length > 0,
    !!cfg.practicalInfo.capacity,
    !!cfg.practicalInfo.serviceType,
    cfg.practicalInfo.dietOptions.length > 0,
    !!cfg.access.parking,
    cfg.memberOffers.offers.length > 0,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

/**
 * Lectura del landingConfig:
 *   - Si raw.v0 ya existe (schema V0), úsalo.
 *   - Si raw tiene claves legacy en español (chef.nombre, platos, menus.items[].cursos…),
 *     adáptalas al schema V0 al vuelo para que el editor muestre los datos reales
 *     (incluidas las fotos del seed).
 *   - Si está vacío, DEMO_CONFIG.
 */
function parseLandingConfig(raw: Record<string, any> | null | undefined): LandingConfig {
  return legacyToV0(raw)
}

interface RestauranteLandingEditorProps {
  negocioId: number
  negocioNombre: string
  negocioSlug?: string | null
  puebloSlug?: string | null
  initialLandingConfig: Record<string, any> | null | undefined
  onSaved?: () => void
}

export default function RestauranteLandingEditor({
  negocioId,
  negocioNombre,
  negocioSlug,
  puebloSlug,
  initialLandingConfig,
  onSaved,
}: RestauranteLandingEditorProps) {
  const initial = useMemo(() => parseLandingConfig(initialLandingConfig), [initialLandingConfig])
  const [config, setConfig] = useState<LandingConfig>(initial)
  const [savedConfig, setSavedConfig] = useState<LandingConfig>(initial)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig)
  const completion = useMemo(() => calcCompletion(config), [config])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      // Mergeamos: preservamos campos del raw que el adapter no conoce
      // (template, etc.), regeneramos el legacy en español a partir del V0
      // (para que la página pública refleje los cambios) y guardamos
      // también el V0 íntegro bajo `v0` (para que el editor pueda releer
      // exactamente lo que escribiste).
      const baseRaw =
        initialLandingConfig && typeof initialLandingConfig === 'object'
          ? initialLandingConfig
          : {}
      const legacy = v0ToLegacy(config)
      const merged = { ...baseRaw, ...legacy, v0: config }
      const res = await fetch(`/api/club/negocios/${negocioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landingConfig: merged }),
      })
      if (res.ok) {
        setSavedConfig(config)
        setLastSaved(new Date())
        onSaved?.()
      }
    } catch {
    } finally {
      setIsSaving(false)
    }
  }, [config, negocioId, onSaved, initialLandingConfig])

  const handleReset = useCallback(() => {
    setConfig(initial)
    setSavedConfig(initial)
    setLastSaved(null)
  }, [initial])

  const handlePreview = useCallback(() => {
    if (puebloSlug && negocioSlug) {
      window.open(`/donde-comer/${puebloSlug}/${negocioSlug}`, '_blank')
    }
  }, [puebloSlug, negocioSlug])

  function update<K extends keyof LandingConfig>(key: K, val: LandingConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: val }))
  }

  return (
    <div className="min-h-screen bg-[oklch(0.96_0.008_60)] pb-24">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="size-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
            <Store className="size-4 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-sm text-foreground truncate">
              {negocioNombre} — Editor de página premium
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Club Los Pueblos Más Bonitos de España
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/60 px-5 py-4 flex items-start gap-3">
          <div className="size-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <Settings2 className="size-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-900">
              Completa cada sección para maximizar el impacto de tu página pública.
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Los cambios se guardan manualmente con el botón inferior. Usa &quot;Vista previa&quot; para ver cómo queda antes de publicar.
            </p>
          </div>
        </div>

        <Accordion
          type="multiple"
          defaultValue={['hero', 'chef']}
          className="space-y-3"
        >
          <HeroEditor
            value={config.hero}
            onChange={(v) => update('hero', v)}
          />
          <ChefEditor
            value={config.chef}
            onChange={(v) => update('chef', v)}
          />
          <PhilosophyEditor
            value={config.philosophy}
            onChange={(v) => update('philosophy', v)}
          />
          <MenusEditor
            value={config.menus}
            onChange={(v) => update('menus', v)}
          />
          <DishesEditor
            value={config.dishes}
            onChange={(v) => update('dishes', v)}
          />
          <AmbianceEditor
            value={config.ambiance}
            onChange={(v) => update('ambiance', v)}
          />
          <PracticalInfoEditor
            value={config.practicalInfo}
            onChange={(v) => update('practicalInfo', v)}
          />
          <AccessEditor
            value={config.access}
            onChange={(v) => update('access', v)}
          />
          <MemberOffersEditor
            value={config.memberOffers}
            onChange={(v) => update('memberOffers', v)}
          />
        </Accordion>
      </main>

      <SaveBar
        completion={completion}
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={handleReset}
        onPreview={puebloSlug && negocioSlug ? handlePreview : undefined}
        lastSaved={lastSaved}
      />
    </div>
  )
}
