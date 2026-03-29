'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type ResolveResult = {
  status: 'live' | 'upcoming' | 'completed' | 'none';
  videoId: string | null;
  title: string | null;
  thumbnail: string | null;
  channelTitle: string | null;
  scheduledStart: string | null;
};

function isChannelUrl(url: string): boolean {
  return /youtube\.com\/(@|channel\/|c\/|user\/)/.test(url) || url.includes('/streams');
}

function extractDirectVideoId(url: string): string | null {
  const patterns = [
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function toWatchUrl(url: string): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) return trimmed;
  return trimmed;
}

function CastIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
      <line x1="2" y1="20" x2="2.01" y2="20" />
    </svg>
  );
}

const POLL_INTERVAL_MS = 120_000;

export default function StreamPlayer({
  streamUrl,
  villageName,
}: {
  streamUrl: string;
  villageName: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [showCastMenu, setShowCastMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const directVideoId = extractDirectVideoId(streamUrl);
  const needsResolve = !directVideoId && isChannelUrl(streamUrl);

  const [resolved, setResolved] = useState<ResolveResult | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!needsResolve) return;

    let cancelled = false;
    const doResolve = async () => {
      setResolving(true);
      try {
        const res = await fetch(`/api/youtube/resolve?url=${encodeURIComponent(streamUrl)}`);
        if (res.ok && !cancelled) {
          const data: ResolveResult = await res.json();
          setResolved(data);
        }
      } catch { /* ignore */ }
      if (!cancelled) setResolving(false);
    };

    doResolve();
    const interval = setInterval(doResolve, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [streamUrl, needsResolve]);

  const effectiveVideoId = directVideoId ?? resolved?.videoId ?? null;
  const embedUrl = effectiveVideoId
    ? `https://www.youtube.com/embed/${effectiveVideoId}?autoplay=1&rel=0`
    : null;

  const isLive = resolved?.status === 'live';
  const isUpcoming = resolved?.status === 'upcoming';
  const isCompleted = resolved?.status === 'completed' && !directVideoId;

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen().catch(() => {});
    }
  }, []);

  const watchUrl = effectiveVideoId
    ? `https://www.youtube.com/watch?v=${effectiveVideoId}`
    : toWatchUrl(streamUrl);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Semana Santa en directo — ${villageName}`,
          text: `Mira la retransmisión en directo de Semana Santa en ${villageName}`,
          url: watchUrl,
        });
        return;
      } catch { /* cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(watchUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.open(watchUrl, '_blank');
    }
  }, [villageName, watchUrl]);

  if (needsResolve && resolving && !resolved) {
    return (
      <div className="relative w-full overflow-hidden rounded-md border bg-black" style={{ paddingBottom: '56.25%' }}>
        <div className="absolute inset-0 flex items-center justify-center text-white/60">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
            <p className="text-sm">Conectando con el canal...</p>
          </div>
        </div>
      </div>
    );
  }

  if (needsResolve && resolved?.status === 'none') {
    return (
      <div className="relative w-full overflow-hidden rounded-md border bg-gradient-to-b from-gray-900 to-gray-800" style={{ paddingBottom: '56.25%' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 px-6">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-12 w-12 mb-3 text-white/30">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          <p className="text-base font-medium">No hay retransmisión disponible</p>
          <p className="mt-1 text-sm text-white/40">Vuelve cuando haya un evento programado</p>
          <a
            href={streamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z" />
            </svg>
            Ver canal en YouTube
          </a>
        </div>
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className="relative w-full overflow-hidden rounded-md border bg-black" style={{ paddingBottom: '56.25%' }}>
        <div className="absolute inset-0 flex items-center justify-center text-white/50">
          <p className="text-sm">No se puede cargar la retransmisión</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-md border bg-black" style={{ paddingBottom: '56.25%' }}>
      {playing ? (
        <>
          <iframe
            src={embedUrl}
            title={`Retransmisión en directo — ${villageName}`}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />

          {/* Status badge */}
          {isLive && (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white">En directo</span>
            </div>
          )}
          {isCompleted && resolved?.title && (
            <div className="absolute bottom-12 left-3 z-10 rounded-lg bg-black/70 px-3 py-1.5 text-xs text-white/80 backdrop-blur-sm">
              Última retransmisión: {resolved.title}
            </div>
          )}

          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCastMenu((v) => !v)}
              className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-sm hover:bg-black/80 transition-colors"
              title="Enviar a TV"
            >
              <CastIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Enviar a TV</span>
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-sm hover:bg-black/80 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M13.28 7.78l3.22-3.22v2.69a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.69l-3.22 3.22a.75.75 0 001.06 1.06zM2 17.25v-4.5a.75.75 0 011.5 0v2.69l3.22-3.22a.75.75 0 011.06 1.06L4.56 16.5h2.69a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75z" />
              </svg>
              <span className="hidden sm:inline">Pantalla completa</span>
            </button>
          </div>

          {showCastMenu && (
            <div className="absolute top-12 right-3 z-20 w-72 rounded-xl border border-white/10 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur-md">
              <p className="mb-3 text-sm font-semibold text-white">Enviar a TV</p>
              <button
                type="button"
                onClick={handleShare}
                className="mb-2 flex w-full items-center gap-3 rounded-lg bg-white/10 px-3 py-2.5 text-left text-sm text-white hover:bg-white/20 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 text-blue-400">
                  <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.474l6.733-3.367A2.52 2.52 0 0113 4.5z" />
                </svg>
                <div>
                  <p className="font-medium">{copied ? '¡Enlace copiado!' : 'Compartir enlace'}</p>
                  <p className="text-xs text-white/50">Envía el enlace a tu Smart TV o dispositivo</p>
                </div>
              </button>
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-3 flex w-full items-center gap-3 rounded-lg bg-white/10 px-3 py-2.5 text-left text-sm text-white hover:bg-white/20 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0 text-red-500">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z" />
                </svg>
                <div>
                  <p className="font-medium">Abrir en YouTube</p>
                  <p className="text-xs text-white/50">Usa Chromecast / AirPlay desde YouTube</p>
                </div>
              </a>
              <div className="rounded-lg border border-white/5 bg-white/5 px-3 py-2.5">
                <p className="text-xs leading-relaxed text-white/40">
                  <strong className="text-white/60">Consejo:</strong> En Chrome, pulsa el menú → Enviar. En Safari, pulsa el icono de AirPlay. En Smart TV, abre YouTube y busca el enlace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCastMenu(false)}
                className="mt-3 w-full rounded-lg py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                Cerrar
              </button>
            </div>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all hover:from-gray-800 hover:to-gray-700 group"
        >
          {/* Live badge or completed label */}
          {isLive && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">En directo</span>
            </div>
          )}
          {isCompleted && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">Última retransmisión</span>
            </div>
          )}
          {isUpcoming && (
            <div className="absolute top-3 left-3 flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Próximamente</span>
              </div>
              {resolved?.scheduledStart && (
                <span className="ml-4 text-[10px] text-amber-300/70">
                  {new Date(resolved.scheduledStart).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {' · '}
                  {new Date(resolved.scheduledStart).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          )}

          {resolved?.thumbnail && (
            <img
              src={resolved.thumbnail}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            />
          )}

          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-lg shadow-red-600/30 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 ml-1">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="relative text-center px-4">
            <p className="text-lg font-semibold">
              {isLive ? 'Retransmisión en directo' : isCompleted ? (resolved?.title ?? 'Última retransmisión') : isUpcoming ? (resolved?.title ?? 'Próximo directo') : 'Retransmisión en directo'}
            </p>
            <p className="mt-1 text-sm text-white/60">{villageName}</p>
            {isUpcoming && resolved?.scheduledStart && (
              <p className="mt-2 text-sm text-amber-300/80">
                {new Date(resolved.scheduledStart).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                {' a las '}
                {new Date(resolved.scheduledStart).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            <p className="mt-3 text-xs text-white/40">Pulsa para iniciar</p>
          </div>
        </button>
      )}
    </div>
  );
}
