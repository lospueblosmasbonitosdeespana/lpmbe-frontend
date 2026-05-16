'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Shared tiny primitives used across every section editor
// ─────────────────────────────────────────────────────────────────────────────

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/app/components/ui/label'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { Badge } from '@/app/components/ui/badge'
import { GripVertical, X, Plus, ImageIcon } from 'lucide-react'
import { Button } from '@/app/components/ui/button'

// ── Field wrapper ─────────────────────────────────────────────────────────────
export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </Label>
      )}
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/70">{hint}</p>}
    </div>
  )
}

// ── Char-counted textarea ─────────────────────────────────────────────────────
export function CountedTextarea({
  value,
  onChange,
  maxLength,
  rows = 3,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  maxLength: number
  rows?: number
  placeholder?: string
  className?: string
}) {
  const over = value.length > maxLength
  return (
    <div className="relative">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={cn('resize-none pr-16 text-sm', className)}
      />
      <span
        className={cn(
          'absolute bottom-2 right-3 text-[10px] tabular-nums pointer-events-none',
          over ? 'text-destructive' : 'text-muted-foreground/60'
        )}
      >
        {value.length}/{maxLength}
      </span>
    </div>
  )
}

// ── Section header with completion badge ─────────────────────────────────────
export function SectionHeader({
  icon,
  title,
  filled,
  total,
  open,
}: {
  icon: React.ReactNode
  title: string
  filled: number
  total: number
  open: boolean
}) {
  const pct = total === 0 ? 100 : Math.round((filled / total) * 100)
  const complete = pct === 100
  return (
    <div className="flex items-center gap-3 w-full">
      <span className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
        {icon}
      </span>
      <span className="font-medium text-sm text-foreground flex-1 text-left">{title}</span>
      <Badge
        variant="outline"
        className={cn(
          'rounded-full text-[10px] font-semibold px-2 py-0 shrink-0 border',
          complete
            ? 'border-green-500/50 text-green-600 bg-green-50'
            : 'border-amber-400/50 text-amber-700 bg-amber-50'
        )}
      >
        {filled}/{total}
      </Badge>
    </div>
  )
}

// ── Simple drag-handle pill for list items ────────────────────────────────────
export function DragHandle({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground',
        className
      )}
      aria-hidden
    >
      <GripVertical className="size-4" />
    </span>
  )
}

// ── Remove button ─────────────────────────────────────────────────────────────
export function RemoveButton({
  onClick,
  label = 'Eliminar',
}: {
  onClick: () => void
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
    >
      <X className="size-3.5" />
    </button>
  )
}

// ── Add button ────────────────────────────────────────────────────────────────
export function AddButton({
  onClick,
  label,
  disabled,
}: {
  onClick: () => void
  label: string
  disabled?: boolean
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="gap-1.5 text-xs border-dashed"
    >
      <Plus className="size-3.5" />
      {label}
    </Button>
  )
}

// ── Photo upload to R2 (con previa + cambiar/quitar) ────────────────────────
import { uploadImageToR2 } from '@/src/lib/uploadHelper'
import { Loader2, Trash2 } from 'lucide-react'

export function PhotoUploadArea({
  value,
  onChange,
  aspectClass = 'aspect-[4/3]',
  circular = false,
  label = 'Subir foto',
  folder = 'negocios/restaurante',
}: {
  value: string
  onChange: (url: string) => void
  aspectClass?: string
  circular?: boolean
  label?: string
  folder?: string
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const { url } = await uploadImageToR2(file, folder)
      onChange(url)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error subiendo la foto'
      setError(msg)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (uploading) return
    onChange('')
    setError(null)
  }

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          'relative border-2 border-dashed border-border rounded-xl overflow-hidden bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group',
          aspectClass,
          circular && 'rounded-full'
        )}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {value ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={value}
            alt="Vista previa"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
            {uploading ? (
              <>
                <Loader2 className="size-6 animate-spin" />
                <span className="text-[11px] font-medium">Subiendo…</span>
              </>
            ) : (
              <>
                <ImageIcon className="size-6 opacity-40" />
                <span className="text-[11px] font-medium">{label}</span>
              </>
            )}
          </div>
        )}
        {value && !uploading && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs font-medium">Cambiar foto</span>
          </div>
        )}
        {value && uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="size-6 text-white animate-spin" />
          </div>
        )}
        {value && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className={cn(
              'absolute top-2 right-2 z-10 flex items-center justify-center rounded-full bg-white/95 text-red-600 shadow-md hover:bg-white hover:text-red-700 transition-colors',
              circular ? 'w-7 h-7' : 'w-7 h-7'
            )}
            title="Quitar foto"
            aria-label="Quitar foto"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
      {value && !uploading && (
        <button
          type="button"
          onClick={handleRemove}
          className="text-[11px] font-medium text-red-600 hover:text-red-700 hover:underline"
        >
          Quitar foto
        </button>
      )}
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  )
}

// ── Icon select dropdown ──────────────────────────────────────────────────────
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'

export const STAT_ICONS = [
  { value: 'chef-hat', label: 'Gorro chef' },
  { value: 'award', label: 'Premio' },
  { value: 'map-pin', label: 'Ubicación' },
  { value: 'clock', label: 'Reloj' },
  { value: 'star', label: 'Estrella' },
  { value: 'heart', label: 'Corazón' },
]

export const PHILOSOPHY_ICONS = [
  { value: 'leaf', label: 'Hoja' },
  { value: 'calendar', label: 'Calendario' },
  { value: 'wine', label: 'Copa de vino' },
  { value: 'flame', label: 'Llama' },
  { value: 'sprout', label: 'Brote' },
  { value: 'utensils', label: 'Cubiertos' },
]

export const OFFER_ICONS = [
  { value: 'gift', label: 'Regalo' },
  { value: 'percent', label: 'Porcentaje' },
  { value: 'sparkles', label: 'Destellos' },
  { value: 'crown', label: 'Corona' },
  { value: 'wine', label: 'Copa de vino' },
  { value: 'star', label: 'Estrella' },
]

export function IconSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// ── Empty-state hint ──────────────────────────────────────────────────────────
export function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-6 text-center">
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  )
}
