'use client';

import { useState } from 'react';

type Props = {
  /** Ruta absoluta o path (ej. /planifica/semana-santa/pueblo/chinchon/dia/2026-04-04) */
  shareUrl: string;
  /** Título del evento para el texto a compartir */
  shareTitle: string;
  /** Texto opcional; si no se pasa se construye con shareTitle + "Semana Santa. Ver más: [url]" */
  shareText?: string;
};

export default function ShareEventoSemanaSanta({ shareUrl, shareTitle, shareText }: Props) {
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${shareUrl.startsWith('/') ? shareUrl : `/${shareUrl}`}` : shareUrl;
  const defaultText = `${shareTitle} · Semana Santa. Ver más:`;
  const textForShare = shareText ?? defaultText;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${textForShare} ${fullUrl}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textForShare)}&url=${encodeURIComponent(fullUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Compartir:</span>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-1.5 text-sm font-medium text-[#128C7E] hover:bg-[#25D366]/20"
        aria-label="Compartir por WhatsApp"
      >
        WhatsApp
      </a>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-black/20 bg-black/5 px-3 py-1.5 text-sm font-medium hover:bg-black/10"
        aria-label="Compartir en X (Twitter)"
      >
        X
      </a>
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-[#1877F2]/40 bg-[#1877F2]/10 px-3 py-1.5 text-sm font-medium text-[#1877F2] hover:bg-[#1877F2]/20"
        aria-label="Compartir en Facebook"
      >
        Facebook
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium hover:bg-muted"
      >
        {copied ? '✓ Enlace copiado' : 'Copiar enlace'}
      </button>
    </div>
  );
}
