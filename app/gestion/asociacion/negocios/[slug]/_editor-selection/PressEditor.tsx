'use client'

import { TextField, TextareaField, EditorGrid, ListItemRow, AddButton, SectionLabel } from '../_editor-alojamiento/AdminField'
import type { HotelConfig } from '@/app/_components/selection/types'

interface Props {
  value: HotelConfig['press']
  onChange: (v: HotelConfig['press']) => void
}

export function PressEditor({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<HotelConfig['press'][number]>) => {
    const next = [...value]
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  return (
    <div className="space-y-3">
      <SectionLabel>Menciones en prensa internacional</SectionLabel>
      {value.map((p, i) => (
        <ListItemRow key={i} onDelete={() => onChange(value.filter((_, idx) => idx !== i))}>
          <div className="space-y-3">
            <EditorGrid>
              <TextField label="Medio" value={p.outlet} onChange={v => update(i, { outlet: v })} placeholder="Condé Nast Traveler" maxLength={60} />
              <TextField label="Fecha" value={p.date} onChange={v => update(i, { date: v })} placeholder="Febrero 2025" maxLength={40} />
            </EditorGrid>
            <TextareaField label="Cita" value={p.quote} onChange={v => update(i, { quote: v })} rows={3} maxLength={300} />
          </div>
        </ListItemRow>
      ))}
      <AddButton label="Añadir mención" onClick={() => onChange([...value, { outlet: '', quote: '', date: '' }])} />
    </div>
  )
}
