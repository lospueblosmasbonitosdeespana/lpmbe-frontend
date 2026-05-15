'use client'

import { TextField, TextareaField, EditorGrid, ListItemRow, AddButton, SectionLabel } from '../_editor-alojamiento/AdminField'
import type { HotelConfig } from '@/app/_components/selection/types'

interface Props {
  value: HotelConfig['offers']
  onChange: (v: HotelConfig['offers']) => void
}

export function OffersEditor({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<HotelConfig['offers'][number]>) => {
    const next = [...value]
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  return (
    <div className="space-y-3">
      <SectionLabel>Ofertas exclusivas para socios Club LPMBE</SectionLabel>
      {value.map((o, i) => (
        <ListItemRow key={i} onDelete={() => onChange(value.filter((_, idx) => idx !== i))}>
          <div className="space-y-3">
            <EditorGrid cols={3}>
              <TextField label="Descuento" value={o.discount} onChange={v => update(i, { discount: v })} placeholder="−20%" maxLength={20} />
              <TextField label="Validez" value={o.validity} onChange={v => update(i, { validity: v })} placeholder="30 noviembre 2025" maxLength={40} />
              <TextField label="Precio desde" value={o.priceFrom} onChange={v => update(i, { priceFrom: v })} placeholder="Desde 560€" maxLength={40} />
            </EditorGrid>
            <TextField label="Título" value={o.title} onChange={v => update(i, { title: v })} maxLength={100} />
            <TextareaField label="Descripción" value={o.description} onChange={v => update(i, { description: v })} rows={3} maxLength={400} />
            <TextareaField label="Condiciones" value={o.conditions} onChange={v => update(i, { conditions: v })} rows={2} maxLength={250} />
          </div>
        </ListItemRow>
      ))}
      <AddButton label="Añadir oferta" onClick={() => onChange([...value, { discount: '', title: '', description: '', validity: '', conditions: '', priceFrom: '' }])} />
    </div>
  )
}
