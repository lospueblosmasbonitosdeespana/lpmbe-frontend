'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface Pueblo {
  id: number;
  nombre: string;
  slug: string;
  provincia: string;
  comunidad: string;
  foto_destacada: string | null;
}

interface Webcam {
  id: number;
  nombre: string;
  url: string;
  proveedor: string | null;
}

interface PuebloGroup {
  pueblo: Pueblo;
  webcams: Webcam[];
}

function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|gif|webp|bmp)(\?.*)?$/i.test(url);
}

function isHlsUrl(url: string): boolean {
  return /\.m3u8(\?.*)?$/i.test(url);
}

function isEmbeddableIframeUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    // Hosts verificados para embebido directo en card.
    return host === 'g0.ipcamlive.com' || host.endsWith('.ipcamlive.com');
  } catch {
    return false;
  }
}

/**
 * Extrae el hostname de una URL HLS para saber si puede pasar
 * por el proxy (mismo listado que en /api/webcams/hls-proxy/route.ts).
 */
const HLS_PROXY_ALLOWED_HOSTS = [
  'streaming.comunitatvalenciana.com',
  'cams.projecte4estacions.com',
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

/**
 * Reproduce un stream HLS (.m3u8) directamente en la tarjeta.
 *
 * Estrategia en dos pasos:
 * 1. Intenta reproducir el stream directo (sin proxy).
 * 2. Si falla con error fatal de red (típicamente CORS), y el host está
 *    en la lista de permitidos, reintenta a través del proxy /api/webcams/hls-proxy.
 * 3. Si el proxy también falla, llama a onError() y el componente padre
 *    muestra el overlay con enlace externo.
 *
 * En Safari el soporte HLS es nativo y no necesita proxy.
 */
function HlsVideoPlayer({
  src,
  alt,
  onError,
}: {
  src: string;
  alt: string;
  onError: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
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
          // Primera vez que falla y el host tiene proxy → reintentamos vía proxy.
          hlsInstance?.destroy();
          hlsInstance = null;
          void loadWithHls(buildProxyUrl(src), true);
        } else {
          // Ya es reintento o no hay proxy para este host → fallback externo.
          onError();
        }
      });

      hlsInstance.loadSource(url);
      hlsInstance.attachMedia(video);
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => { /* autoplay bloqueado por política del navegador */ });
      });
    };

    const setup = async () => {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari — soporte nativo HLS, sin CORS issues.
        video.src = src;
        try { await video.play(); } catch { /* autoplay bloqueado — ok, hay controles */ }
        return;
      }
      await loadWithHls(src, false);
    };

    void setup();

    return () => {
      destroyed = true;
      hlsInstance?.destroy();
    };
  }, [src, onError]);

  return (
    <video
      ref={videoRef}
      muted
      autoPlay
      playsInline
      controls
      className="h-full w-full object-cover"
      aria-label={alt}
    />
  );
}

function getComillasCameraFolder(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (!host.endsWith('comillas.es')) return null;

    // Si ya viene del endpoint get_latest_image.php, usa el folder de querystring.
    if (parsed.pathname.endsWith('/comillas/camaras/get_latest_image.php')) {
      const folder = (parsed.searchParams.get('folder') || '').trim();
      return /^camara\d+$/i.test(folder) ? folder : null;
    }

    // Si viene una imagen fija, extrae el folder (camara1, camara2, camara3...).
    const match = parsed.pathname.match(/\/comillas\/camaras\/(camara\d+)\//i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function RefreshingImage({ src, alt }: { src: string; alt: string }) {
  const comillasFolder = getComillasCameraFolder(src);
  const [resolvedSrc, setResolvedSrc] = useState(src);
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
          // Si falla, mantenemos el src existente como fallback.
        }
      } else if (active) {
        setResolvedSrc(src);
      }

      if (active) setCacheBust(Date.now());
    };

    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, 45_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [comillasFolder, src]);

  const separator = resolvedSrc.includes('?') ? '&' : '?';

  return (
    <img
      src={`${resolvedSrc}${separator}_t=${cacheBust}`}
      alt={alt}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      loading="lazy"
    />
  );
}

