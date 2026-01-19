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
  // FILTRAR SLIDES INVÁLIDOS (CRÍTICO)
  const safeSlides = useMemo(() => {
    if (!Array.isArray(slides)) return [];
    return slides
      .filter((s) => s && typeof s.image === 'string' && s.image.length > 0)
      .slice(0, 5); // Limitar a 5 máximo
  }, [slides]);

  const slidesLen = safeSlides.length;

  // intervalMs puede venir como string desde config → normalizar
  const interval = Math.max(2000, Number(intervalMs) || 6000);

  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  // Asegurar que el índice actual siempre es válido cuando cambia el array
  useEffect(() => {
    if (slidesLen === 0) return;
    setIndex((i) => Math.min(i, slidesLen - 1));
  }, [slidesLen]);

  const goTo = (i: number) => {
    if (slidesLen === 0) return;
    const next = ((i % slidesLen) + slidesLen) % slidesLen;
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

  // Auto-rotate (SIEMPRE avanza cuando hay 2+ slides)
  useEffect(() => {
    if (slidesLen <= 1) return;

    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slidesLen);
    }, interval);

    return () => window.clearInterval(id);
  }, [slidesLen, interval]);

  // FALLBACK SI NO HAY SLIDES VÁLIDOS
  if (slidesLen === 0) {
    return null;
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
