'use client'

import { Input } from '@/app/components/ui/input'
import { Leaf } from 'lucide-react'
import {
  Field, SectionHeader, CountedTextarea,
  AddButton, RemoveButton, DragHandle, IconSelect,
  PHILOSOPHY_ICONS, EmptyHint,
} from './editor-primitives'
import type { PhilosophyConfig, PhilosophyPillar, PhilosophyIcon } from './landing-config'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion'
import { Separator } from '@/app/components/ui/separator'
import { Card } from '@/app/components/ui/card'

function countFilled(cfg: PhilosophyConfig): number {
  return [cfg.eyebrow, cfg.title, ...cfg.pillars.map((p) => p.title)].filter(Boolean).length
}

function countTotal(cfg: PhilosophyConfig): number {
  return 2 + cfg.pillars.length
}

export function PhilosophyEditor({
  value,
  onChange,
}: {
  value: PhilosophyConfig
  onChange: (v: PhilosophyConfig) => void
}) {
  function updatePillar(id: string, patch: Partial<PhilosophyPillar>) {
    onChange({
      ...value,
      pillars: value.pillars.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })
  }

  function removePillar(id: string) {
    if (value.pillars.length <= 2) return
    onChange({ ...value, pillars: value.pillars.filter((p) => p.id !== id) })
  }

  function addPillar() {
    if (value.pillars.length >= 4) return
    const newPillar: PhilosophyPillar = {
      id: `p${Date.now()}`,
      icon: 'leaf',
      title: '',
      description: '',
    }
    onChange({ ...value, pillars: [...value.pillars, newPillar] })
  }

  return (
    <AccordionItem value="philosophy" className="border border-border rounded-xl overflow-hidden bg-white">
      <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 data-[state=open]:bg-muted/20">
        <SectionHeader
          icon={<Leaf className="size-4" />}
          title="Filosofía culinaria"
          filled={countFilled(value)}
          total={countTotal(value)}
          open={false}
        />
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-6 pt-2 space-y-5">
        <p className="text-[11px] text-muted-foreground">
          Explica los valores y pilares que definen tu cocina. Aparecerán como 3 tarjetas en la página pública.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Antetítulo (texto pequeño sobre el título)">
            <Input
              value={value.eyebrow}
              onChange={(e) => onChange({ ...value, eyebrow: e.target.value })}
              placeholder="Nuestra cocina"
              className="text-sm"
            />
          </Field>
          <Field label="Título de sección">
            <Input
              value={value.title}
              onChange={(e) => onChange({ ...value, title: e.target.value })}
              placeholder="Los tres pilares de..."
              className="text-sm"
            />
          </Field>
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Pilares (mín. 2, máx. 4)
          </p>
          {value.pillars.length === 0 && (
            <EmptyHint>Añade los pilares que definen tu filosofía culinaria.</EmptyHint>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            {value.pillars.map((pillar) => (
              <Card key={pillar.id} className="p-4 space-y-3 border border-border bg-muted/10">
                <div className="flex items-center justify-between gap-2">
                  <DragHandle />
                  <div className="flex-1">
                    <IconSelect
                      value={pillar.icon}
                      onChange={(v) => updatePillar(pillar.id, { icon: v as PhilosophyIcon })}
                      options={PHILOSOPHY_ICONS}
                    />
                  </div>
                  <RemoveButton
                    onClick={() => removePillar(pillar.id)}
                    label="Eliminar pilar"
                  />
                </div>
                <Input
                  value={pillar.title}
                  onChange={(e) => updatePillar(pillar.id, { title: e.target.value })}
                  placeholder="Título del pilar (máx. 40 chars)"
                  maxLength={40}
                  className="text-sm h-8"
                />
                <CountedTextarea
                  value={pillar.description}
                  onChange={(v) => updatePillar(pillar.id, { description: v })}
                  maxLength={200}
                  rows={2}
                  placeholder="Descripción breve del pilar..."
                />
              </Card>
            ))}
          </div>
          <AddButton
            onClick={addPillar}
            label="Añadir pilar"
            disabled={value.pillars.length >= 4}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
