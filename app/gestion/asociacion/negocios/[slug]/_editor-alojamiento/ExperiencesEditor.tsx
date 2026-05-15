'use client'

import { TextField, TextareaField, EditorGrid, ListItemRow, AddButton, SectionLabel } from './AdminField'
import { ImageUploadField } from '../_editor-shared/ImageUploadField'
import type { LodgingLandingConfig } from './lodging-types'

interface Props {
  value: LodgingLandingConfig['experiences']
  onChange: (v: LodgingLandingConfig['experiences']) => void
}

export function ExperiencesEditor({ value, onChange }: Props) {
  const set = (patch: Partial<LodgingLandingConfig['experiences']>) => onChange({ ...value, ...patch })

  const updateItem = (id: string, patch: Partial<LodgingLandingConfig['experiences']['items'][0]>) =>
    set({ items: value.items.map(e => e.id === id ? { ...e, ...patch } : e) })

  const removeItem = (id: string) =>
    set({ items: value.items.filter(e => e.id !== id) })

  const addItem = () => {
    if (value.items.length >= 6) return
    set({
      items: [
        ...value.items,
        {
          id: `e${Date.now()}`,
          title: 'Nueva experiencia',
          description: '',
          duration: '',
          badge: 'Incluido',
          imageUrl: '/images/exp-hiking.jpg',
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
          placeholder="Experiencias"
        />
        <TextField
          label="Título de la sección"
          value={value.title}
          onChange={v => set({ title: v })}
          placeholder="¿Qué harás durante tu escapada?"
        />
      </EditorGrid>

      <SectionLabel>Experiencias (máx. 6)</SectionLabel>
      <div className="space-y-4">
        {value.items.map(exp => (
          <ListItemRow key={exp.id} onDelete={() => removeItem(exp.id)} canDelete={value.items.length > 1}>
            <div className="space-y-3">
              <TextField
                label="Título"
                value={exp.title}
                onChange={v => updateItem(exp.id, { title: v })}
                placeholder="Senderismo por el Cañón…"
              />
              <ImageUploadField
                label="Imagen de la experiencia"
                value={exp.imageUrl}
                onChange={v => updateItem(exp.id, { imageUrl: v })}
                folder="negocios/alojamiento/experiences"
              />
              <TextareaField
                label="Descripción"
                value={exp.description}
                onChange={v => updateItem(exp.id, { description: v })}
                rows={2}
              />
              <EditorGrid cols={2}>
                <TextField
                  label="Duración"
                  value={exp.duration}
                  onChange={v => updateItem(exp.id, { duration: v })}
                  placeholder="5 h"
                />
                <TextField
                  label="Precio / etiqueta"
                  hint="Usa 'Incluido' o '35 €/persona'"
                  value={exp.badge}
                  onChange={v => updateItem(exp.id, { badge: v })}
                  placeholder="Incluido"
                />
              </EditorGrid>
            </div>
          </ListItemRow>
        ))}
      </div>
      <AddButton label="Añadir experiencia" onClick={addItem} disabled={value.items.length >= 6} />
    </div>
  )
}
