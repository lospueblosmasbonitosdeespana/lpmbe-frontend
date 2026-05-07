'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import type { GranEventoFoto } from '@/lib/grandes-eventos';
import { pickI18n } from '@/lib/grandes-eventos';
import { getApiUrl } from '@/lib/api';

const POLL_INTERVAL_MS = 60_000;

/**
 * Galería en vivo del Gran Evento. Carga inicial server-side y luego polea para
 * mostrar fotos nuevas que el admin va subiendo desde Gestión / móvil. Soporta
 * lightbox al hacer clic.
 */
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
      } catch {
        // ignore
      }
    };
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [slug]);

  if (fotos.length === 0) {
    return <p className="text-center text-sm text-stone-500">{t('vacio')}</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {fotos.map((f) => {
          const pie = pickI18n(f.pieFoto_es, f.pieFoto_i18n, locale);
          return (
            <button
              key={f.id}
              onClick={() => setActiva(f)}
              className="group relative aspect-square overflow-hidden rounded-xl bg-stone-200 ring-1 ring-stone-200 transition hover:ring-2 hover:ring-amber-400"
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
            </button>
          );
        })}
      </div>

      {activa ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setActiva(null)}
        >
          <div className="relative max-h-[90vh] max-w-5xl">
            <Image
              src={activa.url}
              alt={pickI18n(activa.pieFoto_es, activa.pieFoto_i18n, locale) || ''}
              width={1600}
              height={1200}
              style={{ width: 'auto', height: 'auto', maxHeight: '85vh', maxWidth: '100%' }}
              className="rounded-lg"
            />
            {pickI18n(activa.pieFoto_es, activa.pieFoto_i18n, locale) ? (
              <p className="mt-3 text-center text-sm text-white/90">
                {pickI18n(activa.pieFoto_es, activa.pieFoto_i18n, locale)}
              </p>
            ) : null}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiva(null);
              }}
              className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-900 shadow-xl"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
