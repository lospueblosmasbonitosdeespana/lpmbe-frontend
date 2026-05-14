'use client'

import { useId } from 'react'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Sparkles } from 'lucide-react'
import {
  Field, SectionHeader, AddButton, RemoveButton, EmptyHint,
} from './editor-primitives'
import type { HeroConfig, HeroBadge } from './landing-config'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion'

function countFilled(cfg: HeroConfig): number {
  return [cfg.tagline, cfg.locationText].filter(Boolean).length
}

export function HeroEditor({
  value,
  onChange,
}: {
  value: HeroConfig
  onChange: (v: HeroConfig) => void
}) {
  const uid = useId()

  function updateBadge(id: string, text: string) {
    onChange({
      ...value,
      badges: value.badges.map((b) => (b.id === id ? { ...b, text } : b)),
    })
  }

  function removeBadge(id: string) {
    onChange({ ...value, badges: value.badges.filter((b) => b.id !== id) })
  }

  function addBadge() {
    if (value.badges.length >= 4) return
    const newBadge: HeroBadge = { id: `b${Date.now()}`, text: '' }
    onChange({ ...value, badges: [...value.badges, newBadge] })
  }

  return (
    <AccordionItem value="hero" className="border border-border rounded-xl overflow-hidden bg-white">
      <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 data-[state=open]:bg-muted/20">
        <SectionHeader
          icon={<Sparkles className="size-4" />}
          title="Hero: Tagline y badges"
          filled={countFilled(value)}
          total={2}
          open={false}
        />
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-6 pt-2 space-y-5">
        <p className="text-[11px] text-muted-foreground">
          Texto e insignias que aparecen en la cabecera del carousel principal.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Tagline (máx. 80 caracteres)">
            <Input
              value={value.tagline}
              onChange={(e) => onChange({ ...value, tagline: e.target.value })}
              maxLength={80}
              placeholder="Cocina de autor · Pirineo Aragonés"
              className="text-sm"
            />
          </Field>
          <Field label="Texto de localización">
            <Input
              value={value.locationText}
              onChange={(e) => onChange({ ...value, locationText: e.target.value })}
              placeholder="Aínsa, Huesca · Sobrarbe"
              className="text-sm"
            />
          </Field>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Badges / insignias (máx. 4)
          </Label>
          {value.badges.length === 0 && (
            <EmptyHint>
              Añade insignias como "Guía Michelin" o "Km0 Certificado". Aparecen como chips sobre el título del hero.
            </EmptyHint>
          )}
          <div className="space-y-2">
            {value.badges.map((badge) => (
              <div key={badge.id} className="flex items-center gap-2">
                <Input
                  value={badge.text}
                  onChange={(e) => updateBadge(badge.id, e.target.value)}
                  placeholder="Guía Michelin"
                  className="h-8 text-sm flex-1"
                />
                <RemoveButton onClick={() => removeBadge(badge.id)} label="Eliminar badge" />
              </div>
            ))}
          </div>
          <AddButton
            onClick={addBadge}
            label="Añadir badge"
            disabled={value.badges.length >= 4}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
