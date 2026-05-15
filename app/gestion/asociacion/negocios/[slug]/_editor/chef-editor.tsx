'use client'

import { Input } from '@/app/components/ui/input'
import { ChefHat } from 'lucide-react'
import {
  Field, SectionHeader, CountedTextarea, PhotoUploadArea,
  AddButton, RemoveButton, DragHandle, IconSelect, STAT_ICONS, EmptyHint,
} from './editor-primitives'
import type { ChefConfig, ChefStat, StatIcon } from './landing-config'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion'
import { Separator } from '@/app/components/ui/separator'

function countFilled(cfg: ChefConfig): number {
  const base = [cfg.eyebrow, cfg.name, cfg.bio1].filter(Boolean).length
  return base
}

export function ChefEditor({
  value,
  onChange,
}: {
  value: ChefConfig
  onChange: (v: ChefConfig) => void
}) {
  function updateStat(idx: number, patch: Partial<ChefStat>) {
    const stats = value.stats.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    onChange({ ...value, stats })
  }

  function removeStat(idx: number) {
    onChange({ ...value, stats: value.stats.filter((_, i) => i !== idx) })
  }

  function addStat() {
    if (value.stats.length >= 4) return
    const newStat: ChefStat = { icon: 'chef-hat', label: '', value: '' }
    onChange({ ...value, stats: [...value.stats, newStat] })
  }

  return (
    <AccordionItem value="chef" className="border border-border rounded-xl overflow-hidden bg-white">
      <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 data-[state=open]:bg-muted/20">
        <SectionHeader
          icon={<ChefHat className="size-4" />}
          title="Chef / Protagonista"
          filled={countFilled(value)}
          total={3}
          open={false}
        />
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-6 pt-2 space-y-5">
        <p className="text-[11px] text-muted-foreground">
          Los restaurantes con sección de chef obtienen 3x más engagement. Añade una foto y una historia auténtica.
        </p>

        {/* Photo + name/eyebrow row */}
        <div className="grid sm:grid-cols-[180px_1fr] gap-5 items-start">
          <div className="space-y-2">
            <PhotoUploadArea
              value={value.photoUrl ?? ''}
              onChange={(url) => onChange({ ...value, photoUrl: url })}
              aspectClass="aspect-square"
              circular
              label="Foto chef"
              folder="negocios/restaurante/chef"
            />
            <p className="text-[10px] text-muted-foreground text-center">Imagen cuadrada · recorte circular</p>
          </div>
          <div className="space-y-4">
            <Field label="Eyebrow (texto pequeño sobre el nombre)">
              <Input
                value={value.eyebrow}
                onChange={(e) => onChange({ ...value, eyebrow: e.target.value })}
                placeholder="El Chef"
                className="text-sm"
              />
            </Field>
            <Field label="Nombre del chef">
              <Input
                value={value.name}
                onChange={(e) => onChange({ ...value, name: e.target.value })}
                placeholder="Marina Ferrer"
                className="text-sm"
              />
            </Field>
          </div>
        </div>

        <Separator />

        {/* Bio */}
        <Field label="Biografía — párrafo 1 (máx. 300 caracteres)">
          <CountedTextarea
            value={value.bio1}
            onChange={(v) => onChange({ ...value, bio1: v })}
            maxLength={300}
            rows={3}
            placeholder="Formada en el Basque Culinary Center y con estancias en..."
          />
        </Field>
        <Field label="Biografía — párrafo 2 (máx. 300 caracteres)">
          <CountedTextarea
            value={value.bio2}
            onChange={(v) => onChange({ ...value, bio2: v })}
            maxLength={300}
            rows={3}
            placeholder="Su cocina es un diálogo íntimo con la huerta y el monte..."
          />
        </Field>

        <Separator />

        {/* Stats */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Estadísticas / datos destacados (máx. 4)
          </p>
          {value.stats.length === 0 && (
            <EmptyHint>Añade datos de impacto: años de experiencia, plato estrella, origen...</EmptyHint>
          )}
          {value.stats.map((stat, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/20"
            >
              <DragHandle />
              <div className="w-28 shrink-0">
                <IconSelect
                  value={stat.icon}
                  onChange={(v) => updateStat(idx, { icon: v as StatIcon })}
                  options={STAT_ICONS}
                />
              </div>
              <Input
                value={stat.label}
                onChange={(e) => updateStat(idx, { label: e.target.value })}
                placeholder="Etiqueta"
                className="h-8 text-xs flex-1"
              />
              <Input
                value={stat.value}
                onChange={(e) => updateStat(idx, { value: e.target.value })}
                placeholder="Valor"
                className="h-8 text-xs w-32 shrink-0"
              />
              <RemoveButton onClick={() => removeStat(idx)} />
            </div>
          ))}
          <AddButton
            onClick={addStat}
            label="Añadir estadística"
            disabled={value.stats.length >= 4}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
