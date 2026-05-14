'use client'

import { Label } from '@/app/components/ui/label'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { Switch } from '@/app/components/ui/switch'

function cn(...inputs: (string | undefined | false)[]) { return inputs.filter(Boolean).join(' ') }

// ─── Simple labeled text field ───────────────────────────────────────────────
interface FieldProps {
  label: string
  hint?: string
  className?: string
}

interface TextFieldProps extends FieldProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
}

export function TextField({ label, hint, value, onChange, placeholder, maxLength, className }: TextFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label className="text-xs font-semibold" style={{ color: 'oklch(0.40 0.06 50)' }}>
        {label}
        {maxLength && (
          <span className="ml-1.5 font-normal" style={{ color: 'oklch(0.60 0.04 50)' }}>
            ({value.length}/{maxLength})
          </span>
        )}
      </Label>
      {hint && <p className="text-xs" style={{ color: 'oklch(0.58 0.04 50)' }}>{hint}</p>}
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="h-8 text-sm bg-white"
        style={{ borderColor: 'oklch(0.85 0.015 70)' }}
      />
    </div>
  )
}

// ─── Labeled textarea ─────────────────────────────────────────────────────────
interface TextareaFieldProps extends FieldProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  rows?: number
}

export function TextareaField({ label, hint, value, onChange, placeholder, maxLength, rows = 3, className }: TextareaFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label className="text-xs font-semibold" style={{ color: 'oklch(0.40 0.06 50)' }}>
        {label}
        {maxLength && (
          <span className="ml-1.5 font-normal" style={{ color: 'oklch(0.60 0.04 50)' }}>
            ({value.length}/{maxLength})
          </span>
        )}
      </Label>
      {hint && <p className="text-xs" style={{ color: 'oklch(0.58 0.04 50)' }}>{hint}</p>}
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className="text-sm bg-white resize-none"
        style={{ borderColor: 'oklch(0.85 0.015 70)' }}
      />
    </div>
  )
}

// ─── Toggle with label ────────────────────────────────────────────────────────
interface SwitchFieldProps extends FieldProps {
  checked: boolean
  onChange: (v: boolean) => void
}

export function SwitchField({ label, hint, checked, onChange, className }: SwitchFieldProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4 py-1', className)}>
      <div>
        <p className="text-xs font-semibold" style={{ color: 'oklch(0.40 0.06 50)' }}>{label}</p>
        {hint && <p className="text-xs mt-0.5" style={{ color: 'oklch(0.58 0.04 50)' }}>{hint}</p>}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  )
}

// ─── Select field ─────────────────────────────────────────────────────────────
interface SelectFieldProps extends FieldProps {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}

export function SelectField({ label, hint, value, onChange, options, className }: SelectFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label className="text-xs font-semibold" style={{ color: 'oklch(0.40 0.06 50)' }}>{label}</Label>
      {hint && <p className="text-xs" style={{ color: 'oklch(0.58 0.04 50)' }}>{hint}</p>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-8 w-full rounded-md border px-3 text-sm bg-white focus:outline-none focus:ring-2"
        style={{ borderColor: 'oklch(0.85 0.015 70)', color: 'oklch(0.25 0.05 50)' }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
export function EditorGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  return (
    <div className={cn(
      'grid gap-4',
      cols === 1 && 'grid-cols-1',
      cols === 2 && 'grid-cols-1 sm:grid-cols-2',
      cols === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    )}>
      {children}
    </div>
  )
}

// ─── List item row (delete + slot) ────────────────────────────────────────────
import { Trash2, GripVertical } from 'lucide-react'

interface ListItemRowProps {
  onDelete: () => void
  children: React.ReactNode
  canDelete?: boolean
}

export function ListItemRow({ onDelete, children, canDelete = true }: ListItemRowProps) {
  return (
    <div
      className="relative flex gap-3 p-4 rounded-lg"
      style={{ background: 'oklch(0.97 0.006 70)', border: '1px solid oklch(0.88 0.012 70)' }}
    >
      <GripVertical size={14} className="mt-1 shrink-0 opacity-30 cursor-grab" />
      <div className="flex-1 min-w-0">{children}</div>
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 mt-0.5 p-1 rounded transition-colors hover:bg-red-50"
          style={{ color: 'oklch(0.55 0.15 25)' }}
          aria-label="Eliminar elemento"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}

// ─── Add button ───────────────────────────────────────────────────────────────
import { Plus } from 'lucide-react'

export function AddButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border transition-colors hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        borderColor: 'oklch(0.72 0.16 60)',
        color: 'oklch(0.42 0.12 50)',
        background: 'oklch(0.72 0.16 60 / 0.10)',
      }}
    >
      <Plus size={13} />
      {label}
    </button>
  )
}

// ─── Section divider label ────────────────────────────────────────────────────
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold tracking-widest uppercase mt-2 mb-3" style={{ color: 'oklch(0.52 0.10 55)' }}>
      {children}
    </p>
  )
}
