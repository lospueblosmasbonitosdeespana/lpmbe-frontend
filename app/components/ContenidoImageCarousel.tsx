'use client';

import { useMemo, useState } from 'react';
import ZoomableImage from '@/app/components/ZoomableImage';

type Props = {
  images: string[];
  alt: string;
};

export default function ContenidoImageCarousel({ images, alt }: Props) {
  const validImages = useMemo(
    () => images.map((u) => u?.trim()).filter((u): u is string => !!u).slice(0, 10),
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
        <div className="relative z-[1] h-full w-full p-3 md:p-4">
          <ZoomableImage
            src={validImages[index]}
            alt={`${alt} (${index + 1}/${validImages.length})`}
            fit="contain"
            wrapperClassName="h-full rounded-md"
            className="h-full w-full"
            loading="eager"
          />
        </div>

        {validImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 z-[3] -translate-y-1/2 rounded-full bg-black/65 px-3 py-2 text-xl leading-none text-white shadow-md hover:bg-black/80"
              aria-label="Imagen anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 z-[3] -translate-y-1/2 rounded-full bg-black/65 px-3 py-2 text-xl leading-none text-white shadow-md hover:bg-black/80"
              aria-label="Imagen siguiente"
            >
              ›
            </button>
          </>
        )}
      </div>

      {validImages.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2 overflow-x-auto px-2 py-1">
          {validImages.map((img, i) => (
            <button
              key={`thumb-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ir a imagen ${i + 1}`}
              className={`shrink-0 h-14 w-14 rounded-lg overflow-hidden border-2 transition ${
                index === i ? 'border-primary ring-2 ring-primary/30' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
