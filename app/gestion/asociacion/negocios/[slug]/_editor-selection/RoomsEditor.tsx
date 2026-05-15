'use client'

import { TextField, EditorGrid, ListItemRow, AddButton, SectionLabel } from '../_editor-alojamiento/AdminField'
import type { HotelConfig } from '@/app/_components/selection/types'

interface Props {
  value: HotelConfig['rooms']
  onChange: (v: HotelConfig['rooms']) => void
}

export function RoomsEditor({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<HotelConfig['rooms'][number]>) => {
    const next = [...value]
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  return (
    <div className="space-y-3">
      <SectionLabel>Suites y habitaciones</SectionLabel>
      {value.map((r, i) => (
        <ListItemRow key={i} onDelete={() => onChange(value.filter((_, idx) => idx !== i))}>
          <div className="space-y-3">
            <EditorGrid cols={3}>
              <TextField label="Nombre" value={r.name} onChange={v => update(i, { name: v })} placeholder="Suite Real" maxLength={60} />
              <TextField label="Tamaño" value={r.size} onChange={v => update(i, { size: v })} placeholder="95 m²" maxLength={20} />
              <TextField label="Precio desde" value={r.priceFrom} onChange={v => update(i, { priceFrom: v })} placeholder="Desde 480€ / noche" maxLength={40} />
            </EditorGrid>
            <TextField label="URL imagen" value={r.image} onChange={v => update(i, { image: v })} placeholder="/images/suite-real.jpg" />
            <TextField
              label="Servicios (separados por coma)"
              hint="Ej: Terraza privada, Bañera exenta, Vistas al Pirineo"
              value={r.amenities.join(', ')}
              onChange={v => update(i, { amenities: v.split(',').map(s => s.trim()).filter(Boolean) })}
            />
          </div>
        </ListItemRow>
      ))}
      <AddButton label="Añadir habitación" onClick={() => onChange([...value, { name: '', size: '', priceFrom: '', amenities: [], image: '' }])} />
    </div>
  )
}
