'use client';

import { useState } from 'react';
import Image from 'next/image';
import NivelIcono, { NIVEL_AVATAR_SRC } from './NivelIcono';

type Props = {
  nombreNivel: string;
  className?: string;
  imgClassName?: string;
};

/**
 * Visor modal para el avatar de nivel en /mi-cuenta.
 * Evita abrir el PNG en página completa y mantiene la UX dentro del dashboard.
 */
export default function NivelAvatarViewer({
  nombreNivel,
  className = '',
  imgClassName = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const src = NIVEL_AVATAR_SRC[nombreNivel] ?? NIVEL_AVATAR_SRC['Turista Curioso'];

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
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-neutral-900 to-neutral-950 p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 rounded-full bg-black/65 px-2.5 py-1 text-sm font-semibold text-white hover:bg-black/85"
            >
              ×
            </button>

            <div className="relative flex h-[72vh] w-full items-center justify-center rounded-2xl bg-neutral-100/90 p-4">
              <Image
                src={src}
                alt={nombreNivel}
                width={1400}
                height={1400}
                className="max-h-full w-auto max-w-full object-contain drop-shadow-[0_8px_22px_rgba(0,0,0,0.28)]"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
