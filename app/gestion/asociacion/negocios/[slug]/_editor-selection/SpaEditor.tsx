'use client'

import { TextField, TextareaField, EditorGrid, ListItemRow, AddButton, SelectField, SectionLabel } from '../_editor-alojamiento/AdminField'
import { ImageUploadField } from '../_editor-shared/ImageUploadField'
import type { HotelConfig } from '@/app/_components/selection/types'

const ICON_OPTIONS = [
  { value: 'Waves', label: 'Olas (Waves)' },
  { value: 'Heart', label: 'Corazón (Heart)' },
  { value: 'Sparkles', label: 'Brillos (Sparkles)' },
  { value: 'Wind', label: 'Viento (Wind)' },
  { value: 'Flower', label: 'Flor (Flower)' },
  { value: 'Sun', label: 'Sol (Sun)' },
  { value: 'Leaf', label: 'Hoja (Leaf)' },
]

interface Props {
  value: HotelConfig['spa']
  onChange: (v: HotelConfig['spa']) => void
}

export function SpaEditor({ value, onChange }: Props) {
  const update = <K extends keyof HotelConfig['spa']>(k: K, v: HotelConfig['spa'][K]) =>
    onChange({ ...value, [k]: v })

  const updateTreatment = (i: number, patch: Partial<HotelConfig['spa']['treatments'][number]>) => {
    const next = [...value.treatments]
    next[i] = { ...next[i], ...patch }
    update('treatments', next)
  }

  return (
    <div className="space-y-5">
      <TextField label="Título del spa" value={value.title} onChange={v => update('title', v)} maxLength={120} />
      <TextareaField label="Descripción" value={value.description} onChange={v => update('description', v)} rows={5} maxLength={600} />
      <ImageUploadField label="Imagen del spa" value={value.image} onChange={v => update('image', v)} folder="negocios/selection/spa" />

      <div>
        <SectionLabel>Tratamientos / áreas</SectionLabel>
        <div className="space-y-2">
          {value.treatments.map((t, i) => (
            <ListItemRow key={i} onDelete={() => update('treatments', value.treatments.filter((_, idx) => idx !== i))}>
              <div className="space-y-3">
                <EditorGrid cols={3}>
                  <SelectField label="Icono" value={t.icon} onChange={v => updateTreatment(i, { icon: v })} options={ICON_OPTIONS} />
                  <TextField label="Nombre" value={t.name} onChange={v => updateTreatment(i, { name: v })} maxLength={60} />
                  <div />
                </EditorGrid>
                <TextareaField label="Descripción" value={t.description} onChange={v => updateTreatment(i, { description: v })} rows={2} maxLength={200} />
              </div>
            </ListItemRow>
          ))}
          <AddButton label="Añadir tratamiento" onClick={() => update('treatments', [...value.treatments, { icon: 'Sparkles', name: '', description: '' }])} />
        </div>
      </div>
    </div>
  )
}
