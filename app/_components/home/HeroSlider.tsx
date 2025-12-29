"use client";

import { useEffect, useMemo, useState } from "react";

type Slide = { image: string; alt?: string };

type Props = {
  slides: readonly Slide[];
  intervalMs?: number;
  showControls?: boolean;
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

export function HeroSlider({
  slides,
  intervalMs = 6000,
  showControls = true,
}: Props) {
  const safeSlides = useMemo(
    () => (Array.isArray(slides) ? slides.filter((s) => !!s?.image) : []),
    [slides]
  );

  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  const goTo = (i: number) => {
    if (safeSlides.length === 0) return;
    const next = ((i % safeSlides.length) + safeSlides.length) % safeSlides.length;
    setIndex(next);
  };

  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  // Preload de imágenes para evitar parpadeo
  useEffect(() => {
    safeSlides.forEach((slide) => {
      if (slide.image) {
        const img = new Image();
        img.src = slide.image;
      }
    });
  }, [safeSlides]);

  useEffect(() => {
    if (safeSlides.length <= 1) return;
    if (reducedMotion) return;

    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % safeSlides.length);
    }, intervalMs);

    return () => window.clearInterval(t);
  }, [safeSlides.length, intervalMs, reducedMotion]);

  if (safeSlides.length === 0) {
    return <div className="absolute inset-0 bg-gray-200" />;
  }

  return (
    <div className="absolute inset-0 z-0 group">
      {safeSlides.map((s, i) => (
        <div
          key={`${s.image}-${i}`}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.image}
            alt={s.alt ?? ""}
            className="h-full w-full object-cover"
            style={{ objectFit: "cover" }}
            loading={i === 0 ? "eager" : "lazy"}
            draggable={false}
          />
        </div>
      ))}

      {showControls && safeSlides.length > 1 ? (
        <>
          {/* Flechas */}
          <button
            type="button"
            onClick={prev}
            aria-label="Anterior"
            className="hidden md:flex absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 px-3 py-2 text-white backdrop-blur hover:bg-black/55 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Siguiente"
            className="hidden md:flex absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 px-3 py-2 text-white backdrop-blur hover:bg-black/55 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
          >
            ›
          </button>

          {/* Dots */}
          <div className="hidden md:flex absolute bottom-4 left-1/2 z-20 -translate-x-1/2 gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
            {safeSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ir al slide ${i + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  i === index ? "bg-white" : "bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
