'use client'

import { MapPin } from 'lucide-react'
import { Field, SectionHeader } from './editor-primitives'
import type { AccessConfig } from './landing-config'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion'
import { Textarea } from '@/app/components/ui/textarea'

function countFilled(cfg: AccessConfig): number {
  return [cfg.parking, cfg.transport, cfg.accessibility].filter(Boolean).length
}

export function AccessEditor({
  value,
  onChange,
}: {
  value: AccessConfig
  onChange: (v: AccessConfig) => void
}) {
  return (
    <AccordionItem value="access" className="border border-border rounded-xl overflow-hidden bg-white">
      <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 data-[state=open]:bg-muted/20">
        <SectionHeader
          icon={<MapPin className="size-4" />}
          title="Cómo llegar y accesibilidad"
          filled={countFilled(value)}
          total={3}
          open={false}
        />
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-6 pt-2 space-y-5">
        <p className="text-[11px] text-muted-foreground">
          Indica cómo llegar al restaurante y qué facilidades de accesibilidad ofrece.
        </p>

        <Field label="Aparcamiento">
          <Textarea
            value={value.parking}
            onChange={(e) => onChange({ ...value, parking: e.target.value })}
            rows={2}
            placeholder="Aparcamiento gratuito a 100 m en el Parking Medieval..."
            className="text-sm resize-none"
          />
        </Field>

        <Field label="Transporte público">
          <Textarea
            value={value.transport}
            onChange={(e) => onChange({ ...value, transport: e.target.value })}
            rows={2}
            placeholder="Servicio de bus Alosa desde Barbastro y Huesca..."
            className="text-sm resize-none"
          />
        </Field>

        <Field label="Accesibilidad">
          <Textarea
            value={value.accessibility}
            onChange={(e) => onChange({ ...value, accessibility: e.target.value })}
            rows={2}
            placeholder="Acceso por rampa lateral. Baño adaptado disponible..."
            className="text-sm resize-none"
          />
        </Field>
      </AccordionContent>
    </AccordionItem>
  )
}
