'use client'

import { TextField, EditorGrid, ListItemRow, AddButton, SelectField, SectionLabel } from '../_editor-alojamiento/AdminField'
import type { HotelConfig } from '@/app/_components/selection/types'

const ICON_OPTIONS = [
  { value: 'Clock', label: 'Reloj (Clock)' },
  { value: 'Key', label: 'Llave (Key)' },
  { value: 'Languages', label: 'Idiomas (Languages)' },
  { value: 'Car', label: 'Coche / Parking (Car)' },
  { value: 'PawPrint', label: 'Mascota (PawPrint)' },
  { value: 'Accessibility', label: 'Accesibilidad' },
  { value: 'Wifi', label: 'WiFi' },
  { value: 'ShieldCheck', label: 'Cancelación (ShieldCheck)' },
  { value: 'CreditCard', label: 'Pagos (CreditCard)' },
  { value: 'BabyIcon', label: 'Niños (BabyIcon)' },
  { value: 'Cigarette', label: 'Fumadores (Cigarette)' },
]

interface Props {
  value: HotelConfig['practicalInfo']
  onChange: (v: HotelConfig['practicalInfo']) => void
}

export function PracticalInfoEditor({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<HotelConfig['practicalInfo'][number]>) => {
    const next = [...value]
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  return (
    <div className="space-y-3">
      <SectionLabel>Información práctica</SectionLabel>
      {value.map((p, i) => (
        <ListItemRow key={i} onDelete={() => onChange(value.filter((_, idx) => idx !== i))}>
          <EditorGrid cols={3}>
            <SelectField label="Icono" value={p.icon} onChange={v => update(i, { icon: v })} options={ICON_OPTIONS} />
            <TextField label="Etiqueta" value={p.label} onChange={v => update(i, { label: v })} placeholder="Check-in" maxLength={40} />
            <TextField label="Valor" value={p.value} onChange={v => update(i, { value: v })} placeholder="A partir de las 15:00 h" maxLength={120} />
          </EditorGrid>
        </ListItemRow>
      ))}
      <AddButton label="Añadir info" onClick={() => onChange([...value, { icon: 'Clock', label: '', value: '' }])} />
    </div>
  )
}
