'use client'

import { TextField, EditorGrid, SectionLabel } from '../_editor-alojamiento/AdminField'
import type { HotelConfig } from '@/app/_components/selection/types'

interface Props {
  value: HotelConfig['social']
  onChange: (v: HotelConfig['social']) => void
}

export function SocialEditor({ value, onChange }: Props) {
  const update = <K extends keyof HotelConfig['social']>(k: K, v: HotelConfig['social'][K]) =>
    onChange({ ...value, [k]: v })

  return (
    <div className="space-y-5">
      <SectionLabel>Redes sociales (footer cobranding)</SectionLabel>
      <EditorGrid>
        <TextField label="Instagram URL" value={value.instagram ?? ''} onChange={v => update('instagram', v)} placeholder="https://instagram.com/hotel" />
        <TextField label="Facebook URL" value={value.facebook ?? ''} onChange={v => update('facebook', v)} placeholder="https://facebook.com/hotel" />
      </EditorGrid>
      <TextField label="Twitter / X URL" value={value.twitter ?? ''} onChange={v => update('twitter', v)} placeholder="https://twitter.com/hotel" />
    </div>
  )
}
