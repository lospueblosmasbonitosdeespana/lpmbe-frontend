'use client';

import { useState, useRef } from 'react';
import {
  isImageUrl,
  isHlsUrl,
  isEmbeddableIframeUrl,
  getComillasCameraFolder,
  getIbericamStreamId,
  RefreshingImage,
  HlsVideoPlayer,
  LiveBadge,
  ImageFullscreenModal,
} from '@/app/webcams/webcam-players';
import { resolveWebcamExternalHref } from '@/lib/webcam-external-href';

interface WebcamData {
  id: number;
  nombre: string;
  url: string;
  tipo?: string | null;
}

export default function WebcamPuebloPlayer({
  webcam,
  puebloNombre,
  puebloSlug,
  puebloFoto,
}: {
  webcam: WebcamData;
  puebloNombre: string;
  puebloSlug: string;
  puebloFoto?: string | null;
}) {
  const comillasUseLinkFallback = puebloSlug === 'comillas';
  const isImage =
    !comillasUseLinkFallback &&
    (isImageUrl(webcam.url) || !!getComillasCameraFolder(webcam.url) || !!getIbericamStreamId(webcam.url));
  const isHls = isHlsUrl(webcam.url);
  const isEmbeddableIframe = isEmbeddableIframeUrl(webcam.url);
  const [hlsFailed, setHlsFailed] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const hlsVideoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const alt = `${webcam.nombre} – ${puebloNombre}`;
  const showsDirectFeed = isImage || (isHls && !hlsFailed) || isEmbeddableIframe;

  const requestFullscreen = () => {
    const el = hlsVideoRef.current ?? iframeRef.current;
    if (!el) return;
    if (el instanceof HTMLVideoElement) {
      const v = el as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
      if (typeof v.webkitEnterFullscreen === 'function') {
        v.webkitEnterFullscreen();
        return;
      }
    }
    void el.requestFullscreen?.();
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative aspect-video w-full overflow-hidden bg-stone-200 dark:bg-neutral-800">
        {isImage ? (
          <>
            <LiveBadge label="EN DIRECTO" />
            <RefreshingImage key={webcam.id} src={webcam.url} alt={alt} />
            <button
              type="button"
              onClick={() => setImageModalOpen(true)}
              className="absolute bottom-3 right-3 z-10 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/70"
            >
              Pantalla completa
            </button>
          </>
        ) : isHls && !hlsFailed ? (
          <>
            <LiveBadge label="EN DIRECTO" />
            <HlsVideoPlayer
              ref={hlsVideoRef}
              src={webcam.url}
              alt={alt}
              onError={() => setHlsFailed(true)}
            />
            <button
              type="button"
              onClick={requestFullscreen}
              className="absolute bottom-3 right-3 z-10 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/70"
            >
              Pantalla completa
            </button>
          </>
        ) : isEmbeddableIframe ? (
          <>
            <LiveBadge label="EN DIRECTO" />
            <iframe
              ref={iframeRef}
              src={webcam.url}
              title={alt}
              className="h-full w-full"
              loading="lazy"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <button
              type="button"
              onClick={requestFullscreen}
              className="absolute bottom-3 right-3 z-10 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/70"
            >
              Pantalla completa
            </button>
          </>
        ) : (
          <>
            {puebloFoto ? (
              <img
                src={puebloFoto}
                alt={puebloNombre}
                className="h-full w-full object-cover brightness-[0.6]"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-stone-300 to-stone-500" />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
              <svg className="h-10 w-10 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <a
                href={resolveWebcamExternalHref(webcam.url, puebloSlug)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/20 px-5 py-2 text-sm font-semibold backdrop-blur-md transition hover:bg-white/30"
              >
                Ver webcam en directo ↗
              </a>
            </div>
            <LiveBadge label="EN DIRECTO" />
          </>
        )}
      </div>

      <div className="p-4">
        <h2 className="font-semibold">{webcam.nombre}</h2>
        {webcam.tipo && (
          <p className="mt-1 text-sm text-muted-foreground">{webcam.tipo}</p>
        )}
      </div>

      {imageModalOpen && isImage && (
        <ImageFullscreenModal
          src={webcam.url}
          alt={alt}
          onClose={() => setImageModalOpen(false)}
        />
      )}
    </div>
  );
}
