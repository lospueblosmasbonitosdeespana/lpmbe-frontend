'use client'

import { useRef, useState } from 'react'
import { Label } from '@/app/components/ui/label'
import { uploadImageToR2 } from '@/src/lib/uploadHelper'
import { Upload, Loader2, X, Image as ImageIcon } from 'lucide-react'

function cn(...inputs: (string | undefined | false)[]) {
  return inputs.filter(Boolean).join(' ')
}

interface Props {
  label: string
  hint?: string
  value: string
  onChange: (url: string) => void
  /** Carpeta destino en R2. Default: "negocios" */
  folder?: string
  /** Si true, muestra preview cuadrado pequeño en lugar del rectangular */
  square?: boolean
  className?: string
}

/**
 * Campo de subida directa a R2 (Cloudflare). Reemplaza siempre los inputs
 * de URL en los editores premium para que el usuario nunca tenga que pegar
 * URLs manualmente — siempre sube la foto y obtiene la URL automáticamente.
 *
 * Comprime en cliente, sube vía /api/admin/uploads y guarda la URL pública.
 */
export function ImageUploadField({
  label,
  hint,
  value,
  onChange,
  folder = 'negocios',
  square = false,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelect = () => inputRef.current?.click()

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const { url } = await uploadImageToR2(file, folder)
      onChange(url)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error subiendo imagen'
      setError(msg)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleClear = () => {
    onChange('')
    setError(null)
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label className="text-xs font-semibold" style={{ color: 'oklch(0.40 0.06 50)' }}>
        {label}
      </Label>
      {hint && (
        <p className="text-xs" style={{ color: 'oklch(0.58 0.04 50)' }}>
          {hint}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {value ? (
        <div className="relative group">
          <div
            className={cn(
              'relative overflow-hidden rounded-lg border bg-muted/30',
              square ? 'aspect-square w-32' : 'aspect-[16/10] w-full max-w-md',
            )}
            style={{ borderColor: 'oklch(0.85 0.015 70)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={label} className="h-full w-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelect}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md border transition-colors hover:opacity-80 disabled:opacity-40"
              style={{
                borderColor: 'oklch(0.72 0.16 60)',
                color: 'oklch(0.42 0.12 50)',
                background: 'oklch(0.72 0.16 60 / 0.10)',
              }}
            >
              <Upload size={12} />
              Cambiar
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
            >
              <X size={12} />
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleSelect}
          disabled={uploading}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors hover:bg-muted/30 disabled:opacity-40',
            square ? 'aspect-square w-32' : 'aspect-[16/10] w-full max-w-md',
          )}
          style={{ borderColor: 'oklch(0.78 0.04 70)', color: 'oklch(0.50 0.06 50)' }}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs font-medium">Subiendo a R2…</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-6 w-6 opacity-60" />
              <span className="text-xs font-medium">Subir imagen</span>
              <span className="text-[10px] opacity-70">Se sube a Cloudflare R2</span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}
