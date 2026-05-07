'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import type { EventoEditDetail } from '../GranEventoEditor';
import { adminFetch } from './_helpers';

export default function TabFotos({
  evento,
  reload,
}: {
  evento: EventoEditDetail;
  reload: () => Promise<void>;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [pieFoto, setPieFoto] = useState('');
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    setProgress({ done: 0, total: files.length });
    try {
      let done = 0;
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        if (pieFoto.trim()) formData.append('pieFoto_es', pieFoto.trim());
        const res = await fetch(`/api/admin/grandes-eventos/${evento.id}/fotos/upload`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error || 'Error subiendo foto');
        }
        done += 1;
        setProgress({ done, total: files.length });
      }
      setPieFoto('');
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-stone-600">
        Sube las fotos del evento desde el móvil o el ordenador. Aparecen en la galería pública en tiempo real (poll cada
        60s). Optimizado para uso desde móvil durante el evento.
      </p>

      {/* Uploader */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm sm:p-5">
        <h4 className="text-sm font-semibold text-stone-900">Subir fotos</h4>

        <input
          type="text"
          value={pieFoto}
          onChange={(e) => setPieFoto(e.target.value)}
          placeholder="Pie de foto en español (opcional, se aplica a todas las fotos de esta tanda)"
          className="mt-3 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          maxLength={300}
        />

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 rounded-2xl bg-amber-700 px-4 py-4 text-base font-semibold text-white shadow-md transition hover:bg-amber-800 disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.4 10.5l4.77-8.26C13.47 2.09 12.75 2 12 2c-2.4 0-4.6.85-6.32 2.25l3.66 6.35.06-.1zM21.54 9c-.92-2.92-3.15-5.26-6-6.34L11.88 9h9.66zm.26 1h-7.49l.29.5 4.76 8.25C21 16.97 22 14.61 22 12c0-.69-.07-1.35-.2-2zM8.54 12l-3.9-6.75C3.01 7.03 2 9.39 2 12c0 .69.07 1.35.2 2h7.49l-1.15-2zm-6.08 3c.92 2.92 3.15 5.26 6 6.34L12.12 15H2.46zm11.27 0l-3.9 6.76c.7.15 1.42.24 2.17.24 2.4 0 4.6-.85 6.32-2.25l-3.66-6.35-.93 1.6z" />
            </svg>
            Hacer foto / vídeo
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-amber-300 bg-white px-4 py-4 text-base font-semibold text-amber-800 shadow-sm transition hover:border-amber-500 hover:bg-amber-50 disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
            Elegir de la galería
          </button>
        </div>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => uploadFiles(e.target.files)}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => uploadFiles(e.target.files)}
        />

        {progress ? (
          <p className="mt-3 text-sm font-medium text-amber-800">
            Subiendo {progress.done}/{progress.total}…
          </p>
        ) : null}
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </section>

      {/* Galería actual */}
      <section>
        <h4 className="mb-3 text-sm font-semibold text-stone-900">Fotos publicadas ({evento.fotos.length})</h4>
        {evento.fotos.length === 0 ? (
          <p className="text-sm text-stone-500">Aún no hay fotos.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {evento.fotos.map((f) => (
              <FotoCard key={f.id} foto={f} reload={reload} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FotoCard({
  foto,
  reload,
}: {
  foto: EventoEditDetail['fotos'][number];
  reload: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const toggleVisible = async () => {
    setBusy(true);
    try {
      await adminFetch(`/fotos/${foto.id}`, { method: 'PATCH', json: { visible: !foto.visible } });
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm('Eliminar esta foto?')) return;
    setBusy(true);
    try {
      await adminFetch(`/fotos/${foto.id}`, { method: 'DELETE' });
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="relative aspect-square bg-stone-100">
        <Image src={foto.url} alt={foto.pieFoto_es ?? ''} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 50vw, 25vw" />
        {!foto.visible ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-stone-800">Oculta</span>
          </div>
        ) : null}
      </div>
      {foto.pieFoto_es ? <p className="line-clamp-2 px-2 py-2 text-xs text-stone-600">{foto.pieFoto_es}</p> : null}
      <div className="flex border-t border-stone-100">
        <button onClick={toggleVisible} disabled={busy} className="flex-1 px-2 py-2 text-[11px] font-semibold text-stone-700 hover:bg-stone-50">
          {foto.visible ? 'Ocultar' : 'Mostrar'}
        </button>
        <button onClick={remove} disabled={busy} className="flex-1 border-l border-stone-100 px-2 py-2 text-[11px] font-semibold text-red-600 hover:bg-red-50">
          Eliminar
        </button>
      </div>
    </div>
  );
}
