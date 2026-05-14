'use client'

import { TextField, EditorGrid, ListItemRow, AddButton, SectionLabel } from './AdminField'
import type { LodgingLandingConfig } from './lodging-types'

interface Props {
  value: LodgingLandingConfig['hero']
  onChange: (v: LodgingLandingConfig['hero']) => void
}

const PROPERTY_TYPES = ['Hotel Rural', 'Casa Rural', 'Agroturismo', 'Glamping', 'Posada', 'Masía', 'Parador', 'Otro']

export function HeroEditor({ value, onChange }: Props) {
  const set = (patch: Partial<LodgingLandingConfig['hero']>) => onChange({ ...value, ...patch })

  const updateBadge = (id: string, text: string) =>
    set({ badges: value.badges.map(b => b.id === id ? { ...b, text } : b) })

  const addBadge = () => {
    if (value.badges.length >= 4) return
    set({ badges: [...value.badges, { id: `b${Date.now()}`, text: 'Nueva etiqueta' }] })
  }

  const removeBadge = (id: string) =>
    set({ badges: value.badges.filter(b => b.id !== id) })

  return (
    <div className="space-y-5">
      <EditorGrid cols={2}>
        <TextField
          label="Tagline / eslogan"
          hint="Frase corta que aparece bajo el nombre en el hero"
          value={value.tagline}
          onChange={v => set({ tagline: v })}
          placeholder="Donde el tiempo se detiene…"
          maxLength={120}
        />
        <TextField
          label="Texto de ubicación"
          hint="Se muestra junto al icono de pin en el hero"
          value={value.locationText}
          onChange={v => set({ locationText: v })}
          placeholder="Aínsa · Huesca, Aragón"
        />
      </EditorGrid>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold" style={{ color: 'oklch(0.40 0.06 50)' }}>
          Tipo de alojamiento
        </label>
        <select
          value={value.propertyType}
          onChange={e => set({ propertyType: e.target.value })}
          className="h-8 w-full max-w-xs rounded-md border px-3 text-sm bg-white focus:outline-none"
          style={{ borderColor: 'oklch(0.85 0.015 70)', color: 'oklch(0.25 0.05 50)' }}
        >
          {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Badges */}
      <div>
        <SectionLabel>Etiquetas del hero (máx. 4)</SectionLabel>
        <div className="space-y-2">
          {value.badges.map(badge => (
            <ListItemRow key={badge.id} onDelete={() => removeBadge(badge.id)} canDelete={value.badges.length > 1}>
              <TextField
                label="Texto de etiqueta"
                value={badge.text}
                onChange={v => updateBadge(badge.id, v)}
                placeholder="Imprescindible LPMBE"
              />
            </ListItemRow>
          ))}
        </div>
        <div className="mt-2">
          <AddButton label="Añadir etiqueta" onClick={addBadge} disabled={value.badges.length >= 4} />
        </div>
      </div>
    </div>
  )
}
