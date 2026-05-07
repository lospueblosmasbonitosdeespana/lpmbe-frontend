'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, ImageIcon, Trash2, Loader2 } from 'lucide-react';

/**
 * Uploader inline de una imagen única (foto de pueblo asociado, foto de
 * parada extra...). Sube a R2 vía /api/admin/grandes-eventos/:id/upload-image
 * y devuelve la URL al padre. Optimizado para móvil (capture+gallery).
 */
export default function ImageUploader({
  eventoId,
  subfolder,
  value,
  onChange,
}: {
  eventoId: number;
  subfolder: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subfolder', subfolder);
      const res = await fetch(`/api/admin/grandes-eventos/${eventoId}/upload-image`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { url: string };
      if (data.url) onChange(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-2">
      {value ? (
        <div className="mb-2 flex items-center gap-2">
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md border border-stone-200 bg-white">
            <Image src={value} alt="" fill style={{ objectFit: 'cover' }} sizes="96px" />
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" /> Quitar
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-700 px-2 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-800 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          {value ? 'Otra foto' : 'Cámara'}
        </button>
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-300 bg-white px-2 py-2 text-xs font-semibold text-stone-700 transition hover:border-amber-400 hover:text-amber-800 disabled:opacity-50"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          Galería
        </button>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0] ?? null)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0] ?? null)}
      />

      {error ? <p className="mt-1.5 text-[11px] text-red-600">{error}</p> : null}
    </div>
  );
}
