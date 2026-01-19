'use client';

import { useEffect } from 'react';

type ImageLightboxProps = {
  imageUrl: string;
  imageAlt: string;
  onClose: () => void;
};

export default function ImageLightbox({ imageUrl, imageAlt, onClose }: ImageLightboxProps) {
  useEffect(() => {
    // Cerrar con tecla ESC
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={onClose}
    >
      {/* Botón cerrar */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.9)',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          cursor: 'pointer',
          fontSize: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#333',
        }}
        aria-label="Cerrar"
      >
        ✕
      </button>

      {/* Imagen */}
      <img
        src={imageUrl}
        alt={imageAlt}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  );
}
