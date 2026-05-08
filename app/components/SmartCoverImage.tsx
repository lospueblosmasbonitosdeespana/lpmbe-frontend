'use client';

import { useEffect, useState } from 'react';

type Props = {
  src: string;
  alt: string;
};

/**
 * Imagen de portada que se muestra completa, respetando su proporción
 * real (sin recortes ni "marco" fijo). Limita la altura a 80vh para
 * evitar fotos verticales gigantescas y abre lightbox al hacer clic.
 */
export default function SmartCoverImage({ src, alt }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <>
      <div className="mx-auto mb-12 flex w-full max-w-[1100px] justify-center px-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group block cursor-zoom-in overflow-hidden rounded-xl bg-muted shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-label={`Ampliar imagen: ${alt}`}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            draggable={false}
            className="block h-auto w-auto max-w-full max-h-[80vh] object-contain"
          />
        </button>
      </div>

      {open && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          onContextMenu={(e) => e.preventDefault()}
          className="fixed inset-0 z-[10000] flex cursor-zoom-out items-center justify-center bg-black/90 p-4 touch-none overscroll-contain"
          aria-label="Cerrar imagen ampliada"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xl text-black shadow"
            aria-label="Cerrar"
          >
            ×
          </button>
          <div
            className="relative"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              referrerPolicy="no-referrer"
              draggable={false}
              className="block max-h-[92vh] max-w-full cursor-default object-contain"
            />
            <div className="absolute inset-0" aria-hidden="true" />
          </div>
        </div>
      )}
    </>
  );
}
