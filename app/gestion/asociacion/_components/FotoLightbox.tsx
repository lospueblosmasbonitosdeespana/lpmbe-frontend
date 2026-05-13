'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Lightbox simple para ver una foto en grande. Se muestra como overlay
 * a pantalla completa con fondo oscuro semitransparente. Cierre con
 * tecla Escape, clic fuera o botón X.
 *
 * Uso:
 *   const [open, setOpen] = useState<string | null>(null);
 *   <img onClick={() => setOpen(url)} />
 *   {open && <FotoLightbox src={open} alt="..." onClose={() => setOpen(null)} />}
 */
export default function FotoLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? ''}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] max-w-[96vw] rounded-lg object-contain shadow-2xl"
      />
    </div>
  );
}
