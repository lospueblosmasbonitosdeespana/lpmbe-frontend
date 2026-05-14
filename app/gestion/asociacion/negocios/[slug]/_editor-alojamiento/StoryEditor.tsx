'use client'

import { TextField, TextareaField, EditorGrid, ListItemRow, AddButton, SectionLabel } from './AdminField'
import type { LodgingLandingConfig } from './lodging-types'

interface Props {
  value: LodgingLandingConfig['story']
  onChange: (v: LodgingLandingConfig['story']) => void
}

export function StoryEditor({ value, onChange }: Props) {
  const set = (patch: Partial<LodgingLandingConfig['story']>) => onChange({ ...value, ...patch })

  const updateParagraph = (index: number, text: string) => {
    const paragraphs = [...value.paragraphs]
    paragraphs[index] = text
    set({ paragraphs })
  }

  const removeParagraph = (index: number) =>
    set({ paragraphs: value.paragraphs.filter((_, i) => i !== index) })

  const addParagraph = () => {
    if (value.paragraphs.length >= 3) return
    set({ paragraphs: [...value.paragraphs, ''] })
  }

  return (
    <div className="space-y-5">
      <EditorGrid cols={2}>
        <TextField
          label="Subtítulo (eyebrow)"
          hint="Texto pequeño en mayúsculas sobre el título"
          value={value.eyebrow}
          onChange={v => set({ eyebrow: v })}
          placeholder="Nuestra historia"
        />
        <TextField
          label="Título de la sección"
          value={value.title}
          onChange={v => set({ title: v })}
          placeholder="Una casona del siglo XVIII…"
        />
      </EditorGrid>

      <div>
        <SectionLabel>Párrafos del relato (máx. 3, hasta 400 car. c/u)</SectionLabel>
        <div className="space-y-3">
          {value.paragraphs.map((para, i) => (
            <ListItemRow key={i} onDelete={() => removeParagraph(i)} canDelete={value.paragraphs.length > 1}>
              <TextareaField
                label={`Párrafo ${i + 1}`}
                value={para}
                onChange={v => updateParagraph(i, v)}
                rows={4}
                maxLength={400}
              />
            </ListItemRow>
          ))}
        </div>
        <div className="mt-2">
          <AddButton label="Añadir párrafo" onClick={addParagraph} disabled={value.paragraphs.length >= 3} />
        </div>
      </div>

      <TextareaField
        label="Cita destacada (pull quote)"
        hint="Aparece junto a la línea terracota al final del texto"
        value={value.pullQuote}
        onChange={v => set({ pullQuote: v })}
        placeholder="Donde el tiempo se detiene…"
        rows={2}
      />
    </div>
  )
}