function LiveBadge({ label }: { label: string }) {
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

function WebcamCard({ webcam, pueblo, liveBadgeLabel, viewLiveLabel }: {
  webcam: Webcam;
  pueblo: Pueblo;
  liveBadgeLabel: string;
  viewLiveLabel: string;
}) {
  const isComillas = !!getComillasCameraFolder(webcam.url);
  const isImage = isImageUrl(webcam.url) || isComillas;
  const isHls = isHlsUrl(webcam.url);
  const isEmbeddableIframe = isEmbeddableIframeUrl(webcam.url);
  const [visible, setVisible] = useState(false);
  const [hlsFailed, setHlsFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: '300px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative aspect-video w-full overflow-hidden bg-stone-200 dark:bg-neutral-800">
      {!visible ? (
        <div className="flex h-full items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-stone-300 dark:bg-neutral-700" />
        </div>
      ) : isImage ? (
        <>
          <LiveBadge label={liveBadgeLabel} />
          {/* key: al cambiar de cámara en el carrusel, sin esto resolvedSrc seguía siendo la JPG anterior */}
          <RefreshingImage
            key={webcam.id}
            src={webcam.url}
            alt={`${webcam.nombre} – ${pueblo.nombre}`}
          />
        </>
      ) : isHls && !hlsFailed ? (
        <>
          <LiveBadge label={liveBadgeLabel} />
          <HlsVideoPlayer
            src={webcam.url}
            alt={`${webcam.nombre} – ${pueblo.nombre}`}
            onError={() => setHlsFailed(true)}
          />
          <a
            href={webcam.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 z-10 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/70"
          >
            {viewLiveLabel} ↗
          </a>
        </>
      ) : isEmbeddableIframe ? (
        <>
          <LiveBadge label={liveBadgeLabel} />
          <iframe
            src={webcam.url}
            title={`${webcam.nombre} – ${pueblo.nombre}`}
            className="h-full w-full"
            loading="lazy"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
          <a
            href={webcam.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/70"
          >
            {viewLiveLabel} ↗
          </a>
        </>
      ) : (
        <>
          {pueblo.foto_destacada ? (
            <img
              src={pueblo.foto_destacada}
              alt={pueblo.nombre}
              className="h-full w-full object-cover brightness-[0.6] transition-all duration-500 group-hover:scale-105 group-hover:brightness-[0.5]"
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
              href={webcam.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white/20 px-5 py-2 text-sm font-semibold backdrop-blur-md transition hover:bg-white/30"
            >
              {viewLiveLabel} ↗
            </a>
          </div>
          <LiveBadge label={liveBadgeLabel} />
        </>
      )}
    </div>
  );
}

function WebcamCarousel({ webcams, pueblo, liveBadgeLabel, viewLiveLabel }: {
  webcams: Webcam[];
  pueblo: Pueblo;
  liveBadgeLabel: string;
  viewLiveLabel: string;
}) {
  const [active, setActive] = useState(0);

  return (
    <div className="relative">
      <WebcamCard webcam={webcams[active]} pueblo={pueblo} liveBadgeLabel={liveBadgeLabel} viewLiveLabel={viewLiveLabel} />
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/50 px-2 py-1 backdrop-blur-sm">
        {webcams.map((w, i) => (
          <button
            key={w.id}
            onClick={() => setActive(i)}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition ${
              i === active ? 'bg-white text-stone-800' : 'text-white/80 hover:text-white'
            }`}
            title={w.nombre}
          >
            {w.nombre.length <= 12 ? w.nombre : `${i + 1}`}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WebcamsGrid({ groups }: { groups: PuebloGroup[] }) {
  const t = useTranslations('webcamsPage');
  const [filter, setFilter] = useState<string | null>(null);
  const comunidades = Array.from(new Set(groups.map(g => g.pueblo.comunidad))).sort();
  const filtered = filter ? groups.filter(g => g.pueblo.comunidad === filter) : groups;

  const liveBadgeLabel = t('liveBadge');
  const viewLiveLabel = t('viewLiveWebcam');

  return (
    <>
      {comunidades.length > 1 && (
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setFilter(null)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === null
                ? 'bg-[#b45309] text-white shadow-sm'
                : 'bg-white text-stone-600 shadow-sm ring-1 ring-stone-200 hover:bg-stone-50 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700'
            }`}
          >
            {t('filterAll')} ({groups.length})
          </button>
          {comunidades.map(c => {
            const count = groups.filter(g => g.pueblo.comunidad === c).length;
            return (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  filter === c
                    ? 'bg-[#b45309] text-white shadow-sm'
                    : 'bg-white text-stone-600 shadow-sm ring-1 ring-stone-200 hover:bg-stone-50 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700'
                }`}
              >
                {c} ({count})
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(({ pueblo, webcams }) => (
          <article
            key={pueblo.slug}
            className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
          >
            {webcams.length === 1 ? (
              <WebcamCard webcam={webcams[0]} pueblo={pueblo} liveBadgeLabel={liveBadgeLabel} viewLiveLabel={viewLiveLabel} />
            ) : (
              <WebcamCarousel webcams={webcams} pueblo={pueblo} liveBadgeLabel={liveBadgeLabel} viewLiveLabel={viewLiveLabel} />
            )}

            <div className="p-5">
              <Link href={`/pueblos/${pueblo.slug}`} className="group/link">
                <h2 className="text-xl font-bold text-stone-800 transition group-hover/link:text-[#b45309] dark:text-neutral-100">
                  {pueblo.nombre}
                </h2>
              </Link>
              <p className="mt-0.5 text-sm text-stone-500 dark:text-neutral-400">
                {pueblo.provincia}, {pueblo.comunidad}
              </p>
              {webcams.length === 1 && (
                <p className="mt-2 text-sm text-stone-400 dark:text-neutral-500">
                  {webcams[0].nombre}
                </p>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 dark:border-neutral-700">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-400">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  {webcams.length} {webcams.length === 1 ? t('webcamSingular') : t('webcamPlural')}
                </span>
                <Link
                  href={`/pueblos/${pueblo.slug}`}
                  className="text-sm font-medium text-[#b45309] hover:underline"
                >
                  {t('viewVillage')} →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
