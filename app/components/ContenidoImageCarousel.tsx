'use client';

import { useMemo, useState } from 'react';

type Props = {
  images: string[];
  alt: string;
};

export default function ContenidoImageCarousel({ images, alt }: Props) {
  const validImages = useMemo(
    () => images.map((u) => u?.trim()).filter((u): u is string => !!u).slice(0, 3),
    [images]
  );
  const [index, setIndex] = useState(0);

  if (validImages.length === 0) return null;

  const prev = () => setIndex((i) => (i - 1 + validImages.length) % validImages.length);
  const next = () => setIndex((i) => (i + 1) % validImages.length);

  return (
    <div className="max-w-[900px] mx-auto mb-12">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
        <img
          src={validImages[index]}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-75 saturate-125"
        />
        <img
          src={validImages[index]}
          alt={`${alt} (${index + 1}/${validImages.length})`}
          className="relative z-[1] h-full w-full object-contain p-3 md:p-4"
          width={900}
          height={675}
        />

        {validImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 px-3 py-2 text-white hover:bg-black/70"
              aria-label="Imagen anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 px-3 py-2 text-white hover:bg-black/70"
              aria-label="Imagen siguiente"
            >
              ›
            </button>
          </>
        )}
      </div>

      {validImages.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {validImages.map((_, i) => (
            <button
              key={`dot-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ir a imagen ${i + 1}`}
              className={`h-2.5 w-2.5 rounded-full ${index === i ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
