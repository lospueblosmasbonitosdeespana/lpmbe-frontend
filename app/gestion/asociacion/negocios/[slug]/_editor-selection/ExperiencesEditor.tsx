'use client'

import { TextField, TextareaField, EditorGrid, ListItemRow, AddButton, SwitchField, SectionLabel } from '../_editor-alojamiento/AdminField'
import type { HotelConfig } from '@/app/_components/selection/types'

interface Props {
  value: HotelConfig['experiences']
  onChange: (v: HotelConfig['experiences']) => void
}

export function ExperiencesEditor({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<HotelConfig['experiences'][number]>) => {
    const next = [...value]
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  return (
    <div className="space-y-3">
      <SectionLabel>Experiencias del entorno</SectionLabel>
      {value.map((e, i) => (
        <ListItemRow key={i} onDelete={() => onChange(value.filter((_, idx) => idx !== i))}>
          <div className="space-y-3">
            <EditorGrid cols={3}>
              <TextField label="Título" value={e.title} onChange={v => update(i, { title: v })} maxLength={80} />
              <TextField label="Duración" value={e.duration} onChange={v => update(i, { duration: v })} placeholder="4 horas" maxLength={30} />
              <SwitchField label="Exclusiva" hint="Marca como exclusiva del hotel" checked={e.exclusive} onChange={v => update(i, { exclusive: v })} />
            </EditorGrid>
            <TextField label="URL imagen" value={e.image} onChange={v => update(i, { image: v })} placeholder="/images/exp-horses.jpg" />
            <TextareaField label="Descripción" value={e.description} onChange={v => update(i, { description: v })} rows={2} maxLength={250} />
          </div>
        </ListItemRow>
      ))}
      <AddButton label="Añadir experiencia" onClick={() => onChange([...value, { title: '', duration: '', exclusive: false, image: '', description: '' }])} />
    </div>
  )
}
