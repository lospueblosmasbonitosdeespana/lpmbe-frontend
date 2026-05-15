'use client'

import { TextField, TextareaField, EditorGrid, ListItemRow, AddButton, SectionLabel } from '../_editor-alojamiento/AdminField'
import type { HotelConfig } from '@/app/_components/selection/types'

interface Props {
  value: HotelConfig['reviews']
  onChange: (v: HotelConfig['reviews']) => void
}

export function ReviewsEditor({ value, onChange }: Props) {
  const update = <K extends keyof HotelConfig['reviews']>(k: K, v: HotelConfig['reviews'][K]) =>
    onChange({ ...value, [k]: v })

  const updateItem = (i: number, patch: Partial<HotelConfig['reviews']['items'][number]>) => {
    const next = [...value.items]
    next[i] = { ...next[i], ...patch }
    update('items', next)
  }

  return (
    <div className="space-y-5">
      <EditorGrid>
        <TextField
          label="Valoración global (0–5)"
          value={String(value.overall)}
          onChange={v => update('overall', Number(v) || 0)}
          placeholder="4.9"
        />
        <TextField
          label="Total de opiniones"
          value={String(value.count)}
          onChange={v => update('count', Number(v) || 0)}
          placeholder="312"
        />
      </EditorGrid>

      <div>
        <SectionLabel>Testimonios destacados</SectionLabel>
        <div className="space-y-2">
          {value.items.map((r, i) => (
            <ListItemRow key={i} onDelete={() => update('items', value.items.filter((_, idx) => idx !== i))}>
              <div className="space-y-3">
                <TextareaField label="Cita" value={r.quote} onChange={v => updateItem(i, { quote: v })} rows={3} maxLength={400} />
                <EditorGrid cols={3}>
                  <TextField label="Autor" value={r.author} onChange={v => updateItem(i, { author: v })} maxLength={60} />
                  <TextField label="Origen" value={r.origin} onChange={v => updateItem(i, { origin: v })} placeholder="Londres, Reino Unido" maxLength={60} />
                  <TextField label="Fecha" value={r.date} onChange={v => updateItem(i, { date: v })} placeholder="Marzo 2025" maxLength={40} />
                </EditorGrid>
              </div>
            </ListItemRow>
          ))}
          <AddButton label="Añadir testimonio" onClick={() => update('items', [...value.items, { quote: '', author: '', origin: '', date: '' }])} />
        </div>
      </div>
    </div>
  )
}
