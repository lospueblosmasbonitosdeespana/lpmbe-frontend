'use client'

import { TextField, EditorGrid, ListItemRow, AddButton, SelectField, SectionLabel } from '../_editor-alojamiento/AdminField'
import type { HotelConfig } from '@/app/_components/selection/types'

const ICON_OPTIONS = [
  { value: 'BedDouble', label: 'Cama (BedDouble)' },
  { value: 'Calendar', label: 'Calendario (Calendar)' },
  { value: 'UtensilsCrossed', label: 'Cubiertos (UtensilsCrossed)' },
  { value: 'Waves', label: 'Olas / Spa (Waves)' },
  { value: 'Star', label: 'Estrella (Star)' },
  { value: 'Droplets', label: 'Gotas / Piscina (Droplets)' },
  { value: 'Award', label: 'Premio (Award)' },
  { value: 'MapPin', label: 'Pin (MapPin)' },
  { value: 'Users', label: 'Personas (Users)' },
  { value: 'Sparkles', label: 'Brillos (Sparkles)' },
]

interface Props {
  value: HotelConfig['stats']
  onChange: (v: HotelConfig['stats']) => void
}

export function StatsEditor({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<HotelConfig['stats'][number]>) => {
    const next = [...value]
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  return (
    <div className="space-y-3">
      <SectionLabel>Estadísticas rápidas (recomendado 6)</SectionLabel>
      {value.map((s, i) => (
        <ListItemRow
          key={i}
          onDelete={() => onChange(value.filter((_, idx) => idx !== i))}
        >
          <EditorGrid cols={3}>
            <SelectField
              label="Icono"
              value={s.icon}
              onChange={v => update(i, { icon: v })}
              options={ICON_OPTIONS}
            />
            <TextField
              label="Etiqueta"
              value={s.label}
              onChange={v => update(i, { label: v })}
              placeholder="Habitaciones"
              maxLength={32}
            />
            <TextField
              label="Valor"
              value={s.value}
              onChange={v => update(i, { value: v })}
              placeholder="12"
              maxLength={20}
            />
          </EditorGrid>
        </ListItemRow>
      ))}
      <AddButton
        label="Añadir stat"
        onClick={() => onChange([...value, { icon: 'Star', label: '', value: '' }])}
      />
    </div>
  )
}
