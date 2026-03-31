'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface SafeHtmlProps {
  html: string;
  className?: string;
  altFallback?: string;
}

function injectAltFallback(raw: string, fallback: string): string {
  return raw.replace(/<img\b([^>]*?)>/gi, (match, attrs: string) => {
    if (/\balt\s*=/i.test(attrs)) {
      if (/alt\s*=\s*""\s*/i.test(attrs) || /alt\s*=\s*''\s*/i.test(attrs)) {
        return match
          .replace(/alt\s*=\s*""/i, `alt="${fallback}"`)
          .replace(/alt\s*=\s*''/i, `alt='${fallback}'`);
      }
      return match;
    }
    return `<img alt="${fallback}" ${attrs.trim()}>`;
  });
}

export default function SafeHtml({ html, className = '', altFallback }: SafeHtmlProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const setLightboxRef = useRef(setLightboxImage);
  setLightboxRef.current = setLightboxImage;

  useEffect(() => { setMounted(true); }, []);

  let processedHtml = html || '';
  if (processedHtml.includes('&lt;') || processedHtml.includes('&gt;')) {
    processedHtml = processedHtml
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }
  if (altFallback) {
    processedHtml = injectAltFallback(processedHtml, altFallback);
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const openLightbox = (img: HTMLImageElement) => {
      setLightboxRef.current({ url: img.src, alt: img.alt || '' });
    };

    const setupImg = (img: HTMLImageElement) => {
      if (img.dataset.lightboxImg) return;
      img.style.cursor = 'zoom-in';
      img.draggable = false;
      img.dataset.lbReady = '1';
      img.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openLightbox(img);
      };
      img.oncontextmenu = (e) => e.preventDefault();
    };

    container.querySelectorAll<HTMLImageElement>('img').forEach(setupImg);

    const observer = new MutationObserver(() => {
      container.querySelectorAll<HTMLImageElement>('img:not([data-lb-ready])').forEach(setupImg);
    });
    observer.observe(container, { childList: true, subtree: true });

    const handleClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'IMG' && !(el as HTMLImageElement).dataset.lightboxImg) {
        e.preventDefault();
        openLightbox(el as HTMLImageElement);
      }
    };
    container.addEventListener('click', handleClick);

    return () => {
      observer.disconnect();
      container.removeEventListener('click', handleClick);
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
          <div
            className="relative"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <img
              src={lightboxImage.url}
              alt={lightboxImage.alt}
              data-lightbox-img="1"
              draggable={false}
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
            {/* Capa transparente sobre la imagen ampliada */}
            <div style={{ position: 'absolute', inset: 0 }} aria-hidden="true" />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
