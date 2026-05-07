'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, FileText, Trash2, ImageIcon } from 'lucide-react';

/**
 * Botón de subida de un archivo individual (logo o PDF) a R2.
 * Muestra la previsualización del valor actual y permite reemplazarlo.
 */
export default function FileUploader({
  label,
  hint,
  value,
  uploadUrl,
  accept,
  preview,
  onUploaded,
  onClear,
}: {
  label: string;
  hint?: string;
  value: string | null;
  uploadUrl: string;
  accept: string;
  preview: 'image' | 'pdf';
  onUploaded: (url: string) => void;
  onClear?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handle = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(uploadUrl, { method: 'POST', credentials: 'include', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { logoUrl?: string; pdfUrl?: string };
      const newUrl = data.logoUrl ?? data.pdfUrl ?? '';
      if (newUrl) onUploaded(newUrl);
      setProgress(100);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
      setTimeout(() => setProgress(null), 800);
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-600">{label}</p>

      {value ? (
        <div className="mb-3">
          {preview === 'image' ? (
            <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-stone-200 bg-white">
              <Image src={value} alt="Logo" fill style={{ objectFit: 'contain' }} sizes="96px" />
            </div>
          ) : (
            <a
              href={value}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 hover:border-amber-400 hover:text-amber-800"
            >
              <FileText className="h-4 w-4" />
              Abrir PDF actual
            </a>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-800 disabled:opacity-50"
        >
          {preview === 'image' ? <ImageIcon className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
          {value ? 'Reemplazar' : 'Subir archivo'}
        </button>
        {value && onClear ? (
          <button
            type="button"
            onClick={onClear}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Quitar
          </button>
        ) : null}
        {busy ? <span className="text-xs text-stone-500">Subiendo… {progress ?? 0}%</span> : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0] ?? null)}
      />

      {hint ? <p className="mt-2 text-[11px] text-stone-500">{hint}</p> : null}
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
