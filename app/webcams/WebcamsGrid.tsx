'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

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

function isIframeUrl(url: string): boolean {
  return !isImageUrl(url);
}

function RefreshingImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [cacheBust, setCacheBust] = useState(Date.now());
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setCacheBust(Date.now()), 45_000);
    return () => clearInterval(interval);
  }, []);

  const separator = src.includes('?') ? '&' : '?';
  const finalSrc = `${src}${separator}_t=${cacheBust}`;

  return (
    <img
      ref={imgRef}
      src={finalSrc}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}

function WebcamEmbed({ webcam }: { webcam: Webcam }) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-neutral-800">
      {!visible ? (
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 dark:bg-neutral-700" />
        </div>
      ) : isImageUrl(webcam.url) ? (
        <RefreshingImage
          src={webcam.url}
          alt={webcam.nombre}
          className="h-full w-full object-cover"
        />
      ) : (
        <iframe
          src={webcam.url}
          title={webcam.nombre}
          className="h-full w-full border-0"
          loading="lazy"
          allow="autoplay; encrypted-media"
          sandbox="allow-scripts allow-same-origin"
        />
      )}
      {visible && (
        <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          LIVE
        </div>
      )}
    </div>
  );
}

export default function WebcamsGrid({ groups }: { groups: PuebloGroup[] }) {
  const [filter, setFilter] = useState<string | null>(null);

  const comunidades = Array.from(new Set(groups.map(g => g.pueblo.comunidad))).sort();

  const filtered = filter
    ? groups.filter(g => g.pueblo.comunidad === filter)
    : groups;

  return (
    <>
      {/* Filter chips */}
      {comunidades.length > 1 && (
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setFilter(null)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === null
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700'
            }`}
          >
            Todos ({groups.length})
          </button>
          {comunidades.map(c => {
            const count = groups.filter(g => g.pueblo.comunidad === c).length;
            return (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  filter === c
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700'
                }`}
              >
                {c} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Cards */}
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(({ pueblo, webcams }) => (
          <article
            key={pueblo.slug}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
          >
            {/* Webcam(s) */}
            {webcams.length === 1 ? (
              <WebcamEmbed webcam={webcams[0]} />
            ) : (
              <WebcamCarousel webcams={webcams} />
            )}

            {/* Info */}
            <div className="p-5">
              <Link href={`/pueblos/${pueblo.slug}`} className="group/link">
                <h2 className="text-xl font-bold text-slate-800 transition group-hover/link:text-blue-600 dark:text-neutral-100">
                  {pueblo.nombre}
                </h2>
              </Link>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {pueblo.provincia}, {pueblo.comunidad}
              </p>
              {webcams.length === 1 && (
                <p className="mt-2 text-sm text-slate-500 dark:text-neutral-400">{webcams[0].nombre}</p>
              )}
              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  {webcams.length} {webcams.length === 1 ? 'webcam' : 'webcams'}
                </span>
                <Link
                  href={`/pueblos/${pueblo.slug}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Ver pueblo →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function WebcamCarousel({ webcams }: { webcams: Webcam[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="relative">
      <WebcamEmbed webcam={webcams[active]} />
      {/* Tab pills */}
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
        {webcams.map((w, i) => (
          <button
            key={w.id}
            onClick={() => setActive(i)}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition ${
              i === active
                ? 'bg-white text-slate-800'
                : 'text-white/80 hover:text-white'
            }`}
            title={w.nombre}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <p className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-sm">
        {webcams[active].nombre}
      </p>
    </div>
  );
}
