'use client';

import { useState } from 'react';
import Image from 'next/image';
import NivelIcono, { NIVEL_AVATAR_SRC } from './NivelIcono';

type Props = {
  nombreNivel: string;
  className?: string;
  imgClassName?: string;
  /** URL alternativa configurada por el admin (mi-cuenta-usuarios) */
  srcOverride?: string | null;
};

/**
 * Visor modal para el avatar de nivel en /mi-cuenta.
 * Evita abrir el PNG en página completa y mantiene la UX dentro del dashboard.
 */
export default function NivelAvatarViewer({
  nombreNivel,
  className = '',
  imgClassName = '',
  srcOverride,
}: Props) {
  const [open, setOpen] = useState(false);
  const fallback =
    NIVEL_AVATAR_SRC[nombreNivel] ?? NIVEL_AVATAR_SRC['Turista Curioso'];
  const src = srcOverride && srcOverride.trim() ? srcOverride : fallback;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-2xl transition-transform hover:scale-[1.02]"
      >
        <NivelIcono
          nombreNivel={nombreNivel}
          className={className}
          imgClassName={imgClassName}
          srcOverride={srcOverride}
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-[3px]"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative flex max-h-[96vh] w-auto max-w-[99vw] items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-1 top-1 z-10 rounded-full border border-white/25 bg-black/70 px-2.5 py-1 text-sm font-semibold text-white hover:bg-black/90"
            >
              ×
            </button>
            <Image
              src={src}
              alt={nombreNivel}
              width={1800}
              height={1800}
              className="max-h-[94vh] w-auto max-w-[98vw] scale-[1.35] object-contain drop-shadow-[0_18px_36px_rgba(0,0,0,0.45)] md:scale-[1.45]"
              priority
            />
          </div>
        </div>
      )}
    </>
  );
}
