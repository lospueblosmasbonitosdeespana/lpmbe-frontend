'use client';

import { useEffect, useMemo, useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  codigoQr: string;
  nombre: string;
  puebloNombre?: string | null;
  tipo?: string | null;
};

const SCAN_BASE_URL =
  typeof window !== 'undefined'
    ? `${window.location.origin}/club/scan`
    : 'https://lospueblosmasbonitosdeespana.org/club/scan';

export function QrCartelModal({ open, onClose, codigoQr, nombre, puebloNombre, tipo }: Props) {
  const printRef = useRef<HTMLDivElement | null>(null);

  const scanUrl = useMemo(() => {
    return `${SCAN_BASE_URL}?c=${encodeURIComponent(codigoQr)}`;
  }, [codigoQr]);

  const qrImageUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=10&data=${encodeURIComponent(scanUrl)}`;
  }, [scanUrl]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handlePrint() {
    const node = printRef.current;
    if (!node) return;

    const w = window.open('', '_blank', 'width=900,height=1100');
    if (!w) return;

    w.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>QR Club LPMBE — ${nombre.replace(/[<>"']/g, '')}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0; padding: 0; color: #1a1a1a;
    }
    .cartel {
      width: 100%; max-width: 540px; margin: 0 auto;
      padding: 24px;
      border: 2px solid #d97706;
      border-radius: 18px;
      background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%);
      text-align: center;
    }
    .brand {
      font-size: 12px; font-weight: 700; letter-spacing: 0.18em;
      text-transform: uppercase; color: #92400e; margin-bottom: 6px;
    }
    .heading {
      font-size: 26px; font-weight: 800; color: #1a1a1a; margin: 0 0 8px;
      line-height: 1.15;
    }
    .sub {
      font-size: 14px; color: #6b7280; margin-bottom: 20px;
    }
    .qr-wrap {
      background: white; border-radius: 12px; padding: 12px;
      display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .qr-wrap img { display: block; width: 280px; height: 280px; }
    .cta {
      margin-top: 18px; font-size: 16px; font-weight: 700; color: #1a1a1a;
    }
    .cta-sub {
      font-size: 13px; color: #4b5563; margin-top: 4px;
    }
    .footer {
      margin-top: 18px; font-size: 11px; color: #6b7280;
      border-top: 1px dashed #f59e0b; padding-top: 10px;
    }
    .negocio {
      font-size: 16px; font-weight: 700; color: #1a1a1a; margin-top: 14px;
    }
    .pueblo { font-size: 13px; color: #6b7280; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="cartel">
    <div class="brand">Los Pueblos Más Bonitos de España · El Club</div>
    <h1 class="heading">¿Eres socio de El Club?</h1>
    <p class="sub">Escanea este QR para registrar tu visita y sumar puntos</p>
    <div class="qr-wrap">
      <img src="${qrImageUrl}" alt="QR del Club" />
    </div>
    <div class="cta">Escanea con la cámara de tu móvil</div>
    <div class="cta-sub">Te llevará directamente a tu cuenta del Club</div>
    <div class="negocio">${nombre.replace(/[<>"']/g, '')}</div>
    ${puebloNombre ? `<div class="pueblo">${puebloNombre.replace(/[<>"']/g, '')}${tipo ? ` · ${tipo}` : ''}</div>` : ''}
    <div class="footer">Código: ${codigoQr.replace(/[<>"']/g, '')} · lospueblosmasbonitosdeespana.org</div>
  </div>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 250);
    });
  </script>
</body>
</html>`);
    w.document.close();
  }

  function handleDownload() {
    const a = document.createElement('a');
    a.href = qrImageUrl;
    a.download = `QR-${codigoQr}.png`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted/30"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        <div className="p-6">
          <h3 className="mb-1 text-lg font-bold">QR del Club</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Imprime este cartel y colócalo donde tus clientes puedan verlo. Cuando un socio del Club
            lo escanee, sumará puntos y quedará registrado.
          </p>

          <div ref={printRef} className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-center dark:border-amber-800/50 dark:bg-amber-950/20">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-300">
              El Club · Pueblos Más Bonitos
            </div>
            <p className="mb-3 text-xs text-amber-900/80 dark:text-amber-200/80">
              Escanea para sumar puntos
            </p>
            <div className="inline-block rounded-lg bg-white p-2 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrImageUrl} alt="QR del Club" className="h-40 w-40" />
            </div>
            <p className="mt-3 text-sm font-bold text-foreground">{nombre}</p>
            {puebloNombre && (
              <p className="text-xs text-muted-foreground">{puebloNombre}</p>
            )}
            <p className="mt-2 break-all font-mono text-[10px] text-muted-foreground">{codigoQr}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Printer size={15} aria-hidden />
              Imprimir cartel
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/30"
            >
              <Download size={15} aria-hidden />
              Descargar PNG
            </button>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            URL que codifica: <code className="break-all">{scanUrl}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
