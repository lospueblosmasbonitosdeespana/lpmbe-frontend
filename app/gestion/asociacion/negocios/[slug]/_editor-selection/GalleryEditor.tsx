'use client'

import { TextField, EditorGrid, ListItemRow, AddButton, SelectField, SectionLabel } from '../_editor-alojamiento/AdminField'
import type { HotelConfig } from '@/app/_components/selection/types'

const ASPECT_OPTIONS = [
  { value: 'col-span-1 row-span-1', label: '1×1 (cuadrado pequeño)' },
  { value: 'col-span-2 row-span-1', label: '2×1 (panorámica)' },
  { value: 'col-span-1 row-span-2', label: '1×2 (vertical)' },
  { value: 'col-span-2 row-span-2', label: '2×2 (grande)' },
]

interface Props {
  value: HotelConfig['gallery']
  onChange: (v: HotelConfig['gallery']) => void
}

export function GalleryEditor({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<HotelConfig['gallery'][number]>) => {
    const next = [...value]
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  return (
    <div className="space-y-3">
      <SectionLabel>Galería inmersiva (grid masonry · usa tamaños mixtos)</SectionLabel>
      <p className="text-xs" style={{ color: 'oklch(0.55 0.06 50)' }}>
        Combina cuadrados, panorámicas y verticales para crear un mosaico cinematográfico.
      </p>
      {value.map((g, i) => (
        <ListItemRow key={i} onDelete={() => onChange(value.filter((_, idx) => idx !== i))}>
          <div className="space-y-3">
            <TextField label="URL imagen" value={g.src} onChange={v => update(i, { src: v })} placeholder="/images/gallery-1.jpg" />
            <EditorGrid>
              <TextField label="Texto alternativo (alt)" value={g.alt} onChange={v => update(i, { alt: v })} maxLength={120} />
              <SelectField label="Tamaño en el grid" value={g.aspectClass} onChange={v => update(i, { aspectClass: v })} options={ASPECT_OPTIONS} />
            </EditorGrid>
          </div>
        </ListItemRow>
      ))}
      <AddButton label="Añadir foto" onClick={() => onChange([...value, { src: '', alt: '', aspectClass: 'col-span-1 row-span-1' }])} />
    </div>
  )
}
