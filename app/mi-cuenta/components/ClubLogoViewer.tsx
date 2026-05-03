'use client';

import { useState } from 'react';
import Image from 'next/image';

type Props = {
  src: string;
  alt: string;
  transform?: { scale: number; offsetX: number; offsetY: number } | null;
  className?: string;
  sizes?: string;
};

/**
 * Visor modal para el logo del Club en /mi-cuenta.
 * Permite ampliar el logo sin salir de la página.
 */
export default function ClubLogoViewer({
  src,
  alt,
  transform,
  className = 'relative h-[96px] w-[96px] overflow-hidden rounded-2xl border border-amber-200 bg-transparent shadow-sm dark:border-amber-900/60 sm:h-[112px] sm:w-[112px]',
  sizes = '112px',
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-2xl transition-transform hover:scale-[1.02]"
      >
        <div className={className}>
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            className="object-contain"
            style={
              transform
                ? {
                    transform: `translate(${transform.offsetX}%, ${transform.offsetY}%) scale(${transform.scale})`,
                  }
                : undefined
            }
          />
        </div>
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
              alt={alt}
              width={1800}
              height={1800}
              className="max-h-[94vh] w-auto max-w-[98vw] object-contain drop-shadow-[0_18px_36px_rgba(0,0,0,0.45)]"
              priority
            />
          </div>
        </div>
      )}
    </>
  );
}
