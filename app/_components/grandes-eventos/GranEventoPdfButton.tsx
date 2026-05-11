'use client';

import { useState, useEffect } from 'react';
import { FileDown, X, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Botón "Descargar programa" que abre el PDF en un modal a pantalla completa
 * dentro de la propia página, con un botón "Volver" bien visible.
 *
 * En móvil (iOS Safari) los iframes con PDFs directos NO funcionan: Safari
 * muestra una pantalla con "Abrir en Vista Previa". Para solucionarlo
 * usamos Google Docs Viewer que renderiza el PDF como imágenes embebibles
 * compatibles con iOS Safari.
 */
export default function GranEventoPdfButton({
  pdfUrl,
  className,
}: {
  pdfUrl: string;
  className?: string;
}) {
  const t = useTranslations('granEvento');
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Bloquear scroll del body mientras está abierto
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // En móvil usamos Google Docs Viewer (funciona en iOS Safari)
  // En desktop usamos el visor nativo del navegador (más rápido y mejor)
  const viewerSrc = isMobile
    ? `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`
    : `${pdfUrl}#view=FitH`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          'inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-amber-700 hover:text-amber-800 hover:shadow-md'
        }
      >
        <FileDown className="h-4 w-4" />
        {t('actions.downloadPdf')}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-stone-900"
          role="dialog"
          aria-modal="true"
        >
          {/* Barra superior */}
          <div className="shrink-0 flex items-center justify-between gap-3 bg-stone-900 px-3 py-3 text-white shadow-lg">
            <button
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25 active:bg-white/30"
              aria-label="Volver al programa"
            >
              <X className="h-4 w-4" />
              <span>Volver</span>
            </button>
            <p className="flex-1 truncate text-center text-sm font-medium opacity-90">
              Programa del evento
            </p>
            <a
              href={pdfUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 active:bg-amber-800"
              aria-label="Descargar PDF"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Descargar</span>
            </a>
          </div>

          {/* Visor PDF: Google Docs Viewer en móvil, nativo en desktop */}
          <div className="flex-1 min-h-0 bg-stone-100">
            <iframe
              src={viewerSrc}
              title="Programa PDF"
              className="h-full w-full border-0"
              allow="autoplay"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
