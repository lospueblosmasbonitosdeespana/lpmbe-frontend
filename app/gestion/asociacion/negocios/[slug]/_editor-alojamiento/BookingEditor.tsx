'use client'

import { TextField, TextareaField, EditorGrid } from './AdminField'
import type { LodgingLandingConfig } from './lodging-types'

interface Props {
  value: LodgingLandingConfig['booking']
  onChange: (v: LodgingLandingConfig['booking']) => void
}

export function BookingEditor({ value, onChange }: Props) {
  const set = (patch: Partial<LodgingLandingConfig['booking']>) => onChange({ ...value, ...patch })

  return (
    <div className="space-y-4">
      <EditorGrid cols={2}>
        <TextField
          label="Antetítulo (texto pequeño sobre el título)"
          value={value.eyebrow}
          onChange={v => set({ eyebrow: v })}
          placeholder="Reserva directa"
        />
        <TextField
          label="Título principal"
          value={value.title}
          onChange={v => set({ title: v })}
          placeholder="Reserva con nosotros y ahorra"
        />
      </EditorGrid>
      <TextField
        label="Subtítulo / descripción"
        value={value.subtitle}
        onChange={v => set({ subtitle: v })}
        placeholder="Mejor precio garantizado al reservar directamente…"
      />
      <TextField
        label="Nota de cancelación"
        hint="Aparece como texto secundario bajo el botón de reserva"
        value={value.cancelNote}
        onChange={v => set({ cancelNote: v })}
        placeholder="Cancelación gratuita hasta 48 h antes de la llegada"
      />
    </div>
  )
}
