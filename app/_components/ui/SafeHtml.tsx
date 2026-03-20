'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface SafeHtmlProps {
  html: string;
  className?: string;
}

export default function SafeHtml({ html, className = '' }: SafeHtmlProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  let processedHtml = html || '';
  if (processedHtml.includes('&lt;') || processedHtml.includes('&gt;')) {
    processedHtml = processedHtml
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }

  // Añadir cursor zoom-in y handler de click a todas las imágenes del HTML renderizado
  // Solo selecciona imágenes con data-content-img para no capturar las del lightbox
  useEffect(() => {
    if (!containerRef.current) return;

    // Marcar todas las imágenes del contenido
    const imgs = containerRef.current.querySelectorAll<HTMLImageElement>('img:not([data-lightbox-img])');
    const handlers: Array<{ img: HTMLImageElement; handler: (e: MouseEvent) => void }> = [];

    imgs.forEach((img) => {
      img.setAttribute('data-content-img', '1');
      img.style.cursor = 'zoom-in';
      const handler = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setLightboxImage({ url: img.src, alt: img.alt || '' });
      };
      img.addEventListener('click', handler);
      handlers.push({ img, handler });
    });

    return () => {
      handlers.forEach(({ img, handler }) => img.removeEventListener('click', handler));
    };
  }, [processedHtml]);

  // ESC para cerrar el lightbox + bloquear scroll
  useEffect(() => {
    if (!lightboxImage) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEsc);
    };
  }, [lightboxImage]);

  return (
    <>
      <div
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
        className={`safe-html-content ${className}`}
      />

      {mounted && lightboxImage && createPortal(
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <button
            onClick={() => setLightboxImage(null)}
            aria-label="Cerrar"
            style={{
              position: 'absolute',
              top: '20px', right: '20px',
              background: 'rgba(255,255,255,0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '40px', height: '40px',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#333',
            }}
          >
            ✕
          </button>
          {/* data-lightbox-img evita que el useEffect le añada handler de click */}
          <img
            src={lightboxImage.url}
            alt={lightboxImage.alt}
            data-lightbox-img="1"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
              borderRadius: '8px',
            }}
          />
        </div>,
        document.body
      )}
    </>
  );
}
