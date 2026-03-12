'use client';

import { useState } from 'react';

type Props = {
  src: string;
  alt: string;
};

type Orientation = 'unknown' | 'landscape' | 'portrait' | 'square';

/**
 * Muestra la imagen de portada adaptándose a su orientación real:
 *
 * - Landscape: ancho completo (max 900px), recortada con object-fit cover.
 * - Portrait / Square: la imagen se centra sobre un fondo que es la misma
 *   imagen estirada y muy desenfocada (blurred backdrop), igual que hace
 *   Apple Music / Spotify. Así no hay bordes blancos ni beige sueltos.
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

  // Reservar espacio desde el inicio para evitar CLS: aspect-ratio fijo según orientación
  if (orientation === 'landscape') {
    return (
      <div className="max-w-[900px] mx-auto mb-12 rounded-xl overflow-hidden aspect-[16/10] bg-muted">
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          className="w-full h-full object-cover block"
          width={900}
          height={563}
        />
      </div>
    );
  }

  // Portrait, square o unknown → blurred backdrop; mismo aspecto reservado siempre para evitar CLS al cambiar orientación
  return (
    <div className="relative w-full max-w-[900px] mx-auto mb-12 rounded-xl overflow-hidden flex items-center justify-center bg-muted aspect-[4/3]">
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
      {/* Imagen real centrada encima; dimensiones para evitar CLS */}
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        width={orientation === 'portrait' ? 420 : 560}
        height={orientation === 'portrait' ? 560 : 420}
        className="relative z-[1] max-w-[420px] w-full max-h-[720px] object-contain block rounded-md mx-8 my-8 shadow-lg"
        style={{
          maxWidth: orientation === 'portrait' ? '420px' : '560px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
        }}
      />
    </div>
  );
}
