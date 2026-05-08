'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Download, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { GranEventoFoto } from '@/lib/grandes-eventos';
import { pickI18n } from '@/lib/grandes-eventos';

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

export default function GranEventoAlbumCliente({
  fotos,
  locale,
}: {
  fotos: GranEventoFoto[];
  locale: string;
}) {
  const t = useTranslations('granEvento.galeria');
  const [activa, setActiva] = useState<GranEventoFoto | null>(null);
  const [activaIdx, setActivaIdx] = useState(0);

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

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {fotos.map((f, idx) => {
          const pie = pickI18n(f.pieFoto_es, f.pieFoto_i18n, locale);
          return (
            <button
              key={f.id}
              onClick={() => { setActiva(f); setActivaIdx(idx); }}
              className="group relative aspect-square overflow-hidden rounded-xl bg-stone-200 ring-2 ring-stone-200 transition hover:ring-amber-400"
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

            <div className="mt-3 flex items-center gap-3">
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
              <button
                onClick={() => {
                  const ext = activa.url.split('.').pop()?.split('?')[0] ?? 'jpg';
                  const name = activa.pieFoto_es
                    ? `${activa.pieFoto_es.slice(0, 40).replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚ\s]/g, '').trim().replace(/\s+/g, '_')}.${ext}`
                    : `foto_${activa.id}.${ext}`;
                  downloadBlob(activa.url, name);
                }}
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
