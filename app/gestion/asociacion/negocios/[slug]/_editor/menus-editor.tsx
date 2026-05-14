'use client'

import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { Switch } from '@/app/components/ui/switch'
import { Label } from '@/app/components/ui/label'
import { UtensilsCrossed } from 'lucide-react'
import {
  Field, SectionHeader, CountedTextarea,
  AddButton, RemoveButton, DragHandle, EmptyHint,
} from './editor-primitives'
import type { MenusConfig, MenuItem, MenuCourse } from './landing-config'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion'
import { Separator } from '@/app/components/ui/separator'
import { Card } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { cn } from '@/lib/utils'

function countFilled(cfg: MenusConfig): number {
  return [cfg.eyebrow, cfg.title, ...cfg.items.map((m) => m.name)].filter(Boolean).length
}

export function MenusEditor({
  value,
  onChange,
}: {
  value: MenusConfig
  onChange: (v: MenusConfig) => void
}) {
  function updateItem(id: string, patch: Partial<MenuItem>) {
    onChange({
      ...value,
      items: value.items.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })
  }

  function removeItem(id: string) {
    if (value.items.length <= 1) return
    onChange({ ...value, items: value.items.filter((m) => m.id !== id) })
  }

  function addItem() {
    if (value.items.length >= 5) return
    const newItem: MenuItem = {
      id: `m${Date.now()}`,
      name: '',
      price: '',
      priceNote: '',
      description: '',
      chip: '',
      courses: [],
      featured: false,
      badgeText: '',
    }
    onChange({ ...value, items: [...value.items, newItem] })
  }

  function addCourse(menuId: string) {
    const menu = value.items.find((m) => m.id === menuId)
    if (!menu) return
    const newCourse: MenuCourse = { id: `c${Date.now()}`, text: '' }
    updateItem(menuId, { courses: [...menu.courses, newCourse] })
  }

  function updateCourse(menuId: string, courseId: string, text: string) {
    const menu = value.items.find((m) => m.id === menuId)
    if (!menu) return
    updateItem(menuId, {
      courses: menu.courses.map((c) => (c.id === courseId ? { ...c, text } : c)),
    })
  }

  function removeCourse(menuId: string, courseId: string) {
    const menu = value.items.find((m) => m.id === menuId)
    if (!menu) return
    updateItem(menuId, { courses: menu.courses.filter((c) => c.id !== courseId) })
  }

  return (
    <AccordionItem value="menus" className="border border-border rounded-xl overflow-hidden bg-white">
      <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 data-[state=open]:bg-muted/20">
        <SectionHeader
          icon={<UtensilsCrossed className="size-4" />}
          title="Menús"
          filled={countFilled(value)}
          total={2 + value.items.length}
          open={false}
        />
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-6 pt-2 space-y-5">
        <p className="text-[11px] text-muted-foreground">
          Define tus propuestas gastronómicas. El menú marcado como "Destacado" aparecerá con borde dorado y ligeramente elevado.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Eyebrow">
            <Input
              value={value.eyebrow}
              onChange={(e) => onChange({ ...value, eyebrow: e.target.value })}
              placeholder="Experiencia gastronómica"
              className="text-sm"
            />
          </Field>
          <Field label="Título de sección">
            <Input
              value={value.title}
              onChange={(e) => onChange({ ...value, title: e.target.value })}
              placeholder="Nuestros menús"
              className="text-sm"
            />
          </Field>
        </div>

        <Separator />

        <div className="space-y-4">
          {value.items.length === 0 && (
            <EmptyHint>Añade al menos un menú. Los restaurantes con menús detallados reciben más reservas directas.</EmptyHint>
          )}
          {value.items.map((menu, menuIdx) => (
            <Card
              key={menu.id}
              className={cn(
                'border p-4 space-y-4 bg-card',
                menu.featured ? 'border-amber-300/70' : 'border-border'
              )}
            >
              {/* Card header */}
              <div className="flex items-center gap-2">
                <DragHandle />
                <span className="text-xs font-semibold text-muted-foreground flex-1">
                  Menú {menuIdx + 1}
                  {menu.featured && (
                    <Badge className="ml-2 bg-amber-100 text-amber-700 border-amber-300 text-[10px] font-semibold">
                      Destacado
                    </Badge>
                  )}
                </span>
                <RemoveButton
                  onClick={() => removeItem(menu.id)}
                  label="Eliminar menú"
                />
              </div>

              {/* Basic fields */}
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Nombre del menú">
                  <Input
                    value={menu.name}
                    onChange={(e) => updateItem(menu.id, { name: e.target.value })}
                    placeholder="Menú degustación"
                    className="h-8 text-sm"
                  />
                </Field>
                <Field label="Precio (€)">
                  <Input
                    value={menu.price}
                    onChange={(e) => updateItem(menu.id, { price: e.target.value })}
                    placeholder="65"
                    className="h-8 text-sm"
                  />
                </Field>
                <Field label="Nota de precio">
                  <Input
                    value={menu.priceNote}
                    onChange={(e) => updateItem(menu.id, { priceNote: e.target.value })}
                    placeholder="/ 7 pases"
                    className="h-8 text-sm"
                  />
                </Field>
              </div>

              <Field label="Descripción">
                <CountedTextarea
                  value={menu.description}
                  onChange={(v) => updateItem(menu.id, { description: v })}
                  maxLength={300}
                  rows={2}
                  placeholder="Describe la experiencia de este menú..."
                />
              </Field>

              <Field label="Chip / etiqueta (ej. Solo mediodía L–V)">
                <Input
                  value={menu.chip}
                  onChange={(e) => updateItem(menu.id, { chip: e.target.value })}
                  placeholder="Solo mediodía L–V"
                  className="h-8 text-sm"
                />
              </Field>

              {/* Featured toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Menú destacado</p>
                  <p className="text-[11px] text-muted-foreground">Aparece elevado y con borde dorado en la página pública</p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={menu.featured}
                    onCheckedChange={(v) => updateItem(menu.id, { featured: v })}
                  />
                  {menu.featured && (
                    <Input
                      value={menu.badgeText}
                      onChange={(e) => updateItem(menu.id, { badgeText: e.target.value })}
                      placeholder="Más popular"
                      className="h-7 text-xs w-32"
                    />
                  )}
                </div>
              </div>

              {/* Courses list */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Pases / platos del menú
                </p>
                {menu.courses.length === 0 && (
                  <p className="text-[11px] text-muted-foreground italic">
                    Sin pases listados — aparecerá solo la descripción.
                  </p>
                )}
                {menu.courses.map((course) => (
                  <div key={course.id} className="flex items-center gap-2">
                    <DragHandle />
                    <Input
                      value={course.text}
                      onChange={(e) => updateCourse(menu.id, course.id, e.target.value)}
                      placeholder="Nombre del pase"
                      className="h-8 text-sm flex-1"
                    />
                    <RemoveButton onClick={() => removeCourse(menu.id, course.id)} />
                  </div>
                ))}
                <AddButton onClick={() => addCourse(menu.id)} label="Añadir pase" />
              </div>
            </Card>
          ))}
        </div>

        <AddButton
          onClick={addItem}
          label="Añadir menú"
          disabled={value.items.length >= 5}
        />
      </AccordionContent>
    </AccordionItem>
  )
}
