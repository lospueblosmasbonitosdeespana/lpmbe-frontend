'use client'

import { TextField, TextareaField, EditorGrid, ListItemRow, AddButton, SwitchField, SectionLabel } from '../_editor-alojamiento/AdminField'
import { ImageUploadField } from '../_editor-shared/ImageUploadField'
import type { HotelConfig } from '@/app/_components/selection/types'

interface Props {
  value: HotelConfig['gastronomy']
  onChange: (v: HotelConfig['gastronomy']) => void
}

export function GastronomyEditor({ value, onChange }: Props) {
  const update = <K extends keyof HotelConfig['gastronomy']>(k: K, v: HotelConfig['gastronomy'][K]) =>
    onChange({ ...value, [k]: v })

  return (
    <div className="space-y-5">
      <EditorGrid>
        <TextField label="Eyebrow" value={value.eyebrow} onChange={v => update('eyebrow', v)} maxLength={40} />
        <TextField label="Nombre del restaurante" value={value.restaurantName} onChange={v => update('restaurantName', v)} maxLength={80} />
      </EditorGrid>

      <TextareaField
        label="Descripción del concepto"
        value={value.description}
        onChange={v => update('description', v)}
        rows={5}
        maxLength={600}
      />

      <SectionLabel>Chef</SectionLabel>
      <EditorGrid>
        <TextField label="Nombre del chef" value={value.chefName} onChange={v => update('chefName', v)} maxLength={60} />
        <TextField label="Cargo / título" value={value.chefTitle} onChange={v => update('chefTitle', v)} maxLength={80} />
      </EditorGrid>
      <ImageUploadField
        label="Foto del chef"
        hint="Retrato cuadrado o vertical recomendado"
        value={value.chefImage}
        onChange={v => update('chefImage', v)}
        folder="negocios/selection/chef"
        square
      />

      <ImageUploadField
        label="Imagen del restaurante"
        value={value.image}
        onChange={v => update('image', v)}
        folder="negocios/selection/restaurant"
      />

      <SwitchField label="¿Estrella Michelin?" hint="Muestra el sello Michelin sobre la imagen" checked={value.michelinStar} onChange={v => update('michelinStar', v)} />

      <div>
        <SectionLabel>Platos destacados</SectionLabel>
        <div className="space-y-2">
          {value.dishes.map((d, i) => (
            <ListItemRow key={i} onDelete={() => update('dishes', value.dishes.filter((_, idx) => idx !== i))}>
              <TextareaField
                label={`Plato ${i + 1}`}
                value={d}
                onChange={v => {
                  const next = [...value.dishes]
                  next[i] = v
                  update('dishes', next)
                }}
                rows={2}
              />
            </ListItemRow>
          ))}
          <AddButton label="Añadir plato" onClick={() => update('dishes', [...value.dishes, ''])} />
        </div>
      </div>
    </div>
  )
}
