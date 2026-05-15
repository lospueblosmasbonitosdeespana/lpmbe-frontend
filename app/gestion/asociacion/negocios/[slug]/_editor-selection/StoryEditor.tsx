'use client'

import { TextField, TextareaField, EditorGrid, ListItemRow, AddButton, SectionLabel } from '../_editor-alojamiento/AdminField'
import type { HotelConfig } from '@/app/_components/selection/types'

interface Props {
  value: HotelConfig['story']
  onChange: (v: HotelConfig['story']) => void
}

export function StoryEditor({ value, onChange }: Props) {
  const update = <K extends keyof HotelConfig['story']>(k: K, v: HotelConfig['story'][K]) =>
    onChange({ ...value, [k]: v })

  return (
    <div className="space-y-5">
      <EditorGrid>
        <TextField label="Eyebrow" hint="Título secundario sobre el título" value={value.eyebrow} onChange={v => update('eyebrow', v)} maxLength={40} />
        <TextField label="URL imagen retrato" value={value.image} onChange={v => update('image', v)} placeholder="/images/story-portrait.jpg" />
      </EditorGrid>

      <TextField
        label="Título de la historia"
        value={value.title}
        onChange={v => update('title', v)}
        maxLength={140}
      />

      <div>
        <SectionLabel>Párrafos</SectionLabel>
        <div className="space-y-2">
          {value.paragraphs.map((p, i) => (
            <ListItemRow
              key={i}
              onDelete={() => update('paragraphs', value.paragraphs.filter((_, idx) => idx !== i))}
            >
              <TextareaField
                label={`Párrafo ${i + 1}`}
                value={p}
                onChange={v => {
                  const next = [...value.paragraphs]
                  next[i] = v
                  update('paragraphs', next)
                }}
                rows={4}
              />
            </ListItemRow>
          ))}
          <AddButton label="Añadir párrafo" onClick={() => update('paragraphs', [...value.paragraphs, ''])} />
        </div>
      </div>

      <TextField
        label="Cita destacada (pull quote)"
        value={value.pullQuote}
        onChange={v => update('pullQuote', v)}
        maxLength={140}
      />
    </div>
  )
}
