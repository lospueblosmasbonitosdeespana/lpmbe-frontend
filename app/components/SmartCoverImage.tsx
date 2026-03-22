'use client';

import { useState } from 'react';
import ZoomableImage from '@/app/components/ZoomableImage';

type Props = {
  src: string;
  alt: string;
};

type Orientation = 'unknown' | 'landscape' | 'portrait' | 'square';

/**
 * Muestra la imagen de portada adaptándose a su orientación real.
 *
 * El contenedor SIEMPRE usa aspect-[16/10] para evitar CLS: el tamaño
 * no cambia cuando se detecta la orientación, solo cambia la presentación
 * interna (landscape → cover directo; portrait/square → blurred backdrop).
 */
export default function SmartCoverImage({ src, alt }: Props) {
  const [orientation, setOrientation] = useState<Orientation>('unknown');

  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const ratio = img.naturalWidth / img.naturalHeight;
    if (ratio > 1.2) setOrientation('landscape');
    else if (ratio < 0.85) setOrientation('portrait');
    else setOrientation('square');
  }

  const isLandscape = orientation === 'landscape';

  return (
    <div className="relative w-full max-w-[900px] mx-auto mb-12 rounded-xl overflow-hidden flex items-center justify-center bg-muted aspect-[16/10]">
      {/* Imagen oculta para detectar orientación real sin afectar layout */}
      {orientation === 'unknown' && (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          onLoad={handleLoad}
          className="hidden"
        />
      )}

      {isLandscape ? (
        <ZoomableImage
          src={src}
          alt={alt}
          fit="contain"
          wrapperClassName="h-full w-full"
          className="block"
        />
      ) : (
        <>
          {/* Fondo desenfocado: misma imagen estirada */}
          <img
            src={src}
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'blur(28px) brightness(0.75) saturate(1.2)',
              transform: 'scale(1.1)',
            }}
          />
          {/* Imagen real centrada encima */}
          <div
            className="relative z-[1] mx-8 my-8 w-full"
            style={{ maxWidth: orientation === 'portrait' ? '420px' : '560px' }}
          >
            <ZoomableImage
              src={src}
              alt={alt}
              fit="contain"
              wrapperClassName="w-full rounded-md"
              className="max-h-[720px] rounded-md shadow-lg"
            />
          </div>
        </>
      )}
    </div>
  );
}
