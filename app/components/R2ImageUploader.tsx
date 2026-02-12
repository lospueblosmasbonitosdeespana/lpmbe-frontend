'use client';

import { useState, useRef } from 'react';
import { compressImage } from '@/src/lib/compressImage';

interface R2ImageUploaderProps {
  /** URL actual de la imagen (si ya hay una subida) */
  value: string | null;
  /** Callback con la URL de R2 una vez subida */
  onChange: (url: string | null) => void;
  /** Carpeta destino en R2 (ej: "noche-romantica", "pueblos") */
  folder?: string;
  /** Texto del label */
  label?: string;
  /** Altura de la preview */
  previewHeight?: string;
  /** Aceptar solo ciertos tipos */
  accept?: string;
  /** Clase CSS adicional para el contenedor */
  className?: string;
}

const LOW_QUALITY_THRESHOLD = 300 * 1024; // 300 KB

export default function R2ImageUploader({
  value,
  onChange,
  folder = 'noche-romantica',
  label = 'Imagen',
  previewHeight = 'h-40',
  accept = 'image/*',
  className = '',
}: R2ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    setWarning(null);

    try {
      // Aviso de baja calidad si < 300 KB
      if (file.size < LOW_QUALITY_THRESHOLD) {
        setWarning(
          `La imagen pesa solo ${Math.round(file.size / 1024)} KB. Puede que no se vea con la calidad adecuada.`,
        );
      }

      // Comprimir en el navegador: acepta cualquier tamaño, resultado ≤ 4 MB
      let compressed: File;
      try {
        compressed = await compressImage(file, {
          fileName: file.name.replace(/\.[^.]+$/, ''),
        });
      } catch {
        // Si falla la compresión (ej: GIF animado), enviar original
        compressed = file;
      }

      const formData = new FormData();
      formData.append('file', compressed);
      formData.append('folder', folder);

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error ${res.status}`);
      }

      const data = await res.json();
      const url = data.url || data.publicUrl || data.key;
      if (!url) throw new Error('No se recibió URL de la imagen');

      onChange(url);
    } catch (e: any) {
      setError(e?.message ?? 'Error subiendo imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset input para permitir subir el mismo archivo otra vez
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleRemove = () => {
    onChange(null);
    setWarning(null);
  };

  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-sm font-medium">{label}</label>
      )}

      {/* Preview */}
      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt={label}
            className={`w-full ${previewHeight} rounded-lg border object-contain bg-gray-50`}
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-black/40 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-800 shadow hover:bg-gray-100"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-sm text-muted-foreground transition hover:border-primary hover:bg-primary/5 hover:text-primary disabled:opacity-50"
        >
          {uploading ? (
            <>
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Comprimiendo y subiendo...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Haz clic para subir imagen
            </>
          )}
        </button>
      )}

      {/* Input oculto */}
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Warning baja calidad */}
      {warning && (
        <p className="mt-1 text-xs text-amber-600">{warning}</p>
      )}

      {/* Error */}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}

      {/* Uploading overlay sobre preview */}
      {uploading && value && (
        <div className="mt-1 text-xs text-primary font-medium">Comprimiendo y subiendo nueva imagen...</div>
      )}
    </div>
  );
}
