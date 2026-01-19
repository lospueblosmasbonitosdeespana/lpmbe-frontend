"use client";

import Link from "next/link";
import { useMemo, useEffect, useState } from "react";
import { homeConfig } from "./home.config";
import type { HomeTheme } from "@/lib/homeApi";

type ThemesSectionProps = {
  themes?: HomeTheme[];
};

// Fisher-Yates shuffle con seed opcional
function seededShuffle<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  let currentSeed = seed;
  
  // Simple LCG (Linear Congruential Generator)
  const random = () => {
    currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
    return currentSeed / 0x7fffffff;
  };
  
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function ThemesSection({ themes }: ThemesSectionProps) {
  // Usar themes del backend o fallback local
  const themesToShow = themes ?? homeConfig.themes;
  
  // Estado para el seed (se genera una vez por sesión)
  const [seed, setSeed] = useState<number | null>(null);
  
  // Inicializar seed desde sessionStorage o generar nuevo
  useEffect(() => {
    const storedSeed = sessionStorage.getItem('themes-shuffle-seed');
    if (storedSeed) {
      setSeed(parseInt(storedSeed, 10));
    } else {
      const newSeed = Date.now();
      sessionStorage.setItem('themes-shuffle-seed', newSeed.toString());
      setSeed(newSeed);
    }
  }, []);
  
  // Shuffle con seed estable por sesión
  const shuffled = useMemo(() => {
    if (seed === null) return themesToShow; // Mostrar sin shuffle mientras carga
    return seededShuffle(themesToShow, seed);
  }, [themesToShow, seed]);
  
  // 2 arriba + 3 abajo
  const topRow = shuffled.slice(0, 2);
  const bottomRow = shuffled.slice(2, 5);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold">Ideas para tu viaje</h2>
        <p className="mt-2 text-sm text-gray-600">
          Descubre los pueblos según la experiencia que buscas.
        </p>
      </div>

      <div className="space-y-6">
        {/* Fila 1: 2 cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {topRow.map((theme) => {
            const safeSrc = theme.image && theme.image.trim() ? theme.image.trim() : null;
            
            return (
              <Link
                key={theme.key}
                href={theme.href}
                className="group relative block h-[240px] overflow-hidden bg-gray-100"
              >
                {/* Imagen */}
                {safeSrc ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={safeSrc}
                      alt={theme.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/35" />
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <span className="text-sm text-gray-400">Sin imagen</span>
                  </div>
                )}

                {/* Texto */}
                <div className="relative z-10 flex h-full items-end p-6">
                  <div className="text-white">
                    <h3 className="text-xl font-semibold">{theme.title}</h3>
                    <span className="mt-1 inline-block text-sm opacity-90">
                      Ver pueblos →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Fila 2: 3 cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {bottomRow.map((theme) => {
            const safeSrc = theme.image && theme.image.trim() ? theme.image.trim() : null;
            
            return (
              <Link
                key={theme.key}
                href={theme.href}
                className="group relative block h-[240px] overflow-hidden bg-gray-100"
              >
                {/* Imagen */}
                {safeSrc ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={safeSrc}
                      alt={theme.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/35" />
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <span className="text-sm text-gray-400">Sin imagen</span>
                  </div>
                )}

                {/* Texto */}
                <div className="relative z-10 flex h-full items-end p-6">
                  <div className="text-white">
                    <h3 className="text-xl font-semibold">{theme.title}</h3>
                    <span className="mt-1 inline-block text-sm opacity-90">
                      Ver pueblos →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}



