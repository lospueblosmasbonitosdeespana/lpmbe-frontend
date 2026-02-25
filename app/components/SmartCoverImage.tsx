'use client';

import { useState } from 'react';

type Props = {
  src: string;
  alt: string;
};

/**
 * Muestra la imagen de portada adaptándose a su orientación real:
 * - Horizontal (landscape): ancho completo, altura máxima 520px, object-fit cover
 * - Cuadrada: centrada, max 600px
 * - Vertical (portrait/cartel): centrada, max-width 480px, sin recorte (height: auto)
 *
 * La detección ocurre en el cliente al cargar la imagen (onLoad).
 */
export default function SmartCoverImage({ src, alt }: Props) {
  type Orientation = 'unknown' | 'landscape' | 'portrait' | 'square';
  const [orientation, setOrientation] = useState<Orientation>('unknown');

  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const ratio = img.naturalWidth / img.naturalHeight;
    if (ratio > 1.2) setOrientation('landscape');
    else if (ratio < 0.85) setOrientation('portrait');
    else setOrientation('square');
  }

  const wrapperStyle: React.CSSProperties = {
    margin: '0 auto 48px',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    ...(orientation === 'landscape'
      ? { maxWidth: '900px', width: '100%' }
      : orientation === 'portrait'
      ? { maxWidth: '480px', width: '100%' }
      : { maxWidth: '640px', width: '100%' }),
  };

  const imgStyle: React.CSSProperties =
    orientation === 'landscape'
      ? {
          width: '100%',
          maxHeight: '520px',
          objectFit: 'cover',
          display: 'block',
          borderRadius: '8px',
        }
      : orientation === 'portrait'
      ? {
          width: '100%',
          height: 'auto',
          maxHeight: '750px',
          objectFit: 'contain',
          display: 'block',
          borderRadius: '8px',
        }
      : {
          // unknown o square: igual que portrait hasta saber orientación
          width: '100%',
          height: 'auto',
          maxHeight: '700px',
          objectFit: 'contain',
          display: 'block',
          borderRadius: '8px',
        };

  return (
    <div style={wrapperStyle}>
      <img src={src} alt={alt} style={imgStyle} onLoad={handleLoad} />
    </div>
  );
}
