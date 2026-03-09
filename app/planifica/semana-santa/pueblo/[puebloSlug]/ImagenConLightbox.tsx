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
        className="block w-full cursor-zoom-in text-left"
      >
        <img src={src} alt={alt} className={className} />
      </button>
      {open && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/90 p-4"
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
