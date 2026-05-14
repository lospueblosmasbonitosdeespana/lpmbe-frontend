'use client'

import { TextField, TextareaField, EditorGrid, ListItemRow, AddButton, SectionLabel } from './AdminField'
import type { LodgingLandingConfig } from './lodging-types'

interface Props {
  value: LodgingLandingConfig['reviews']
  onChange: (v: LodgingLandingConfig['reviews']) => void
}

export function ReviewsEditor({ value, onChange }: Props) {
  const set = (patch: Partial<LodgingLandingConfig['reviews']>) => onChange({ ...value, ...patch })

  const updateItem = (id: string, patch: Partial<LodgingLandingConfig['reviews']['items'][0]>) =>
    set({ items: value.items.map(r => r.id === id ? { ...r, ...patch } : r) })

  const removeItem = (id: string) =>
    set({ items: value.items.filter(r => r.id !== id) })

  const addItem = () => {
    if (value.items.length >= 4) return
    set({
      items: [
        ...value.items,
        { id: `rv${Date.now()}`, quote: '', author: '', origin: '', stars: 5, date: '' },
      ],
    })
  }

  return (
    <div className="space-y-5">
      <EditorGrid cols={2}>
        <TextField
          label="Puntuación global"
          hint="Número que aparece en grande, e.g. '4.8'"
          value={value.overallRating}
          onChange={v => set({ overallRating: v })}
          placeholder="4.8"
        />
        <TextField
          label="Total de reseñas"
          hint="Número visible, e.g. '127'"
          value={value.totalReviews}
          onChange={v => set({ totalReviews: v })}
          placeholder="127"
        />
      </EditorGrid>

      <SectionLabel>Reseñas destacadas (máx. 4)</SectionLabel>
      <div className="space-y-4">
        {value.items.map(review => (
          <ListItemRow key={review.id} onDelete={() => removeItem(review.id)} canDelete={value.items.length > 1}>
            <div className="space-y-3">
              <TextareaField
                label="Texto de la reseña"
                value={review.quote}
                onChange={v => updateItem(review.id, { quote: v })}
                rows={3}
              />
              <EditorGrid cols={3}>
                <TextField
                  label="Autor"
                  value={review.author}
                  onChange={v => updateItem(review.id, { author: v })}
                  placeholder="María G."
                />
                <TextField
                  label="Origen"
                  value={review.origin}
                  onChange={v => updateItem(review.id, { origin: v })}
                  placeholder="Madrid"
                />
                <TextField
                  label="Fecha"
                  value={review.date}
                  onChange={v => updateItem(review.id, { date: v })}
                  placeholder="Octubre 2024"
                />
              </EditorGrid>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: 'oklch(0.40 0.06 50)' }}>
                  Estrellas (1–5)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={review.stars}
                  onChange={e => updateItem(review.id, { stars: Math.min(5, Math.max(1, Number(e.target.value))) })}
                  className="h-8 w-24 rounded-md border px-3 text-sm bg-white focus:outline-none"
                  style={{ borderColor: 'oklch(0.85 0.015 70)', color: 'oklch(0.25 0.05 50)' }}
                />
              </div>
            </div>
          </ListItemRow>
        ))}
      </div>
      <AddButton label="Añadir reseña" onClick={addItem} disabled={value.items.length >= 4} />
    </div>
  )
}
