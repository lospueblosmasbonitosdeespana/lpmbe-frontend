'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, ImageIcon, Eye, EyeOff, Trash2, CheckCircle2, CalendarDays } from 'lucide-react';
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
    const fileArr = Array.from(files);
    setUploading(true);
    setError(null);
    setProgress({ done: 0, total: fileArr.length });

    // Subida en paralelo con concurrencia máx. 3 para no saturar la conexión móvil.
    const CONCURRENCY = 3;
    let done = 0;
    const errors: string[] = [];

    const uploadOne = async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      if (pieFoto.trim()) formData.append('pieFoto_es', pieFoto.trim());
      try {
        const res = await fetch(`/api/admin/grandes-eventos/${evento.id}/fotos/upload`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          errors.push((data as { error?: string }).error || `Error en ${file.name}`);
        }
      } catch {
        errors.push(`Sin conexión al subir ${file.name}`);
      } finally {
        done += 1;
        setProgress({ done, total: fileArr.length });
      }
    };

    // Procesar en chunks de CONCURRENCY
    for (let i = 0; i < fileArr.length; i += CONCURRENCY) {
      await Promise.all(fileArr.slice(i, i + CONCURRENCY).map(uploadOne));
    }

    if (errors.length > 0) setError(errors.join(' · '));
    setPieFoto('');
    await reload();
    setUploading(false);
    setProgress(null);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-stone-600">
        Sube las fotos del evento desde el móvil o el ordenador. Aparecen en la galería pública en tiempo real (poll cada 60s).
        Puedes seleccionar <strong>varias fotos a la vez</strong> desde la galería — se suben de 3 en 3 en paralelo.
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
            <Camera className="h-5 w-5" />
            Hacer foto / vídeo
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-amber-300 bg-white px-4 py-4 text-base font-semibold text-amber-800 shadow-sm transition hover:border-amber-500 hover:bg-amber-50 disabled:opacity-50"
          >
            <ImageIcon className="h-5 w-5" />
            Galería (varias a la vez)
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
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-amber-800">
              <span>Subiendo {progress.done} de {progress.total}…</span>
              <span>{Math.round((progress.done / Math.max(progress.total, 1)) * 100)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-amber-100">
              <div
                className="h-full bg-amber-700 transition-all"
                style={{ width: `${(progress.done / Math.max(progress.total, 1)) * 100}%` }}
              />
            </div>
          </div>
        ) : null}
        {!progress && !error && !uploading && evento.fotos.length > 0 ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Última subida correcta
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
  // Fecha local: YYYY-MM-DD para el input type="date"
  const [fechaLocal, setFechaLocal] = useState<string>(
    foto.fechaFoto ? foto.fechaFoto.slice(0, 10) : '',
  );
  const [editandoFecha, setEditandoFecha] = useState(false);

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

  const saveFecha = async (value: string) => {
    setBusy(true);
    try {
      // Enviar como ISO con hora 12:00 UTC para evitar desfases de zona
      const fechaFoto = value ? `${value}T12:00:00.000Z` : null;
      await adminFetch(`/fotos/${foto.id}`, { method: 'PATCH', json: { fechaFoto } });
      setFechaLocal(value);
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
      setEditandoFecha(false);
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

      {/* Fecha de la foto (para agrupar en el álbum) */}
      <div className="border-t border-stone-100 px-2 py-2">
        {editandoFecha ? (
          <div className="flex items-center gap-1">
            <input
              type="date"
              defaultValue={fechaLocal}
              className="flex-1 rounded border border-stone-300 px-1 py-0.5 text-[11px] focus:border-amber-400 focus:outline-none"
              onBlur={(e) => saveFecha(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveFecha((e.target as HTMLInputElement).value);
                if (e.key === 'Escape') setEditandoFecha(false);
              }}
              autoFocus
              disabled={busy}
            />
            <button
              onClick={() => setEditandoFecha(false)}
              className="text-[10px] text-stone-400 hover:text-stone-600"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditandoFecha(true)}
            className="inline-flex w-full items-center gap-1 text-[11px] text-stone-500 hover:text-amber-700"
          >
            <CalendarDays className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {fechaLocal
                ? new Date(`${fechaLocal}T12:00:00Z`).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Asignar fecha'}
            </span>
          </button>
        )}
      </div>

      <div className="flex border-t border-stone-100">
        <button onClick={toggleVisible} disabled={busy} className="inline-flex flex-1 items-center justify-center gap-1 px-2 py-2 text-[11px] font-semibold text-stone-700 hover:bg-stone-50">
          {foto.visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          {foto.visible ? 'Ocultar' : 'Mostrar'}
        </button>
        <button onClick={remove} disabled={busy} className="inline-flex flex-1 items-center justify-center gap-1 border-l border-stone-100 px-2 py-2 text-[11px] font-semibold text-red-600 hover:bg-red-50">
          <Trash2 className="h-3 w-3" /> Eliminar
        </button>
      </div>
    </div>
  );
}
