'use client';

import { useState } from 'react';

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
    <div className="relative aspect-video w-full overflow-hidden bg-muted">
      <img
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        loading="lazy"
      />
    </div>
  );
}
