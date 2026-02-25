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

  if (orientation === 'landscape') {
    return (
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto 48px',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          style={{
            width: '100%',
            maxHeight: '520px',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>
    );
  }

  // Portrait, square o unknown → blurred backdrop a ancho completo
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '900px',
        margin: '0 auto 48px',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: orientation === 'unknown' ? '300px' : undefined,
      }}
    >
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
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: orientation === 'portrait' ? '420px' : '560px',
          width: '100%',
          height: 'auto',
          maxHeight: orientation === 'portrait' ? '720px' : '640px',
          objectFit: 'contain',
          display: 'block',
          borderRadius: '6px',
          margin: '32px auto',
          boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
        }}
      />
    </div>
  );
}
