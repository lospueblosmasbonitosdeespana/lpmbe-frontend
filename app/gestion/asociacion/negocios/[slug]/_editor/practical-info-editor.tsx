'use client'

import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { Info } from 'lucide-react'
import { Field, SectionHeader, CountedTextarea } from './editor-primitives'
import type { PracticalInfoConfig, DietOption } from './landing-config'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion'
import { Separator } from '@/app/components/ui/separator'
import { cn } from '@/lib/utils'

const ALL_DIET_OPTIONS: { value: DietOption; label: string }[] = [
  { value: 'VEGAN', label: 'Vegano' },
  { value: 'VEGETARIAN', label: 'Vegetariano' },
  { value: 'GLUTEN_FREE', label: 'Sin gluten' },
  { value: 'LACTOSE_FREE', label: 'Sin lactosa' },
  { value: 'KETO', label: 'Keto' },
  { value: 'HALAL', label: 'Halal' },
  { value: 'KOSHER', label: 'Kosher' },
]

function countFilled(cfg: PracticalInfoConfig): number {
  return [
    cfg.capacity,
    cfg.serviceType,
    cfg.avgTime,
    cfg.childrenPolicy,
    cfg.petPolicy,
    cfg.reservationNote,
  ].filter(Boolean).length
}

export function PracticalInfoEditor({
  value,
  onChange,
}: {
  value: PracticalInfoConfig
  onChange: (v: PracticalInfoConfig) => void
}) {
  function toggleDiet(diet: DietOption) {
    const has = value.dietOptions.includes(diet)
    onChange({
      ...value,
      dietOptions: has
        ? value.dietOptions.filter((d) => d !== diet)
        : [...value.dietOptions, diet],
    })
  }

  return (
    <AccordionItem value="practical" className="border border-border rounded-xl overflow-hidden bg-white">
      <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 data-[state=open]:bg-muted/20">
        <SectionHeader
          icon={<Info className="size-4" />}
          title="Información práctica"
          filled={countFilled(value)}
          total={6}
          open={false}
        />
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-6 pt-2 space-y-5">
        <p className="text-[11px] text-muted-foreground">
          Datos que el visitante necesita conocer antes de reservar. Cuanto más completo, más confianza genera.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Aforo">
            <Input
              value={value.capacity}
              onChange={(e) => onChange({ ...value, capacity: e.target.value })}
              placeholder="28 comensales (máximo)"
              className="text-sm"
            />
          </Field>
          <Field label="Tipo de servicio">
            <Input
              value={value.serviceType}
              onChange={(e) => onChange({ ...value, serviceType: e.target.value })}
              placeholder="Almuerzo · Cena · Eventos privados"
              className="text-sm"
            />
          </Field>
          <Field label="Tiempo medio de servicio">
            <Input
              value={value.avgTime}
              onChange={(e) => onChange({ ...value, avgTime: e.target.value })}
              placeholder="2 h 30 min – 3 h"
              className="text-sm"
            />
          </Field>
          <Field label="Política de niños">
            <Input
              value={value.childrenPolicy}
              onChange={(e) => onChange({ ...value, childrenPolicy: e.target.value })}
              placeholder="Bienvenidos, menú infantil disponible"
              className="text-sm"
            />
          </Field>
          <Field label="Política de mascotas" className="sm:col-span-2">
            <Input
              value={value.petPolicy}
              onChange={(e) => onChange({ ...value, petPolicy: e.target.value })}
              placeholder="Permitidas en terraza exterior"
              className="text-sm"
            />
          </Field>
        </div>

        <Field label="Nota de reserva">
          <Textarea
            value={value.reservationNote}
            onChange={(e) => onChange({ ...value, reservationNote: e.target.value })}
            rows={2}
            placeholder="Recomendamos reservar con al menos 48 horas..."
            className="text-sm resize-none"
          />
        </Field>

        <Separator />

        {/* Diet options */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Opciones dietéticas atendidas
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_DIET_OPTIONS.map((opt) => {
              const active = value.dietOptions.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleDiet(opt.value)}
                  className={cn(
                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                    active
                      ? 'bg-amber-100 border-amber-400 text-amber-800'
                      : 'bg-muted/30 border-border text-muted-foreground hover:border-amber-300'
                  )}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <Separator />

        <Field label="Política de cancelación">
          <CountedTextarea
            value={value.cancellationText}
            onChange={(v) => onChange({ ...value, cancellationText: v })}
            maxLength={300}
            rows={3}
            placeholder="Cancelación gratuita hasta 24 horas antes..."
          />
        </Field>
      </AccordionContent>
    </AccordionItem>
  )
}
