'use client';

import {
  useState,
  useEffect,
  useRef,
} from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { resolveWebcamExternalHref } from '@/lib/webcam-external-href';
import ShareButton from '@/app/components/ShareButton';
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
} from './webcam-players';

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

function WebcamCard({ webcam, pueblo, liveBadgeLabel, viewLiveLabel, fullscreenLabel }: {
  webcam: Webcam;
  pueblo: Pueblo;
  liveBadgeLabel: string;
  viewLiveLabel: string;
  fullscreenLabel: string;
}) {
  // Comillas: no incrustar imagen refrescada (suele fallar / verse en blanco).
  // Mismo comportamiento que el resto de URLs no embebibles: foto del pueblo + enlace a la página de la webcam.
  const comillasUseLinkFallback = pueblo.slug === 'comillas';
  const isImage =
    !comillasUseLinkFallback &&
    (isImageUrl(webcam.url) || !!getComillasCameraFolder(webcam.url) || !!getIbericamStreamId(webcam.url));
  const isHls = isHlsUrl(webcam.url);
  const isEmbeddableIframe = isEmbeddableIframeUrl(webcam.url);
  const [visible, setVisible] = useState(false);
  const [hlsFailed, setHlsFailed] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hlsVideoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const requestStreamFullscreen = () => {
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
    <>
      {imageModalOpen && isImage && (
        <ImageFullscreenModal
          src={webcam.url}
          alt={`${webcam.nombre} – ${pueblo.nombre}`}
          onClose={() => setImageModalOpen(false)}
        />
      )}
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
          <button
            type="button"
            onClick={() => setImageModalOpen(true)}
            className="absolute bottom-3 right-3 z-10 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/70"
          >
            {fullscreenLabel}
          </button>
        </>
      ) : isHls && !hlsFailed ? (
        <>
          <LiveBadge label={liveBadgeLabel} />
          <HlsVideoPlayer
            ref={hlsVideoRef}
            src={webcam.url}
            alt={`${webcam.nombre} – ${pueblo.nombre}`}
            onError={() => setHlsFailed(true)}
          />
          <button
            type="button"
            onClick={requestStreamFullscreen}
            className="absolute bottom-3 right-3 z-10 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/70"
          >
            {fullscreenLabel}
          </button>
        </>
      ) : isEmbeddableIframe ? (
        <>
          <LiveBadge label={liveBadgeLabel} />
          <iframe
            ref={iframeRef}
            src={webcam.url}
            title={`${webcam.nombre} – ${pueblo.nombre}`}
            className="h-full w-full"
            loading="lazy"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
          <button
            type="button"
            onClick={requestStreamFullscreen}
            className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/70"
          >
            {fullscreenLabel}
          </button>
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
              href={resolveWebcamExternalHref(webcam.url, pueblo.slug)}
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
    </>
  );
}

function WebcamCarousel({ webcams, pueblo, liveBadgeLabel, viewLiveLabel, fullscreenLabel }: {
  webcams: Webcam[];
  pueblo: Pueblo;
  liveBadgeLabel: string;
  viewLiveLabel: string;
  fullscreenLabel: string;
}) {
  const [active, setActive] = useState(0);

  return (
    <div className="relative">
      <WebcamCard webcam={webcams[active]} pueblo={pueblo} liveBadgeLabel={liveBadgeLabel} viewLiveLabel={viewLiveLabel} fullscreenLabel={fullscreenLabel} />
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

const BASE_URL = 'https://lospueblosmasbonitosdeespana.org';

export default function WebcamsGrid({ groups }: { groups: PuebloGroup[] }) {
  const t = useTranslations('webcamsPage');
  const [filter, setFilter] = useState<string | null>(null);
  const [highlightSlug, setHighlightSlug] = useState<string | null>(null);
  const comunidades = Array.from(new Set(groups.map(g => g.pueblo.comunidad))).sort();
  const filtered = filter ? groups.filter(g => g.pueblo.comunidad === filter) : groups;

  // Scroll y resaltado cuando se llega desde ?pueblo=slug
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('pueblo');
    if (!slug) return;
    setHighlightSlug(slug);
    const el = document.getElementById(`webcam-card-${slug}`);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
    }
    // Quitar el resaltado tras 3 s
    const timer = setTimeout(() => setHighlightSlug(null), 3500);
    return () => clearTimeout(timer);
  }, []);

  const liveBadgeLabel = t('liveBadge');
  const viewLiveLabel = t('viewLiveWebcam');
  const fullscreenLabel = t('fullscreenWebcam');

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
            id={`webcam-card-${pueblo.slug}`}
            key={pueblo.slug}
            className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-xl dark:bg-neutral-800 ${
              highlightSlug === pueblo.slug
                ? 'border-[#b45309] ring-2 ring-[#b45309]/40 dark:border-amber-500 dark:ring-amber-500/30'
                : 'border-stone-200 dark:border-neutral-700'
            }`}
          >
            {webcams.length === 1 ? (
              <WebcamCard webcam={webcams[0]} pueblo={pueblo} liveBadgeLabel={liveBadgeLabel} viewLiveLabel={viewLiveLabel} fullscreenLabel={fullscreenLabel} />
            ) : (
              <WebcamCarousel webcams={webcams} pueblo={pueblo} liveBadgeLabel={liveBadgeLabel} viewLiveLabel={viewLiveLabel} fullscreenLabel={fullscreenLabel} />
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
                <div className="flex items-center gap-3">
                  <ShareButton
                    url={`/webcams?pueblo=${encodeURIComponent(pueblo.slug)}`}
                    title={`📷 ${pueblo.nombre} – webcam en directo`}
                    variant="button"
                  />
                  <Link
                    href={`/pueblos/${pueblo.slug}`}
                    className="text-sm font-medium text-[#b45309] hover:underline"
                  >
                    {t('viewVillage')} →
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
