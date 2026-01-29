"use client";

import { useEffect, useState, useRef, useCallback } from "react";

type PuebloItem = { id: number; slug: string; [k: string]: any };

type PhotoData = {
  url: string;
  rotation?: number;
};

const CACHE_KEY = "pueblos_photos_bulk";
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 horas

interface CacheEntry {
  photos: Record<string, PhotoData>;
  ts: number;
}

function getCachedPhotos(): Record<string, PhotoData> | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const entry: CacheEntry = JSON.parse(cached);
    const now = Date.now();
    
    // Si expiró el cache, limpiar
    if ((now - entry.ts) > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return entry.photos;
  } catch {
    return null;
  }
}

function setCachedPhotos(photos: Record<string, PhotoData>) {
  try {
    const entry: CacheEntry = { photos, ts: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Si sessionStorage está lleno, ignorar
  }
}

async function fetchPhotosBulk(puebloIds: number[]): Promise<Record<string, PhotoData>> {
  if (puebloIds.length === 0) return {};
  
  const ids = puebloIds.join(",");
  
  console.log(`[usePuebloPhotos] Fetching ${puebloIds.length} photos, first 5 IDs:`, puebloIds.slice(0, 5));
  
  try {
    // Llamar a Next.js API route (misma origin, sin CORS)
    const res = await fetch(`/api/public/pueblos/photos?ids=${ids}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[usePuebloPhotos] API error ${res.status}:`, text.substring(0, 500));
      return {};
    }

    const data = await res.json();
    
    // Normalizar: asegurar que todas las claves son strings
    const normalized: Record<string, PhotoData> = {};
    for (const [key, value] of Object.entries(data)) {
      normalized[String(key)] = value as PhotoData;
    }
    
    const withUrl = Object.values(normalized).filter(p => p?.url).length;
    console.log(`[usePuebloPhotos] Received ${withUrl}/${Object.keys(normalized).length} photos with URL`);
    
    return normalized;
  } catch (err: any) {
    console.error("[usePuebloPhotos] Fetch error:", err.message);
    return {};
  }
}

export function usePuebloPhotos(pueblos: PuebloItem[], options?: { eager?: boolean }) {
  const [photos, setPhotos] = useState<Record<string, PhotoData>>({});
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);
  const puebloIdsRef = useRef<string>("");
  
  useEffect(() => {
    const puebloIds = pueblos.map(p => p.id);
    const idsKey = puebloIds.join(",");
    
    console.log(`[usePuebloPhotos] useEffect triggered, ${pueblos.length} pueblos`);
    console.log(`[usePuebloPhotos] First 3 pueblos:`, pueblos.slice(0, 3).map(p => ({ id: p.id, slug: p.slug })));
    
    // Si los IDs no cambiaron, no refetch
    if (idsKey === puebloIdsRef.current && fetchedRef.current) {
      console.log(`[usePuebloPhotos] Skipping fetch (same IDs)`);
      return;
    }
    
    puebloIdsRef.current = idsKey;
    
    async function load() {
      setLoading(true);
      
      // 1) Intentar cargar desde cache
      const cached = getCachedPhotos();
      if (cached) {
        const relevantPhotos: Record<string, PhotoData> = {};
        let allFound = true;
        
        for (const p of pueblos) {
          const key = String(p.id);
          if (key in cached) {
            relevantPhotos[key] = cached[key];
          } else {
            allFound = false;
            break;
          }
        }
        
        // Si todas las fotos están en cache, usarlas
        if (allFound && Object.keys(relevantPhotos).length === pueblos.length) {
          setPhotos(relevantPhotos);
          setLoading(false);
          fetchedRef.current = true;
          console.log(`[usePuebloPhotos] Loaded ${pueblos.length} photos from cache`);
          return;
        }
      }
      
      // 2) Fetch bulk directo al backend
      console.log(`[usePuebloPhotos] Fetching ${puebloIds.length} photos (bulk direct)...`);
      const startTime = Date.now();
      
      const photosByIdNum = await fetchPhotosBulk(puebloIds);
      
      setPhotos(photosByIdNum);
      setCachedPhotos(photosByIdNum);
      
      const elapsed = Date.now() - startTime;
      const withPhoto = Object.values(photosByIdNum).filter(p => p?.url).length;
      console.log(
        `[usePuebloPhotos] Loaded ${withPhoto}/${pueblos.length} photos in ${elapsed}ms`
      );
      
      setLoading(false);
      fetchedRef.current = true;
    }
    
    load();
  }, [pueblos]);
  
  // observe: ya no es necesario con bulk, pero lo mantenemos para compatibilidad
  const observe = useCallback(() => {
    // noop
  }, []);
  
  return { photos, loading, observe };
}
