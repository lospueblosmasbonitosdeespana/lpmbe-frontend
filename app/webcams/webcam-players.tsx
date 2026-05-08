'use client';

import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useCallback,
} from 'react';

/* ───── URL detection helpers ───── */

export function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|gif|webp|bmp)(\?.*)?$/i.test(url);
}

export function isHlsUrl(url: string): boolean {
  return /\.m3u8(\?.*)?$/i.test(url);
}

export function isEmbeddableIframeUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === 'g0.ipcamlive.com' ||
      host.endsWith('.ipcamlive.com') ||
      host === 'www.youtube.com' ||
      host === 'youtube.com' ||
      host === 'www.youtube-nocookie.com'
    );
  } catch {
    return false;
  }
}

const HLS_PROXY_ALLOWED_HOSTS = [
  'streaming.comunitatvalenciana.com',
  'cams.projecte4estacions.com',
  'camserver2.in2thebeach.es',
  'camserver.in2thebeach.es',
];

function canUseHlsProxy(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return HLS_PROXY_ALLOWED_HOSTS.some(
      (h) => hostname === h || hostname.endsWith(`.${h}`),
    );
  } catch {
    return false;
  }
}

function buildProxyUrl(src: string): string {
  return `/api/webcams/hls-proxy?url=${encodeURIComponent(src)}`;
}

/* ───── Comillas / Ibericam helpers ───── */

export function getComillasCameraFolder(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (!host.endsWith('comillas.es')) return null;
    if (parsed.pathname.endsWith('/comillas/camaras/get_latest_image.php')) {
      const folder = (parsed.searchParams.get('folder') || '').trim();
      return /^camara\d+$/i.test(folder) ? folder : null;
    }
    const match = parsed.pathname.match(/\/comillas\/camaras\/(camara\d+)\//i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function getIbericamStreamId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('ibericam.com')) return null;
    return parsed.searchParams.get('v') || null;
  } catch {
    return null;
  }
}

function ibericamPosterUrl(streamId: string): string {
  return `https://image.ibericam.com/poster/webcam-${streamId}.webp`;
}

/* ───── RefreshingImage ───── */

export function RefreshingImage({ src, alt, fullSize }: { src: string; alt: string; fullSize?: boolean }) {
  const comillasFolder = getComillasCameraFolder(src);
  const ibericamId = getIbericamStreamId(src);
  const initialSrc = ibericamId ? ibericamPosterUrl(ibericamId) : src;
  const [resolvedSrc, setResolvedSrc] = useState(initialSrc);
  const [cacheBust, setCacheBust] = useState(Date.now());

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      if (comillasFolder) {
        try {
          const res = await fetch(
            `/api/webcams/comillas-latest?folder=${encodeURIComponent(comillasFolder)}`,
            { cache: 'no-store' },
          );
          if (res.ok) {
            const data = await res.json() as { success?: boolean; imageUrl?: string };
            if (active && data.success && data.imageUrl) {
              setResolvedSrc(data.imageUrl);
            }
          }
        } catch {
          /* fallback: keep existing src */
        }
      } else if (ibericamId && active) {
        setResolvedSrc(ibericamPosterUrl(ibericamId));
      } else if (active) {
        setResolvedSrc(src);
      }

      if (active) setCacheBust(Date.now());
    };

    void refresh();
    const interval = setInterval(() => { void refresh(); }, 45_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [comillasFolder, ibericamId, src]);

  const separator = resolvedSrc.includes('?') ? '&' : '?';

  return (
    <img
      src={`${resolvedSrc}${separator}_t=${cacheBust}`}
      alt={alt}
      className={fullSize
        ? "max-h-[90vh] max-w-[95vw] rounded-lg object-contain"
        : "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      }
      loading="lazy"
    />
  );
}

/* ───── HlsVideoPlayer ───── */

export const HlsVideoPlayer = forwardRef<
  HTMLVideoElement,
  { src: string; alt: string; onError: () => void }
>(function HlsVideoPlayer({ src, alt, onError }, ref) {
  const innerRef = useRef<HTMLVideoElement | null>(null);

  const setVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      innerRef.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as { current: HTMLVideoElement | null }).current = el;
    },
    [ref],
  );

  useEffect(() => {
    const video = innerRef.current;
    if (!video) return;

    let hlsInstance: import('hls.js').default | null = null;
    let destroyed = false;

    const loadWithHls = async (url: string, isRetry: boolean) => {
      const { default: Hls } = await import('hls.js');
      if (!Hls.isSupported() || destroyed) { onError(); return; }

      hlsInstance?.destroy();
      hlsInstance = new Hls({ autoStartLoad: true, startLevel: -1, debug: false });

      hlsInstance.on(Hls.Events.ERROR, (_evt, data) => {
        if (!data.fatal) return;
        if (!isRetry && data.type === 'networkError' && canUseHlsProxy(src)) {
          hlsInstance?.destroy();
          hlsInstance = null;
          void loadWithHls(buildProxyUrl(src), true);
        } else {
          onError();
        }
      });

      hlsInstance.loadSource(url);
      hlsInstance.attachMedia(video);
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => { /* autoplay blocked */ });
      });
    };

    const setup = async () => {
      const startWithProxy = canUseHlsProxy(src);
      const playUrl = startWithProxy ? buildProxyUrl(src) : src;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = playUrl;
        try { await video.play(); } catch { /* autoplay blocked */ }
        return;
      }
      await loadWithHls(playUrl, startWithProxy);
    };

    void setup();

    return () => {
      destroyed = true;
      hlsInstance?.destroy();
    };
  }, [src, onError]);

  return (
    <video
      ref={setVideoRef}
      muted
      autoPlay
      playsInline
      controls
      className="h-full w-full object-cover"
      aria-label={alt}
    />
  );
});

/* ───── LiveBadge ───── */

export function LiveBadge({ label }: { label: string }) {
  return (
    <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold tracking-wider text-white backdrop-blur-sm">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
      </span>
      {label}
    </div>
  );
}

/* ───── ImageFullscreenModal ───── */

export function ImageFullscreenModal({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm touch-none overscroll-contain"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div
        className="max-h-[90vh] max-w-[95vw] overflow-hidden rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <RefreshingImage src={src} alt={alt} fullSize />
      </div>
    </div>
  );
}
