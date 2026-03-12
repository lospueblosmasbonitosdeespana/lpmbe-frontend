'use client';

import { useState } from 'react';

export default function ImagenConLightbox({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full cursor-zoom-in text-left aspect-[4/3] overflow-hidden rounded-lg bg-muted"
      >
        <img
          src={src}
          alt={alt}
          className={`h-full w-full object-cover ${className}`}
          width={800}
          height={600}
        />
      </button>
      {open && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          className="fixed inset-0 z-[10000] flex cursor-zoom-out items-center justify-center bg-black/90 p-4"
          aria-label="Cerrar (clic o Escape)"
        >
          <img
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-full cursor-default object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
