'use client'

import { TextField, TextareaField, EditorGrid, ListItemRow, AddButton, SelectField, SectionLabel } from '../_editor-alojamiento/AdminField'
import type { HotelConfig } from '@/app/_components/selection/types'

const ICON_OPTIONS = [
  { value: 'Award', label: 'Premio' },
  { value: 'Star', label: 'Estrella' },
  { value: 'BookOpen', label: 'Libro / Guía' },
  { value: 'Leaf', label: 'Hoja / Sostenibilidad' },
  { value: 'Trophy', label: 'Trofeo' },
  { value: 'Crown', label: 'Corona' },
  { value: 'Medal', label: 'Medalla' },
]

interface Props {
  value: HotelConfig['awards']
  onChange: (v: HotelConfig['awards']) => void
}

export function AwardsEditor({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<HotelConfig['awards'][number]>) => {
    const next = [...value]
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  return (
    <div className="space-y-3">
      <SectionLabel>Reconocimientos, premios y certificaciones</SectionLabel>
      {value.map((a, i) => (
        <ListItemRow key={i} onDelete={() => onChange(value.filter((_, idx) => idx !== i))}>
          <div className="space-y-3">
            <EditorGrid cols={3}>
              <SelectField label="Icono" value={a.icon} onChange={v => update(i, { icon: v })} options={ICON_OPTIONS} />
              <TextField label="Nombre del reconocimiento" value={a.name} onChange={v => update(i, { name: v })} placeholder="Relais & Châteaux" maxLength={80} />
              <TextField label="Año / Período" value={a.year} onChange={v => update(i, { year: v })} placeholder="Miembro desde 2018" maxLength={40} />
            </EditorGrid>
            <TextareaField label="Descripción" value={a.description} onChange={v => update(i, { description: v })} rows={2} maxLength={200} />
          </div>
        </ListItemRow>
      ))}
      <AddButton label="Añadir reconocimiento" onClick={() => onChange([...value, { icon: 'Award', name: '', year: '', description: '' }])} />
    </div>
  )
}
