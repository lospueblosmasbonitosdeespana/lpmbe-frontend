'use client';

import { useEffect, useMemo, useState } from 'react';

type ZoomableImageProps = {
  src: string;
  alt: string;
  rotation?: number | null;
  className?: string;
  wrapperClassName?: string;
  fit?: 'contain' | 'cover';
  loading?: 'lazy' | 'eager';
  onError?: () => void;
};

function normalizeRotation(rotation?: number | null): number {
  const raw = rotation ?? 0;
  return ((raw % 360) + 360) % 360;
}

export default function ZoomableImage({
  src,
  alt,
  rotation,
  className = '',
  wrapperClassName = '',
  fit = 'cover',
  loading = 'lazy',
  onError,
}: ZoomableImageProps) {
  const [open, setOpen] = useState(false);
  const normalizedRotation = useMemo(() => normalizeRotation(rotation), [rotation]);
  const transformStyle = normalizedRotation ? { transform: `rotate(${normalizedRotation}deg)` } : undefined;

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`block w-full cursor-zoom-in overflow-hidden bg-background ${wrapperClassName}`}
        aria-label={`Ampliar imagen: ${alt}`}
      >
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          loading={loading}
          onError={onError}
          className={`h-full w-full ${fit === 'cover' ? 'object-cover' : 'object-contain'} ${className}`}
          style={transformStyle}
        />
      </button>

      {open && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          className="fixed inset-0 z-[10000] flex cursor-zoom-out items-center justify-center bg-black/90 p-4"
          aria-label="Cerrar imagen ampliada"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-5 top-5 h-10 w-10 rounded-full bg-white/90 text-xl text-black shadow"
            aria-label="Cerrar"
          >
            ×
          </button>
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            className="max-h-[92vh] max-w-full cursor-default object-contain"
            style={transformStyle}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
