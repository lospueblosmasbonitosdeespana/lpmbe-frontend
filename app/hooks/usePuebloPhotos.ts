"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { resolvePuebloMainPhotoUrl } from "@/lib/api";

type PuebloItem = { slug: string; [k: string]: any };

const CACHE_KEY_PREFIX = "pueblo_photo_";
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 horas
const RETRY_TTL = 5 * 60 * 1000; // 5 minutos para reintentar fallos
const MAX_CONCURRENT = 2; // Reducido a 2
const MAX_HYDRATE_LIMIT = 60; // Límite duro de hidratación

interface CacheEntry {
  url: string | null;
  ts: number;
  failed?: boolean;
}

// Cola de peticiones pendientes
const fetchQueue: Array<{ slug: string; resolve: (url: string | null) => void }> = [];
let activeFetches = 0;
const hydratedSlugs = new Set<string>(); // Registro global de slugs ya procesados
let hydrationCount = 0; // Contador de hidrataciones

// Logs de performance
const perfLogs = {
  queueSize: 0,
  totalFetches: 0,
  totalTime: 0,
  imageLoadTimes: [] as number[],
};

function getCachedPhoto(slug: string): string | null | undefined {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY_PREFIX + slug);
    if (!cached) return undefined;
    
    const entry: CacheEntry = JSON.parse(cached);
    const now = Date.now();
    
    // Si falló recientemente, no reintentar aún
    if (entry.failed && (now - entry.ts) < RETRY_TTL) {
      return null;
    }
    
    // Si expiró el cache, limpiar
    if ((now - entry.ts) > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY_PREFIX + slug);
      return undefined;
    }
    
    return entry.url;
  } catch {
    return undefined;
  }
}

function setCachedPhoto(slug: string, url: string | null, failed = false) {
  try {
    const entry: CacheEntry = { url, ts: Date.now(), failed };
    sessionStorage.setItem(CACHE_KEY_PREFIX + slug, JSON.stringify(entry));
  } catch {
    // Si sessionStorage está lleno, ignorar
  }
}

async function fetchPhotoWithQueue(slug: string): Promise<string | null> {
  // Si ya hay demasiadas peticiones activas, encolar
  if (activeFetches >= MAX_CONCURRENT) {
    perfLogs.queueSize = fetchQueue.length + 1;
    return new Promise((resolve) => {
      fetchQueue.push({ slug, resolve });
    });
  }
  
  activeFetches++;
  const startTime = Date.now();
  
  try {
    const res = await fetch(`/api/pueblos/${slug}`, { cache: "no-store" });
    if (!res.ok) {
      setCachedPhoto(slug, null, true);
      return null;
    }
    
    const data = await res.json();
    const url = resolvePuebloMainPhotoUrl(data);
    setCachedPhoto(slug, url, false);
    
    // Log de tiempo
    const elapsed = Date.now() - startTime;
    perfLogs.totalFetches++;
    perfLogs.totalTime += elapsed;
    
    if (perfLogs.totalFetches % 10 === 0) {
      console.log(`[HYDRATION] ${perfLogs.totalFetches} fetches, avg: ${Math.round(perfLogs.totalTime / perfLogs.totalFetches)}ms, queue: ${perfLogs.queueSize}`);
    }
    
    return url;
  } catch (e) {
    setCachedPhoto(slug, null, true);
    return null;
  } finally {
    activeFetches--;
    
    // Procesar siguiente en cola
    const next = fetchQueue.shift();
    if (next) {
      perfLogs.queueSize = fetchQueue.length;
      fetchPhotoWithQueue(next.slug).then(next.resolve);
    }
  }
}

export function usePuebloPhotos(pueblos: PuebloItem[], options?: { eager?: boolean }) {
  const [photos, setPhotos] = useState<Record<string, string | null>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const fetchedRef = useRef<Set<string>>(new Set());
  const observedElements = useRef<Set<string>>(new Set());
  
  const fetchPhoto = useCallback(async (slug: string) => {
    // Verificar límite global de hidratación
    if (hydrationCount >= MAX_HYDRATE_LIMIT && !options?.eager) {
      return;
    }
    
    // No re-procesar slugs ya vistos globalmente
    if (hydratedSlugs.has(slug)) {
      return;
    }
    
    if (fetchedRef.current.has(slug)) return;
    fetchedRef.current.add(slug);
    hydratedSlugs.add(slug);
    hydrationCount++;
    
    // Primero buscar en cache
    const cached = getCachedPhoto(slug);
    if (cached !== undefined) {
      setPhotos(prev => ({ ...prev, [slug]: cached }));
      return;
    }
    
    // Pedir al servidor
    const url = await fetchPhotoWithQueue(slug);
    setPhotos(prev => ({ ...prev, [slug]: url }));
  }, [options?.eager]);
  
  useEffect(() => {
    // Cargar fotos desde cache primero
    const initialPhotos: Record<string, string | null> = {};
    pueblos.forEach(p => {
      const cached = getCachedPhoto(p.slug);
      if (cached !== undefined) {
        initialPhotos[p.slug] = cached;
        fetchedRef.current.add(p.slug);
        hydratedSlugs.add(p.slug);
      }
    });
    if (Object.keys(initialPhotos).length > 0) {
      setPhotos(initialPhotos);
    }
    
    // Si es eager (destacados), fetch todos inmediatamente
    if (options?.eager) {
      pueblos.forEach(p => {
        if (!fetchedRef.current.has(p.slug)) {
          fetchPhoto(p.slug);
        }
      });
      return;
    }
    
    // Configurar IntersectionObserver para lazy load
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const slug = entry.target.getAttribute("data-pueblo-slug");
            if (slug && !observedElements.current.has(slug)) {
              observedElements.current.add(slug);
              if (!fetchedRef.current.has(slug) && !hydratedSlugs.has(slug)) {
                fetchPhoto(slug);
              }
            }
          }
        });
      },
      { rootMargin: "200px" }
    );
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [pueblos, options?.eager, fetchPhoto]);
  
  const observe = useCallback((element: HTMLElement | null) => {
    if (!element || !observerRef.current || options?.eager) return;
    
    const slug = element.getAttribute("data-pueblo-slug");
    if (!slug || observedElements.current.has(slug)) return;
    
    observerRef.current.observe(element);
  }, [options?.eager]);
  
  return { photos, observe };
}
