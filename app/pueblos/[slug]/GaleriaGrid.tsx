'use client';

import { useState } from 'react';
import ImageLightbox from './ImageLightbox';

type FotoGaleria = {
  id: number;
  url: string;
  rotation?: number; // Grados de rotación (0, 90, 180, 270)
};

type GaleriaGridProps = {
  fotos: FotoGaleria[];
  puebloNombre: string;
};

export default function GaleriaGrid({ fotos, puebloNombre }: GaleriaGridProps) {
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);

  return (
    <>
      <div className="galeria-grid">
        {fotos.map((foto, index) => (
          <div
            key={foto.id}
            style={{
              aspectRatio: '4 / 3',
              overflow: 'hidden',
              backgroundColor: '#f5f5f5',
              cursor: 'pointer',
            }}
            onClick={() => setLightboxImage({ url: foto.url, alt: `${puebloNombre} - Foto ${index + 1}` })}
          >
            <img
              src={foto.url}
              alt={`${puebloNombre} - Foto ${index + 1}`}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transform: `rotate(${foto.rotation ?? 0}deg)`,
              }}
            />
          </div>
        ))}
      </div>

      {lightboxImage && (
        <ImageLightbox
          imageUrl={lightboxImage.url}
          imageAlt={lightboxImage.alt}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </>
  );
}
