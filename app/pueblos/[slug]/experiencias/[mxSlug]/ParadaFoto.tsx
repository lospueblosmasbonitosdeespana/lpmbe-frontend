'use client';

import { useState } from 'react';
import ZoomableImage from '@/app/components/ZoomableImage';

interface ParadaFotoProps {
  src: string;
  alt: string;
}

/**
 * Renderiza la foto de una parada.
 * Si la imagen falla (URL rota, 403, etc.) oculta el bloque
 * para evitar un hueco vacío en la página pública.
 */
export default function ParadaFoto({ src, alt }: ParadaFotoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <ZoomableImage
      src={src}
      alt={alt}
      fit="contain"
      wrapperClassName="relative aspect-video w-full"
      className="bg-muted"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
