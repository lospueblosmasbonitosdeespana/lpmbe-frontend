'use client'

import { TextField, TextareaField, EditorGrid, ListItemRow, AddButton, SectionLabel } from '../_editor-alojamiento/AdminField'
import { ImageUploadField } from '../_editor-shared/ImageUploadField'
import type { HotelConfig } from '@/app/_components/selection/types'

interface Props {
  value: HotelConfig['surroundings']
  onChange: (v: HotelConfig['surroundings']) => void
}

export function SurroundingsEditor({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<HotelConfig['surroundings'][number]>) => {
    const next = [...value]
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  return (
    <div className="space-y-3">
      <SectionLabel>Puntos de interés cercanos</SectionLabel>
      {value.map((s, i) => (
        <ListItemRow key={i} onDelete={() => onChange(value.filter((_, idx) => idx !== i))}>
          <div className="space-y-3">
            <EditorGrid>
              <TextField label="Nombre" value={s.name} onChange={v => update(i, { name: v })} placeholder="Parque Nacional de Ordesa" maxLength={80} />
              <TextField label="Distancia" value={s.distance} onChange={v => update(i, { distance: v })} placeholder="25 min en coche" maxLength={40} />
            </EditorGrid>
            <ImageUploadField label="Imagen" value={s.image} onChange={v => update(i, { image: v })} folder="negocios/selection/surroundings" />
            <TextareaField label="Descripción" value={s.description} onChange={v => update(i, { description: v })} rows={2} maxLength={250} />
          </div>
        </ListItemRow>
      ))}
      <AddButton label="Añadir punto de interés" onClick={() => onChange([...value, { name: '', distance: '', description: '', image: '' }])} />
    </div>
  )
}
