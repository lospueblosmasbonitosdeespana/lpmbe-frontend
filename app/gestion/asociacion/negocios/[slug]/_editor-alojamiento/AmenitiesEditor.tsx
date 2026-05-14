'use client'

import { TextField, EditorGrid, ListItemRow, AddButton, SectionLabel } from './AdminField'
import type { LodgingLandingConfig } from './lodging-types'

interface Props {
  value: LodgingLandingConfig['amenities']
  onChange: (v: LodgingLandingConfig['amenities']) => void
}

export function AmenitiesEditor({ value, onChange }: Props) {
  const setCategories = (cats: LodgingLandingConfig['amenities']['categories']) =>
    onChange({ ...value, categories: cats })

  const updateCategory = (id: string, patch: Partial<LodgingLandingConfig['amenities']['categories'][0]>) =>
    setCategories(value.categories.map(c => c.id === id ? { ...c, ...patch } : c))

  const removeCategory = (id: string) =>
    setCategories(value.categories.filter(c => c.id !== id))

  const addCategory = () => {
    if (value.categories.length >= 4) return
    setCategories([...value.categories, { id: `ac${Date.now()}`, title: 'Nueva categoría', items: [] }])
  }

  const updateItem = (catId: string, itemId: string, patch: Partial<{ icon: string; label: string }>) => {
    setCategories(value.categories.map(c =>
      c.id === catId
        ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, ...patch } : i) }
        : c
    ))
  }

  const removeItem = (catId: string, itemId: string) => {
    setCategories(value.categories.map(c =>
      c.id === catId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c
    ))
  }

  const addItem = (catId: string) => {
    setCategories(value.categories.map(c =>
      c.id === catId
        ? { ...c, items: [...c.items, { id: `ai${Date.now()}`, icon: 'star', label: 'Nuevo servicio' }] }
        : c
    ))
  }

  return (
    <div className="space-y-6">
      {value.categories.map(cat => (
        <div
          key={cat.id}
          className="rounded-xl p-4 space-y-3"
          style={{ background: 'oklch(0.97 0.006 70)', border: '1px solid oklch(0.88 0.012 70)' }}
        >
          {/* Category header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <TextField
                label="Nombre de categoría"
                value={cat.title}
                onChange={v => updateCategory(cat.id, { title: v })}
                placeholder="En la habitación"
              />
            </div>
            {value.categories.length > 1 && (
              <button
                type="button"
                onClick={() => removeCategory(cat.id)}
                className="shrink-0 text-xs font-medium mt-5 underline underline-offset-2"
                style={{ color: 'oklch(0.55 0.15 25)' }}
              >
                Eliminar categoría
              </button>
            )}
          </div>

          {/* Items */}
          <SectionLabel>Servicios de esta categoría</SectionLabel>
          <div className="space-y-2">
            {cat.items.map(item => (
              <ListItemRow key={item.id} onDelete={() => removeItem(cat.id, item.id)}>
                <EditorGrid cols={2}>
                  <TextField
                    label="Nombre del icono (Lucide)"
                    hint="e.g. wifi, flame, paw-print"
                    value={item.icon}
                    onChange={v => updateItem(cat.id, item.id, { icon: v })}
                    placeholder="wifi"
                  />
                  <TextField
                    label="Etiqueta visible"
                    value={item.label}
                    onChange={v => updateItem(cat.id, item.id, { label: v })}
                    placeholder="WiFi gratuito"
                  />
                </EditorGrid>
              </ListItemRow>
            ))}
          </div>
          <AddButton label="Añadir servicio" onClick={() => addItem(cat.id)} />
        </div>
      ))}

      <AddButton label="Añadir categoría" onClick={addCategory} disabled={value.categories.length >= 4} />
    </div>
  )
}
