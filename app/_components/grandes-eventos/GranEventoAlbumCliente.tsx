'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import {
  Download,
  X,
  ArrowLeft,
  ArrowRight,
  Archive,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { GranEventoFoto } from '@/lib/grandes-eventos';
import { pickI18n } from '@/lib/grandes-eventos';

// ── Límites ────────────────────────────────────────────────────────────────
/** Máximo de fotos en descarga directa (sin ZIP). Más que esto → recomendar ZIP. */
const DIRECT_LIMIT = 10;

// ── Helpers de descarga ────────────────────────────────────────────────────

async function downloadBlob(url: string, filename: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 8000);
}

function buildFilename(foto: GranEventoFoto, ext?: string): string {
  const e = ext ?? foto.url.split('.').pop()?.split('?')[0] ?? 'jpg';
  if (foto.pieFoto_es) {
    return `${foto.pieFoto_es
      .slice(0, 40)
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ\s]/g, '')
      .trim()
      .replace(/\s+/g, '_')}.${e}`;
  }
  return `foto_${foto.id}.${e}`;
}

async function downloadZip(
  fotos: GranEventoFoto[],
  zipName: string,
  onProgress?: (done: number, total: number) => void,
) {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const folder = zip.folder('fotos') ?? zip;
  let done = 0;
  const CONCURRENCY = 4;
  for (let i = 0; i < fotos.length; i += CONCURRENCY) {
    await Promise.all(
      fotos.slice(i, i + CONCURRENCY).map(async (f) => {
        try {
          const res = await fetch(f.url);
          const blob = await res.blob();
          folder.file(buildFilename(f), blob);
        } catch { /* skip */ }
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

// ── Componente principal ───────────────────────────────────────────────────

export default function GranEventoAlbumCliente({
  fotos,
  locale,
}: {
  fotos: GranEventoFoto[];
  locale: string;
}) {
  const t = useTranslations('granEvento.galeria');

  // Lightbox
  const [activa, setActiva] = useState<GranEventoFoto | null>(null);
  const [activaIdx, setActivaIdx] = useState(0);

  // Selección
  const [seleccionando, setSeleccionando] = useState(false);
  const [seleccionadas, setSeleccionadas] = useState<Set<number>>(new Set());

  // Descarga en curso
  const [dlBusy, setDlBusy] = useState(false);
  const [dlProgress, setDlProgress] = useState<{ done: number; total: number } | null>(null);
  // Para descarga directa múltiple
  const [dlDirectProgress, setDlDirectProgress] = useState<{ done: number; total: number } | null>(null);
  // Aviso límite
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  // Navegación lightbox
  const nav = useCallback(
    (dir: number) => {
      setActivaIdx((prev) => {
        const next = (prev + dir + fotos.length) % fotos.length;
        setActiva(fotos[next]);
        return next;
      });
    },
    [fotos],
  );

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

  const toggleSeleccion = (id: number) =>
    setSeleccionadas((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const seleccionarTodas = () => setSeleccionadas(new Set(fotos.map((f) => f.id)));
  const deseleccionarTodas = () => setSeleccionadas(new Set());

  /** Descarga directa de fotos (una a una con pequeño intervalo). */
  const descargarDirectas = async (fotosList: GranEventoFoto[]) => {
    if (fotosList.length === 0) return;
    if (fotosList.length > DIRECT_LIMIT) {
      setShowLimitWarning(true);
      return;
    }
    setDlBusy(true);
    setDlDirectProgress({ done: 0, total: fotosList.length });
    for (let i = 0; i < fotosList.length; i++) {
      try {
        await downloadBlob(fotosList[i].url, buildFilename(fotosList[i]));
        setDlDirectProgress({ done: i + 1, total: fotosList.length });
        // Pequeño intervalo para que el navegador registre la descarga antes de la siguiente
        if (i < fotosList.length - 1) await new Promise((r) => setTimeout(r, 600));
      } catch { /* skip */ }
    }
    setDlBusy(false);
    setDlDirectProgress(null);
  };

  /** Descarga ZIP. */
  const descargarZip = async (fotosList: GranEventoFoto[], nombre: string) => {
    if (dlBusy) return;
    setDlBusy(true);
    setDlProgress({ done: 0, total: fotosList.length });
    try {
      await downloadZip(fotosList, nombre, (done, total) => setDlProgress({ done, total }));
    } finally {
      setDlBusy(false);
      setDlProgress(null);
    }
  };

  const fotosSeleccionadas = fotos.filter((f) => seleccionadas.has(f.id));

  return (
    <>
      {/* ── Barra de acciones ─────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-stone-500">{fotos.length} {fotos.length === 1 ? t('foto') : t('fotos')}</p>
        <div className="flex flex-wrap items-center gap-2">
          {!seleccionando && (
            <>
              {/* Descargar todas directo (si pocas) o ZIP */}
              {fotos.length <= DIRECT_LIMIT ? (
                <button
                  onClick={() => descargarDirectas(fotos)}
                  disabled={dlBusy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-50 disabled:opacity-50"
                >
                  {dlBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  {t('descargarTodas')}
                </button>
              ) : (
                <button
                  onClick={() => descargarZip(fotos, 'rencontres-2026-fotos.zip')}
                  disabled={dlBusy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-50 disabled:opacity-50"
                >
                  {dlBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
                  {t('descargarTodas')} (ZIP)
                </button>
              )}
            </>
          )}
          {/* Modo selección */}
          <button
            onClick={() => { setSeleccionando((v) => !v); setSeleccionadas(new Set()); setShowLimitWarning(false); }}
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

      {/* ── Barra de selección activa ─────────────────────────────────────── */}
      {seleccionando && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-amber-900">
              {t('seleccionadas', { n: seleccionadas.size })}
            </span>
            <button onClick={seleccionarTodas} className="text-xs text-amber-700 underline hover:no-underline">
              {t('todas')}
            </button>
            <button onClick={deseleccionarTodas} className="text-xs text-stone-500 underline hover:no-underline">
              {t('ninguna')}
            </button>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              {/* Descarga directa (sin ZIP) */}
              <button
                onClick={() => descargarDirectas(fotosSeleccionadas)}
                disabled={dlBusy || seleccionadas.size === 0}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-800 disabled:opacity-50"
              >
                {dlBusy && dlDirectProgress ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                {t('descargarDirecta')}
              </button>
              {/* ZIP (siempre disponible para selección) */}
              <button
                onClick={() => descargarZip(fotosSeleccionadas, 'rencontres-2026-seleccion.zip')}
                disabled={dlBusy || seleccionadas.size === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50 disabled:opacity-50"
              >
                {dlBusy && dlProgress ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
                ZIP
              </button>
            </div>
          </div>

          {/* Aviso límite descarga directa */}
          {showLimitWarning && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-xs text-amber-900">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span>{t('limitWarning', { limit: DIRECT_LIMIT })}</span>
              <button onClick={() => setShowLimitWarning(false)} className="ml-auto text-stone-400 hover:text-stone-600">✕</button>
            </div>
          )}
        </div>
      )}

      {/* ── Progreso ZIP ─────────────────────────────────────────────────── */}
      {dlProgress && (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs font-semibold text-amber-800">
            <span>{t('preparandoZip')} {dlProgress.done}/{dlProgress.total}</span>
            <span>{Math.round((dlProgress.done / Math.max(dlProgress.total, 1)) * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-amber-100">
            <div
              className="h-full bg-amber-700 transition-all duration-300"
              style={{ width: `${(dlProgress.done / Math.max(dlProgress.total, 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Progreso descarga directa ─────────────────────────────────────── */}
      {dlDirectProgress && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-2.5 text-xs font-semibold text-amber-900">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-700" />
          <span>{t('descargandoFoto')} {dlDirectProgress.done}/{dlDirectProgress.total}</span>
          <div className="ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-amber-200">
            <div
              className="h-full bg-amber-700 transition-all"
              style={{ width: `${(dlDirectProgress.done / Math.max(dlDirectProgress.total, 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Grid de fotos ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {fotos.map((f, idx) => {
          const pie = pickI18n(f.pieFoto_es, f.pieFoto_i18n, locale);
          const estaSeleccionada = seleccionadas.has(f.id);

          return (
            <div key={f.id} className="group relative">
              <button
                onClick={() => seleccionando ? toggleSeleccion(f.id) : (setActiva(f), setActivaIdx(idx))}
                className={`relative aspect-square w-full overflow-hidden rounded-xl bg-stone-200 ring-2 transition ${
                  seleccionando && estaSeleccionada ? 'ring-amber-500' : 'ring-stone-200 hover:ring-amber-400'
                }`}
              >
                <Image
                  src={f.url}
                  alt={pie || ''}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  style={{ objectFit: 'cover' }}
                  className="transition duration-500 group-hover:scale-105"
                />
                {pie ? (
                  <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pb-2 pt-6 text-left text-xs font-medium text-white">
                    {pie}
                  </span>
                ) : null}
                {/* Check de selección */}
                {seleccionando && (
                  <span className={`absolute right-2 top-2 rounded-full p-0.5 shadow ${estaSeleccionada ? 'bg-amber-500 text-white' : 'bg-white/80 text-stone-400'}`}>
                    {estaSeleccionada ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </span>
                )}
              </button>

              {/* Botón descarga por foto (visible siempre en móvil, hover en desktop) */}
              {!seleccionando && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadBlob(f.url, buildFilename(f));
                  }}
                  aria-label="Descargar foto"
                  className="absolute right-1.5 bottom-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white shadow transition hover:bg-black/70 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
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

            <div className="mt-3 flex items-center gap-3">
              <button onClick={() => nav(-1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30" aria-label="Anterior">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-white/60">{activaIdx + 1} / {fotos.length}</span>
              <button onClick={() => nav(1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30" aria-label="Siguiente">
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => downloadBlob(activa.url, buildFilename(activa))}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/30"
              >
                <Download className="h-4 w-4" /> {t('descargar')}
              </button>
            </div>

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
