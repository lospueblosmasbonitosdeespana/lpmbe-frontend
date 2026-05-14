'use client'

import { TextField, TextareaField, EditorGrid, ListItemRow, AddButton, SelectField, SectionLabel } from './AdminField'
import type { LodgingLandingConfig, DirectionIcon } from './lodging-types'

const DIRECTION_ICONS: { value: DirectionIcon; label: string }[] = [
  { value: 'car',   label: 'Coche' },
  { value: 'bus',   label: 'Autobús' },
  { value: 'plane', label: 'Avión' },
]

interface Props {
  value: LodgingLandingConfig['location']
  onChange: (v: LodgingLandingConfig['location']) => void
}

export function LocationEditor({ value, onChange }: Props) {
  const set = (patch: Partial<LodgingLandingConfig['location']>) => onChange({ ...value, ...patch })

  // Directions
  const updateDirection = (id: string, patch: Partial<LodgingLandingConfig['location']['directions'][0]>) =>
    set({ directions: value.directions.map(d => d.id === id ? { ...d, ...patch } : d) })
  const removeDirection = (id: string) =>
    set({ directions: value.directions.filter(d => d.id !== id) })
  const addDirection = () => {
    set({ directions: [...value.directions, { id: `d${Date.now()}`, icon: 'car', title: '', content: '' }] })
  }

  // Nearby POI
  const updatePoi = (id: string, patch: Partial<LodgingLandingConfig['location']['nearbyPoi'][0]>) =>
    set({ nearbyPoi: value.nearbyPoi.map(p => p.id === id ? { ...p, ...patch } : p) })
  const removePoi = (id: string) =>
    set({ nearbyPoi: value.nearbyPoi.filter(p => p.id !== id) })
  const addPoi = () => {
    if (value.nearbyPoi.length >= 6) return
    set({ nearbyPoi: [...value.nearbyPoi, { id: `p${Date.now()}`, name: '', distance: '' }] })
  }

  return (
    <div className="space-y-6">
      <TextField
        label="Dirección completa"
        value={value.address}
        onChange={v => set({ address: v })}
        placeholder="Plaza Mayor, 2 · 22330 Aínsa · Huesca"
      />

      {/* Directions */}
      <div>
        <SectionLabel>Cómo llegar</SectionLabel>
        <div className="space-y-3">
          {value.directions.map(dir => (
            <ListItemRow key={dir.id} onDelete={() => removeDirection(dir.id)} canDelete={value.directions.length > 1}>
              <div className="space-y-3">
                <EditorGrid cols={2}>
                  <SelectField
                    label="Medio de transporte"
                    value={dir.icon}
                    onChange={v => updateDirection(dir.id, { icon: v as DirectionIcon })}
                    options={DIRECTION_ICONS}
                  />
                  <TextField
                    label="Título"
                    value={dir.title}
                    onChange={v => updateDirection(dir.id, { title: v })}
                    placeholder="En coche"
                  />
                </EditorGrid>
                <TextareaField
                  label="Instrucciones"
                  value={dir.content}
                  onChange={v => updateDirection(dir.id, { content: v })}
                  rows={2}
                />
              </div>
            </ListItemRow>
          ))}
        </div>
        <div className="mt-2">
          <AddButton label="Añadir medio de transporte" onClick={addDirection} />
        </div>
      </div>

      {/* Nearby POI */}
      <div>
        <SectionLabel>Puntos de interés cercanos (máx. 6)</SectionLabel>
        <div className="space-y-2">
          {value.nearbyPoi.map(poi => (
            <ListItemRow key={poi.id} onDelete={() => removePoi(poi.id)} canDelete={value.nearbyPoi.length > 1}>
              <EditorGrid cols={2}>
                <TextField
                  label="Nombre del lugar"
                  value={poi.name}
                  onChange={v => updatePoi(poi.id, { name: v })}
                  placeholder="Parque Nacional de Ordesa"
                />
                <TextField
                  label="Distancia"
                  value={poi.distance}
                  onChange={v => updatePoi(poi.id, { distance: v })}
                  placeholder="35 km"
                />
              </EditorGrid>
            </ListItemRow>
          ))}
        </div>
        <div className="mt-2">
          <AddButton label="Añadir punto de interés" onClick={addPoi} disabled={value.nearbyPoi.length >= 6} />
        </div>
      </div>
    </div>
  )
}
