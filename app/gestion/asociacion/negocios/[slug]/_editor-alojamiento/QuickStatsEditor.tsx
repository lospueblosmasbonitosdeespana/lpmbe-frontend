'use client'

import { TextField, EditorGrid, ListItemRow, AddButton, SelectField, SectionLabel } from './AdminField'
import type { LodgingLandingConfig, StatIcon } from './lodging-types'

const ICON_OPTIONS: { value: StatIcon; label: string }[] = [
  { value: 'clock',    label: 'Reloj (horario)' },
  { value: 'bed',      label: 'Cama (habitaciones)' },
  { value: 'banknote', label: 'Billete (precio)' },
  { value: 'star',     label: 'Estrella (valoración)' },
  { value: 'calendar', label: 'Calendario (fecha)' },
  { value: 'mountain', label: 'Montaña (altitud)' },
  { value: 'users',    label: 'Personas (aforo)' },
]

interface Props {
  value: LodgingLandingConfig['quickStats']
  onChange: (v: LodgingLandingConfig['quickStats']) => void
}

export function QuickStatsEditor({ value, onChange }: Props) {
  const setItems = (items: LodgingLandingConfig['quickStats']['items']) =>
    onChange({ ...value, items })

  const update = (id: string, patch: Partial<LodgingLandingConfig['quickStats']['items'][0]>) =>
    setItems(value.items.map(item => item.id === id ? { ...item, ...patch } : item))

  const remove = (id: string) =>
    setItems(value.items.filter(i => i.id !== id))

  const add = () => {
    if (value.items.length >= 6) return
    setItems([...value.items, { id: `qs${Date.now()}`, icon: 'star', label: 'Nueva stat', value: '' }])
  }

  return (
    <div className="space-y-4">
      <SectionLabel>Estadísticas rápidas (máx. 6)</SectionLabel>
      <div className="space-y-3">
        {value.items.map(item => (
          <ListItemRow key={item.id} onDelete={() => remove(item.id)} canDelete={value.items.length > 1}>
            <EditorGrid cols={3}>
              <SelectField
                label="Icono"
                value={item.icon}
                onChange={v => update(item.id, { icon: v as StatIcon })}
                options={ICON_OPTIONS}
              />
              <TextField
                label="Etiqueta"
                value={item.label}
                onChange={v => update(item.id, { label: v })}
                placeholder="Check-in / Check-out"
              />
              <TextField
                label="Valor"
                value={item.value}
                onChange={v => update(item.id, { value: v })}
                placeholder="15:00 — 12:00"
              />
            </EditorGrid>
          </ListItemRow>
        ))}
      </div>
      <AddButton label="Añadir estadística" onClick={add} disabled={value.items.length >= 6} />
    </div>
  )
}
