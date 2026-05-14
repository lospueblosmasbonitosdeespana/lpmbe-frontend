'use client'

import { Input } from '@/app/components/ui/input'
import { Switch } from '@/app/components/ui/switch'
import { Sofa } from 'lucide-react'
import {
  Field, SectionHeader, CountedTextarea, AddButton,
  RemoveButton, DragHandle, PhotoUploadArea, EmptyHint,
} from './editor-primitives'
import type { AmbianceConfig, AmbianceBlock } from './landing-config'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion'
import { Card } from '@/app/components/ui/card'

function countFilled(cfg: AmbianceConfig): number {
  return cfg.blocks.filter((b) => b.title && b.description).length
}

export function AmbianceEditor({
  value,
  onChange,
}: {
  value: AmbianceConfig
  onChange: (v: AmbianceConfig) => void
}) {
  function updateBlock(id: string, patch: Partial<AmbianceBlock>) {
    onChange({
      blocks: value.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    })
  }

  function removeBlock(id: string) {
    if (value.blocks.length <= 1) return
    onChange({ blocks: value.blocks.filter((b) => b.id !== id) })
  }

  function addBlock() {
    if (value.blocks.length >= 4) return
    const newBlock: AmbianceBlock = {
      id: `a${Date.now()}`,
      imageUrl: '',
      alt: '',
      title: '',
      description: '',
      imageLeft: false,
    }
    onChange({ blocks: [...value.blocks, newBlock] })
  }

  return (
    <AccordionItem value="ambiance" className="border border-border rounded-xl overflow-hidden bg-white">
      <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 data-[state=open]:bg-muted/20">
        <SectionHeader
          icon={<Sofa className="size-4" />}
          title="Ambiente / Espacios"
          filled={countFilled(value)}
          total={value.blocks.length}
          open={false}
        />
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-6 pt-2 space-y-4">
        <p className="text-[11px] text-muted-foreground">
          Presenta cada espacio de tu local. La imagen puede alternarse entre izquierda y derecha en la página pública.
        </p>

        {value.blocks.length === 0 && (
          <EmptyHint>Añade bloques de ambiente: el comedor principal, la bodega, la terraza...</EmptyHint>
        )}

        {value.blocks.map((block, idx) => (
          <Card key={block.id} className="p-4 space-y-3 border border-border bg-muted/10">
            <div className="flex items-center gap-2">
              <DragHandle />
              <span className="text-xs font-medium text-muted-foreground flex-1">Espacio {idx + 1}</span>
              <RemoveButton onClick={() => removeBlock(block.id)} label="Eliminar espacio" />
            </div>

            <div className="grid sm:grid-cols-[1fr_2fr] gap-4 items-start">
              <div className="space-y-1.5">
                <PhotoUploadArea
                  value={block.imageUrl}
                  onChange={(url) => updateBlock(block.id, { imageUrl: url })}
                  aspectClass="aspect-[4/3]"
                  label="Foto del espacio"
                />
                <Input
                  value={block.alt}
                  onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
                  placeholder="Texto alternativo (SEO)"
                  className="h-7 text-xs"
                />
              </div>

              <div className="space-y-3">
                <Field label="Título del espacio">
                  <Input
                    value={block.title}
                    onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                    placeholder="El Comedor"
                    className="text-sm"
                  />
                </Field>

                <Field label="Descripción (máx. 400 caracteres)">
                  <CountedTextarea
                    value={block.description}
                    onChange={(v) => updateBlock(block.id, { description: v })}
                    maxLength={400}
                    rows={4}
                    placeholder="Bóveda de piedra, vigas de madera..."
                  />
                </Field>

                <div className="flex items-center gap-3 pt-1">
                  <Switch
                    id={`imgLeft-${block.id}`}
                    checked={block.imageLeft}
                    onCheckedChange={(v) => updateBlock(block.id, { imageLeft: v })}
                  />
                  <label htmlFor={`imgLeft-${block.id}`} className="text-xs text-muted-foreground cursor-pointer">
                    Imagen a la izquierda
                  </label>
                </div>
              </div>
            </div>
          </Card>
        ))}

        <AddButton
          onClick={addBlock}
          label="Añadir espacio"
          disabled={value.blocks.length >= 4}
        />
      </AccordionContent>
    </AccordionItem>
  )
}
