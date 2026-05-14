'use client'

import { useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, RotateCcw, Eye, EyeOff } from 'lucide-react'

import { Switch } from '@/app/components/ui/switch'
import { Button } from '@/app/components/ui/button'

import {
  getDefaultLayout,
  resolveLayout,
  type SectionLayoutItem,
} from '@/app/_lib/landing/sections-layout'

export interface SectionMeta {
  key: string
  label: string
  description?: string
  icon?: React.ElementType
  /** Si `true`, no se permite ocultar la sección. Por defecto, false. */
  required?: boolean
}

interface Props {
  sections: SectionMeta[]
  value: SectionLayoutItem[] | undefined
  onChange: (value: SectionLayoutItem[]) => void
}

function SortableRow({
  item,
  meta,
  onToggle,
}: {
  item: SectionLayoutItem
  meta: SectionMeta
  onToggle: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.key })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  const Icon = meta.icon

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors ${
        item.visible ? 'border-border' : 'border-dashed border-muted-foreground/30 bg-muted/40'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground"
        aria-label={`Reordenar ${meta.label}`}
      >
        <GripVertical className="size-4" />
      </button>
      {Icon ? (
        <Icon
          className={`size-4 shrink-0 ${
            item.visible ? 'text-muted-foreground' : 'text-muted-foreground/50'
          }`}
        />
      ) : null}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            item.visible ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          {meta.label}
        </p>
        {meta.description ? (
          <p className="text-xs text-muted-foreground truncate">{meta.description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {item.visible ? (
          <Eye className="size-3.5 text-emerald-600" aria-hidden />
        ) : (
          <EyeOff className="size-3.5 text-muted-foreground" aria-hidden />
        )}
        <Switch
          checked={item.visible}
          onCheckedChange={onToggle}
          disabled={meta.required}
          aria-label={`Mostrar ${meta.label}`}
        />
      </div>
    </div>
  )
}

export function SectionsLayoutEditor({ sections, value, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const defaultKeys = useMemo(() => sections.map((s) => s.key), [sections])
  const layout = useMemo(() => resolveLayout(value, defaultKeys), [value, defaultKeys])
  const metaByKey = useMemo(
    () =>
      Object.fromEntries(sections.map((s) => [s.key, s])) as Record<
        string,
        SectionMeta
      >,
    [sections],
  )
  const visibleCount = layout.filter((i) => i.visible).length

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = layout.findIndex((i) => i.key === active.id)
    const newIdx = layout.findIndex((i) => i.key === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    onChange(arrayMove(layout, oldIdx, newIdx))
  }

  function toggle(key: string) {
    const meta = metaByKey[key]
    if (meta?.required) return
    onChange(
      layout.map((i) => (i.key === key ? { ...i, visible: !i.visible } : i)),
    )
  }

  function reset() {
    onChange(getDefaultLayout(defaultKeys))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Arrastra para reordenar las secciones de tu página premium. Apaga las
          que no quieras mostrar.{' '}
          <span className="font-medium text-foreground">
            {visibleCount}/{layout.length} visibles
          </span>
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={reset}
          className="gap-1.5 text-xs"
        >
          <RotateCcw className="size-3" />
          Restablecer orden
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={layout.map((i) => i.key)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {layout.map((item) => {
              const meta = metaByKey[item.key]
              if (!meta) return null
              return (
                <SortableRow
                  key={item.key}
                  item={item}
                  meta={meta}
                  onToggle={() => toggle(item.key)}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
