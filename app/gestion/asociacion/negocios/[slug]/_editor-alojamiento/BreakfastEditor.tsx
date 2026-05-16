'use client'

import { TextField, TextareaField, SwitchField, EditorGrid, ListItemRow, AddButton, SelectField, SectionLabel } from './AdminField'
import type { LodgingLandingConfig, BreakfastIcon } from './lodging-types'

const ICON_OPTIONS: { value: BreakfastIcon; label: string }[] = [
  { value: 'leaf',   label: 'Hoja (natural)' },
  { value: 'coffee', label: 'Café' },
  { value: 'wheat',  label: 'Trigo / pan' },
  { value: 'egg',    label: 'Huevo' },
  { value: 'cheese', label: 'Queso' },
]

interface Props {
  value: LodgingLandingConfig['breakfast']
  onChange: (v: LodgingLandingConfig['breakfast']) => void
}

export function BreakfastEditor({ value, onChange }: Props) {
  const set = (patch: Partial<LodgingLandingConfig['breakfast']>) => onChange({ ...value, ...patch })

  const updateHighlight = (id: string, patch: Partial<LodgingLandingConfig['breakfast']['highlights'][0]>) =>
    set({ highlights: value.highlights.map(h => h.id === id ? { ...h, ...patch } : h) })

  const removeHighlight = (id: string) =>
    set({ highlights: value.highlights.filter(h => h.id !== id) })

  const addHighlight = () => {
    set({ highlights: [...value.highlights, { id: `bh${Date.now()}`, icon: 'leaf', text: '' }] })
  }

  return (
    <div className="space-y-5">
      <EditorGrid cols={2}>
        <TextField
          label="Antetítulo (texto pequeño sobre el título)"
          value={value.eyebrow}
          onChange={v => set({ eyebrow: v })}
          placeholder="Gastronomía"
        />
        <TextField
          label="Título"
          value={value.title}
          onChange={v => set({ title: v })}
          placeholder="Un desayuno que es…"
        />
      </EditorGrid>

      <TextareaField
        label="Descripción del desayuno"
        value={value.description}
        onChange={v => set({ description: v })}
        rows={3}
        maxLength={500}
      />

      <EditorGrid cols={2}>
        <TextField
          label="Horario"
          value={value.schedule}
          onChange={v => set({ schedule: v })}
          placeholder="8:00 — 10:30 h"
        />
        <SwitchField
          label="Desayuno incluido en el precio"
          checked={value.included}
          onChange={v => set({ included: v })}
        />
      </EditorGrid>

      <div>
        <SectionLabel>Aspectos destacados</SectionLabel>
        <div className="space-y-2">
          {value.highlights.map(h => (
            <ListItemRow key={h.id} onDelete={() => removeHighlight(h.id)} canDelete={value.highlights.length > 1}>
              <EditorGrid cols={2}>
                <SelectField
                  label="Icono"
                  value={h.icon}
                  onChange={v => updateHighlight(h.id, { icon: v as BreakfastIcon })}
                  options={ICON_OPTIONS}
                />
                <TextField
                  label="Texto"
                  value={h.text}
                  onChange={v => updateHighlight(h.id, { text: v })}
                  placeholder="Miel artesana del Sobrarbe…"
                />
              </EditorGrid>
            </ListItemRow>
          ))}
        </div>
        <div className="mt-2">
          <AddButton label="Añadir destacado" onClick={addHighlight} />
        </div>
      </div>

      <TextField
        label="Nota al pie"
        hint="Se muestra en cursiva bajo la lista"
        value={value.note}
        onChange={v => set({ note: v })}
        placeholder="También disponible: media pensión…"
      />
    </div>
  )
}
