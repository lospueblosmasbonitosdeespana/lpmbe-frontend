'use client'

import { TextField, TextareaField, EditorGrid, ListItemRow, AddButton, SectionLabel } from './AdminField'
import { ImageUploadField } from '../_editor-shared/ImageUploadField'
import type { LodgingLandingConfig } from './lodging-types'

interface Props {
  value: LodgingLandingConfig['rooms']
  onChange: (v: LodgingLandingConfig['rooms']) => void
}

export function RoomsEditor({ value, onChange }: Props) {
  const set = (patch: Partial<LodgingLandingConfig['rooms']>) => onChange({ ...value, ...patch })

  const updateItem = (id: string, patch: Partial<LodgingLandingConfig['rooms']['items'][0]>) =>
    set({ items: value.items.map(r => r.id === id ? { ...r, ...patch } : r) })

  const removeItem = (id: string) =>
    set({ items: value.items.filter(r => r.id !== id) })

  const addItem = () => {
    if (value.items.length >= 8) return
    set({
      items: [
        ...value.items,
        {
          id: `r${Date.now()}`,
          name: 'Nueva habitación',
          description: '',
          guests: 2,
          beds: '',
          price: '',
          imageUrl: '/images/room-1.jpg',
        },
      ],
    })
  }

  return (
    <div className="space-y-5">
      <EditorGrid cols={2}>
        <TextField
          label="Subtítulo (eyebrow)"
          value={value.eyebrow}
          onChange={v => set({ eyebrow: v })}
          placeholder="Nuestras estancias"
        />
        <TextField
          label="Título de la sección"
          value={value.title}
          onChange={v => set({ title: v })}
          placeholder="Ocho formas de dormir…"
        />
      </EditorGrid>

      <SectionLabel>Habitaciones (máx. 8)</SectionLabel>
      <div className="space-y-4">
        {value.items.map(room => (
          <ListItemRow key={room.id} onDelete={() => removeItem(room.id)} canDelete={value.items.length > 1}>
            <div className="space-y-3">
              <TextField
                label="Nombre de la habitación"
                value={room.name}
                onChange={v => updateItem(room.id, { name: v })}
                placeholder="Habitación Superior…"
              />
              <ImageUploadField
                label="Imagen de la habitación"
                value={room.imageUrl}
                onChange={v => updateItem(room.id, { imageUrl: v })}
                folder="negocios/alojamiento/rooms"
              />
              <TextareaField
                label="Descripción"
                value={room.description}
                onChange={v => updateItem(room.id, { description: v })}
                rows={2}
                maxLength={200}
              />
              <EditorGrid cols={3}>
                <TextField
                  label="Tipo de cama"
                  value={room.beds}
                  onChange={v => updateItem(room.id, { beds: v })}
                  placeholder="Cama king"
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'oklch(0.40 0.06 50)' }}>
                    Nº huéspedes
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={room.guests}
                    onChange={e => updateItem(room.id, { guests: Number(e.target.value) })}
                    className="h-8 w-full rounded-md border px-3 text-sm bg-white focus:outline-none"
                    style={{ borderColor: 'oklch(0.85 0.015 70)', color: 'oklch(0.25 0.05 50)' }}
                  />
                </div>
                <TextField
                  label="Precio"
                  value={room.price}
                  onChange={v => updateItem(room.id, { price: v })}
                  placeholder="Desde 165 €/noche"
                />
              </EditorGrid>
            </div>
          </ListItemRow>
        ))}
      </div>
      <AddButton label="Añadir habitación" onClick={addItem} disabled={value.items.length >= 8} />
    </div>
  )
}
