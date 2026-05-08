'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import {
  Download,
  CheckSquare,
  Square,
  X,
  ArrowLeft,
  ArrowRight,
  Archive,
  Loader2,
} from 'lucide-react';
import type { GranEventoFoto } from '@/lib/grandes-eventos';
import { pickI18n } from '@/lib/grandes-eventos';
import { getApiUrl } from '@/lib/api';

const POLL_INTERVAL_MS = 60_000;

// ── Helpers de descarga ──────────────────────────────────────────────────────

async function downloadBlob(url: string, filename: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
}

async function downloadZip(fotos: GranEventoFoto[], zipName: string, onProgress?: (done: number, total: number) => void) {
  // Importación dinámica para no añadir peso al bundle inicial
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const folder = zip.folder('fotos') ?? zip;

  let done = 0;
  const CONCURRENCY = 4;
  const chunks: GranEventoFoto[][] = [];
  for (let i = 0; i < fotos.length; i += CONCURRENCY) {
    chunks.push(fotos.slice(i, i + CONCURRENCY));
  }

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (f) => {
        try {
          const res = await fetch(f.url);
          const blob = await res.blob();
          const ext = f.url.split('.').pop()?.split('?')[0] ?? 'jpg';
          const name = f.pieFoto_es
            ? `${String(f.id).padStart(4, '0')}_${f.pieFoto_es.slice(0, 40).replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ\s]/g, '').trim().replace(/\s+/g, '_')}.${ext}`
            : `foto_${String(f.id).padStart(4, '0')}.${ext}`;
          folder.file(name, blob);
        } catch {
          // si falla una foto, continúa
        }
        done += 1;
        onProgress?.(done, fotos.length);
      }),
    );
  }

  const content = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
  const objectUrl = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = zipName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function GranEventoGaleria({
  slug,
  fotosIniciales,
}: {
  slug: string;
  fotosIniciales: GranEventoFoto[];
}) {
  const locale = useLocale();
  const t = useTranslations('granEvento.galeria');
  const [fotos, setFotos] = useState<GranEventoFoto[]>(fotosIniciales);
  const [activa, setActiva] = useState<GranEventoFoto | null>(null);
  const [activaIdx, setActivaIdx] = useState<number>(0);

  // Selección múltiple
  const [seleccionando, setSeleccionando] = useState(false);
  const [seleccionadas, setSeleccionadas] = useState<Set<number>>(new Set());

  // Progreso ZIP
  const [zipProgress, setZipProgress] = useState<{ done: number; total: number } | null>(null);
  const [dlBusy, setDlBusy] = useState(false);

  // Poll fotos nuevas
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/public/grandes-eventos/${encodeURIComponent(slug)}/fotos?limit=120`, {
          cache: 'no-store',
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as GranEventoFoto[];
        if (!cancelled) setFotos(data);
      } catch { /* ignore */ }
    };
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [slug]);

  // Navegación en lightbox con teclas
  useEffect(() => {
    if (!activa) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiva(null);
      if (e.key === 'ArrowRight') nav(1);
      if (e.key === 'ArrowLeft') nav(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const abrirFoto = (f: GranEventoFoto, idx: number) => {
    setActiva(f);
    setActivaIdx(idx);
  };

  const nav = useCallback((dir: number) => {
    setActivaIdx((prev) => {
      const next = (prev + dir + fotos.length) % fotos.length;
      setActiva(fotos[next]);
      return next;
    });
  }, [fotos]);

  const toggleSeleccion = (id: number) => {
    setSeleccionadas((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const seleccionarTodas = () => setSeleccionadas(new Set(fotos.map((f) => f.id)));
  const deseleccionarTodas = () => setSeleccionadas(new Set());

  const handleZip = async (fotosADescargar: GranEventoFoto[], nombre: string) => {
    if (dlBusy) return;
    setDlBusy(true);
    setZipProgress({ done: 0, total: fotosADescargar.length });
    try {
      await downloadZip(fotosADescargar, nombre, (done, total) => setZipProgress({ done, total }));
    } finally {
      setDlBusy(false);
      setZipProgress(null);
    }
  };

  if (fotos.length === 0) {
    return <p className="text-center text-sm text-stone-500">{t('vacio')}</p>;
  }

  const fotosSeleccionadas = fotos.filter((f) => seleccionadas.has(f.id));

  return (
    <>
      {/* Barra de acciones */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-stone-500">{fotos.length} fotos</p>

        <div className="flex flex-wrap items-center gap-2">
          {/* Descargar todas */}
          {!seleccionando && (
            <button
              onClick={() => handleZip(fotos, `rencontres-2026-fotos.zip`)}
              disabled={dlBusy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-50 disabled:opacity-50"
            >
              {dlBusy && !zipProgress ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Archive className="h-3.5 w-3.5" />
              )}
              {t('descargarTodas')}
            </button>
          )}

          {/* Botón entrar/salir modo selección */}
          <button
            onClick={() => {
              setSeleccionando((v) => !v);
              setSeleccionadas(new Set());
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-sm transition ${
              seleccionando
                ? 'bg-amber-700 text-white hover:bg-amber-800'
                : 'border border-stone-300 bg-white text-stone-700 hover:border-amber-400 hover:bg-amber-50'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            {seleccionando ? t('cancelarSeleccion') : t('seleccionarFotos')}
          </button>
        </div>
      </div>

      {/* Barra de selección activa */}
      {seleccionando && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3">
          <span className="text-xs font-semibold text-amber-900">
            {t('seleccionadas', { n: seleccionadas.size })}
          </span>
          <button onClick={seleccionarTodas} className="text-xs text-amber-700 underline hover:no-underline">
            {t('todas')}
          </button>
          <button onClick={deseleccionarTodas} className="text-xs text-stone-500 underline hover:no-underline">
            {t('ninguna')}
          </button>
          <div className="ml-auto">
            <button
              onClick={() => handleZip(fotosSeleccionadas, `rencontres-2026-seleccion.zip`)}
              disabled={dlBusy || seleccionadas.size === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-800 disabled:opacity-50"
            >
              {dlBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              {t('descargarSeleccion')}
            </button>
          </div>
        </div>
      )}

      {/* Progreso ZIP */}
      {zipProgress && (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs font-semibold text-amber-800">
            <span>{t('preparandoZip')} {zipProgress.done}/{zipProgress.total}</span>
            <span>{Math.round((zipProgress.done / Math.max(zipProgress.total, 1)) * 100)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-amber-100">
            <div
              className="h-full bg-amber-700 transition-all duration-300"
              style={{ width: `${(zipProgress.done / Math.max(zipProgress.total, 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Grid de fotos */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {fotos.map((f, idx) => {
          const pie = pickI18n(f.pieFoto_es, f.pieFoto_i18n, locale);
          const estaSeleccionada = seleccionadas.has(f.id);

          return (
            <button
              key={f.id}
              onClick={() => seleccionando ? toggleSeleccion(f.id) : abrirFoto(f, idx)}
              className={`group relative aspect-square overflow-hidden rounded-xl bg-stone-200 ring-2 transition ${
                seleccionando && estaSeleccionada
                  ? 'ring-amber-500'
                  : 'ring-stone-200 hover:ring-amber-400'
              }`}
            >
              <Image
                src={f.url}
                alt={pie || ''}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                style={{ objectFit: 'cover' }}
                className="transition duration-500 group-hover:scale-105"
              />
              {pie ? (
                <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pb-2 pt-6 text-left text-xs font-medium text-white">
                  {pie}
                </span>
              ) : null}
              {/* Icono selección */}
              {seleccionando && (
                <span className={`absolute right-2 top-2 rounded-full p-0.5 ${estaSeleccionada ? 'bg-amber-500 text-white' : 'bg-white/80 text-stone-400'}`}>
                  {estaSeleccionada ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {activa ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 touch-none overscroll-contain"
          onClick={() => setActiva(null)}
        >
          <div
            className="relative flex max-h-[90vh] max-w-5xl flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activa.url}
              alt={pickI18n(activa.pieFoto_es, activa.pieFoto_i18n, locale) || ''}
              width={1600}
              height={1200}
              style={{ width: 'auto', height: 'auto', maxHeight: '80vh', maxWidth: '100%' }}
              className="rounded-lg"
            />
            {pickI18n(activa.pieFoto_es, activa.pieFoto_i18n, locale) ? (
              <p className="mt-3 text-center text-sm text-white/90">
                {pickI18n(activa.pieFoto_es, activa.pieFoto_i18n, locale)}
              </p>
            ) : null}

            {/* Controles del lightbox */}
            <div className="mt-3 flex items-center gap-3">
              {/* Navegación */}
              <button
                onClick={() => nav(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30"
                aria-label="Anterior"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-white/60">{activaIdx + 1} / {fotos.length}</span>
              <button
                onClick={() => nav(1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30"
                aria-label="Siguiente"
              >
                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Descargar esta foto */}
              <button
                onClick={() => {
                  const ext = activa.url.split('.').pop()?.split('?')[0] ?? 'jpg';
                  const name = activa.pieFoto_es
                    ? `${activa.pieFoto_es.slice(0, 40).replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚ\s]/g, '').trim().replace(/\s+/g, '_')}.${ext}`
                    : `foto_${activa.id}.${ext}`;
                  downloadBlob(activa.url, name);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/30"
                aria-label="Descargar foto"
              >
                <Download className="h-4 w-4" /> {t('descargar')}
              </button>
            </div>

            {/* Cerrar */}
            <button
              onClick={() => setActiva(null)}
              className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-900 shadow-xl"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
