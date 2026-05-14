'use client'

import { TextField, EditorGrid, ListItemRow, AddButton, SelectField, SectionLabel } from './AdminField'
import type { LodgingLandingConfig, PracticalIcon } from './lodging-types'

const ICON_OPTIONS: { value: PracticalIcon; label: string }[] = [
  { value: 'clock',         label: 'Reloj (horario)' },
  { value: 'x-circle',      label: 'X (cancelación)' },
  { value: 'credit-card',   label: 'Tarjeta (pago)' },
  { value: 'globe',         label: 'Globo (idiomas)' },
  { value: 'baby',          label: 'Bebé' },
  { value: 'paw-print',     label: 'Pata (mascotas)' },
  { value: 'shield',        label: 'Escudo (licencia)' },
  { value: 'accessibility', label: 'Accesibilidad' },
]

interface Props {
  value: LodgingLandingConfig['practicalInfo']
  onChange: (v: LodgingLandingConfig['practicalInfo']) => void
}

export function PracticalInfoEditor({ value, onChange }: Props) {
  const setItems = (items: LodgingLandingConfig['practicalInfo']['items']) =>
    onChange({ ...value, items })

  const updateItem = (id: string, patch: Partial<LodgingLandingConfig['practicalInfo']['items'][0]>) =>
    setItems(value.items.map(i => i.id === id ? { ...i, ...patch } : i))

  const removeItem = (id: string) =>
    setItems(value.items.filter(i => i.id !== id))

  const addItem = () => {
    if (value.items.length >= 8) return
    setItems([...value.items, { id: `pi${Date.now()}`, icon: 'clock', label: '', detail: '' }])
  }

  return (
    <div className="space-y-4">
      <SectionLabel>Información práctica (máx. 8 ítems)</SectionLabel>
      <div className="space-y-3">
        {value.items.map(item => (
          <ListItemRow key={item.id} onDelete={() => removeItem(item.id)} canDelete={value.items.length > 1}>
            <EditorGrid cols={3}>
              <SelectField
                label="Icono"
                value={item.icon}
                onChange={v => updateItem(item.id, { icon: v as PracticalIcon })}
                options={ICON_OPTIONS}
              />
              <TextField
                label="Etiqueta"
                value={item.label}
                onChange={v => updateItem(item.id, { label: v })}
                placeholder="Check-in"
              />
              <TextField
                label="Detalle"
                value={item.detail}
                onChange={v => updateItem(item.id, { detail: v })}
                placeholder="A partir de las 15:00 h"
              />
            </EditorGrid>
          </ListItemRow>
        ))}
      </div>
      <AddButton label="Añadir ítem" onClick={addItem} disabled={value.items.length >= 8} />
    </div>
  )
}
