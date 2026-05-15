'use client'

import { TextField, EditorGrid, SectionLabel } from '../_editor-alojamiento/AdminField'
import type { HotelConfig } from '@/app/_components/selection/types'

interface Props {
  value: HotelConfig['location']
  onChange: (v: HotelConfig['location']) => void
}

export function LocationContactEditor({ value, onChange }: Props) {
  const update = <K extends keyof HotelConfig['location']>(k: K, v: HotelConfig['location'][K]) =>
    onChange({ ...value, [k]: v })

  return (
    <div className="space-y-5">
      <SectionLabel>Ubicación, contacto y reservas</SectionLabel>
      <EditorGrid>
        <TextField label="Pueblo / Localidad" value={value.village} onChange={v => update('village', v)} placeholder="Aínsa, Huesca" />
        <TextField label="Región" value={value.region} onChange={v => update('region', v)} placeholder="Pirineo Aragonés" />
      </EditorGrid>
      <TextField label="Dirección postal completa" value={value.address} onChange={v => update('address', v)} placeholder="Calle Mayor, 12 · 22330 Aínsa, Huesca" />
      <EditorGrid>
        <TextField label="Teléfono" value={value.phone} onChange={v => update('phone', v)} placeholder="+34 974 500 100" />
        <TextField label="Email reservas" value={value.email} onChange={v => update('email', v)} placeholder="reservas@hotel.es" />
      </EditorGrid>
      <EditorGrid>
        <TextField
          label="Latitud"
          value={String(value.coordinates?.lat ?? '')}
          onChange={v => {
            const lat = parseFloat(v)
            update('coordinates', { lat: isNaN(lat) ? 0 : lat, lng: value.coordinates?.lng ?? 0 })
          }}
          placeholder="42.4175"
        />
        <TextField
          label="Longitud"
          value={String(value.coordinates?.lng ?? '')}
          onChange={v => {
            const lng = parseFloat(v)
            update('coordinates', { lat: value.coordinates?.lat ?? 0, lng: isNaN(lng) ? 0 : lng })
          }}
          placeholder="0.1394"
        />
      </EditorGrid>
    </div>
  )
}
