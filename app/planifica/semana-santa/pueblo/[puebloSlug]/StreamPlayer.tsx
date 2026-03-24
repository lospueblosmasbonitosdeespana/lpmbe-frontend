'use client';

import { useCallback, useRef, useState } from 'react';

function toEmbedUrl(url: string): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes('/embed/')) return trimmed;

  const liveMatch = trimmed.match(/youtube\.com\/(?:watch\?v=|live\/)([a-zA-Z0-9_-]{11})/);
  if (liveMatch) return `https://www.youtube.com/embed/${liveMatch[1]}?autoplay=1&rel=0`;

  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1&rel=0`;

  const channelPatterns = [
    /youtube\.com\/(?:c|channel|user)\/([^/?#]+)/,
    /youtube\.com\/@([^/?#]+)/,
  ];
  for (const pattern of channelPatterns) {
    const m = trimmed.match(pattern);
    if (m) return `https://www.youtube.com/embed/live_stream?channel=${m[1]}&autoplay=1&rel=0`;
  }

  return trimmed;
}

export default function StreamPlayer({
  streamUrl,
  villageName,
}: {
  streamUrl: string;
  villageName: string;
}) {
  const [playing, setPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen().catch(() => {});
    }
  }, []);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-md border bg-black" style={{ paddingBottom: '56.25%' }}>
      {playing ? (
        <>
          <iframe
            src={toEmbedUrl(streamUrl)}
            title={`Retransmisión en directo — ${villageName}`}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
          <button
            type="button"
            onClick={toggleFullscreen}
            className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-sm hover:bg-black/80 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M13.28 7.78l3.22-3.22v2.69a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.69l-3.22 3.22a.75.75 0 001.06 1.06zM2 17.25v-4.5a.75.75 0 011.5 0v2.69l3.22-3.22a.75.75 0 011.06 1.06L4.56 16.5h2.69a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75z" />
            </svg>
            Pantalla completa
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all hover:from-gray-800 hover:to-gray-700 group"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-lg shadow-red-600/30 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 ml-1">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-center px-4">
            <p className="text-lg font-semibold">Retransmisión en directo</p>
            <p className="mt-1 text-sm text-white/60">{villageName}</p>
            <p className="mt-3 text-xs text-white/40">Pulsa para iniciar la retransmisión</p>
          </div>
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">En directo</span>
          </div>
        </button>
      )}
    </div>
  );
}
