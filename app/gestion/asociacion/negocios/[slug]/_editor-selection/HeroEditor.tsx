'use client'

import { TextField, TextareaField, EditorGrid, ListItemRow, AddButton, SectionLabel } from '../_editor-alojamiento/AdminField'
import type { HotelConfig } from '@/app/_components/selection/types'

type HeroValue = {
  name: string
  tagline: string
  heroImage: string
  badges: HotelConfig['badges']
}

interface Props {
  value: HeroValue
  onChange: (v: HeroValue) => void
}

export function HeroEditor({ value, onChange }: Props) {
  const update = <K extends keyof HeroValue>(k: K, v: HeroValue[K]) =>
    onChange({ ...value, [k]: v })

  return (
    <div className="space-y-5">
      <EditorGrid>
        <TextField
          label="Nombre del hotel"
          hint="Aparece como título principal"
          value={value.name}
          onChange={v => update('name', v)}
          maxLength={80}
        />
        <TextField
          label="URL imagen de portada"
          hint="Imagen cinematográfica (1920×1080 recomendado)"
          value={value.heroImage}
          onChange={v => update('heroImage', v)}
          placeholder="/images/hero.jpg"
        />
      </EditorGrid>

      <TextareaField
        label="Tagline / eslogan"
        hint="Frase corta poética que resuma la esencia del lugar"
        value={value.tagline}
        onChange={v => update('tagline', v)}
        maxLength={140}
        rows={2}
      />

      <div>
        <SectionLabel>Badges (sellos sobre el hero · máx 6)</SectionLabel>
        <div className="space-y-2">
          {value.badges.map((b, i) => (
            <ListItemRow
              key={i}
              onDelete={() => update('badges', value.badges.filter((_, idx) => idx !== i))}
            >
              <TextField
                label="Texto del badge"
                value={b.label}
                onChange={v => {
                  const next = [...value.badges]
                  next[i] = { ...next[i], label: v }
                  update('badges', next)
                }}
                placeholder="Relais & Châteaux"
                maxLength={40}
              />
            </ListItemRow>
          ))}
          {value.badges.length < 6 && (
            <AddButton
              label="Añadir badge"
              onClick={() => update('badges', [...value.badges, { label: '' }])}
            />
          )}
        </div>
      </div>
    </div>
  )
}
