'use client'

import { Input } from '@/app/components/ui/input'
import { Switch } from '@/app/components/ui/switch'
import { Flame } from 'lucide-react'
import {
  Field, SectionHeader, AddButton, RemoveButton,
  DragHandle, PhotoUploadArea, EmptyHint,
} from './editor-primitives'
import type { DishesConfig, DishItem } from './landing-config'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion'
import { Separator } from '@/app/components/ui/separator'
import { Card } from '@/app/components/ui/card'

function countFilled(cfg: DishesConfig): number {
  return [cfg.eyebrow, cfg.title, ...cfg.items.map((d) => d.name)].filter(Boolean).length
}

export function DishesEditor({
  value,
  onChange,
}: {
  value: DishesConfig
  onChange: (v: DishesConfig) => void
}) {
  function updateItem(id: string, patch: Partial<DishItem>) {
    onChange({
      ...value,
      items: value.items.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    })
  }

  function removeItem(id: string) {
    if (value.items.length <= 2) return
    onChange({ ...value, items: value.items.filter((d) => d.id !== id) })
  }

  function addItem() {
    if (value.items.length >= 8) return
    const newDish: DishItem = {
      id: `d${Date.now()}`,
      name: '',
      price: '',
      wide: false,
      imageUrl: '',
    }
    onChange({ ...value, items: [...value.items, newDish] })
  }

  return (
    <AccordionItem value="dishes" className="border border-border rounded-xl overflow-hidden bg-white">
      <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 data-[state=open]:bg-muted/20">
        <SectionHeader
          icon={<Flame className="size-4" />}
          title="Platos signature"
          filled={countFilled(value)}
          total={2 + value.items.length}
          open={false}
        />
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-6 pt-2 space-y-5">
        <p className="text-[11px] text-muted-foreground">
          Galería de platos estrella. Los platos "anchos" ocupan 2 columnas en la cuadrícula de la página pública.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Eyebrow">
            <Input
              value={value.eyebrow}
              onChange={(e) => onChange({ ...value, eyebrow: e.target.value })}
              placeholder="Platos estrella"
              className="text-sm"
            />
          </Field>
          <Field label="Título de sección">
            <Input
              value={value.title}
              onChange={(e) => onChange({ ...value, title: e.target.value })}
              placeholder="Nuestras creaciones"
              className="text-sm"
            />
          </Field>
        </div>

        <Separator />

        <div className="space-y-3">
          {value.items.length === 0 && (
            <EmptyHint>Añade al menos 2 platos. Usa fotos de alta calidad para mostrar tu cocina al mundo.</EmptyHint>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            {value.items.map((dish, idx) => (
              <Card key={dish.id} className="p-3 space-y-3 border border-border bg-muted/10">
                <div className="flex items-center gap-2">
                  <DragHandle />
                  <span className="text-xs text-muted-foreground font-medium flex-1">
                    Plato {idx + 1}
                  </span>
                  <RemoveButton onClick={() => removeItem(dish.id)} label="Eliminar plato" />
                </div>

                <PhotoUploadArea
                  value={dish.imageUrl}
                  onChange={(url) => updateItem(dish.id, { imageUrl: url })}
                  aspectClass="aspect-[4/3]"
                  label="Foto del plato"
                />

                <Input
                  value={dish.name}
                  onChange={(e) => updateItem(dish.id, { name: e.target.value })}
                  placeholder="Nombre del plato"
                  className="h-8 text-sm"
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={dish.price}
                    onChange={(e) => updateItem(dish.id, { price: e.target.value })}
                    placeholder="Precio (ej. 24€)"
                    className="h-8 text-xs"
                  />
                  <div className="flex items-center gap-2 bg-muted/30 rounded-md px-3 py-1.5">
                    <Switch
                      id={`wide-${dish.id}`}
                      checked={dish.wide}
                      onCheckedChange={(v) => updateItem(dish.id, { wide: v })}
                    />
                    <label htmlFor={`wide-${dish.id}`} className="text-xs cursor-pointer text-muted-foreground">
                      Ancho (2 cols)
                    </label>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <AddButton
            onClick={addItem}
            label="Añadir plato"
            disabled={value.items.length >= 8}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
