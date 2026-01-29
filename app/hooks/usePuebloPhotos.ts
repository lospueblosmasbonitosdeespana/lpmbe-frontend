"use client";

import { useEffect, useState, useRef, useCallback } from "react";

type PuebloItem = { id: number; slug: string; [k: string]: any };

type PhotoData = {
  url: string;
  rotation?: number;
};

const CACHE_KEY = "pueblos_photos_v3"; // Cambio de versión para forzar limpieza
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 horas
const MIN_VALID_PERCENTAGE = 0.5; // Al menos 50% deben tener URL válida

interface CacheEntry {
  photos: Record<string, PhotoData>;
  ts: number;
  version: string;
}

function getCachedPhotos(): Record<string, PhotoData> | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const entry: CacheEntry = JSON.parse(cached);
    const now = Date.now();
    
    // Verificar versión (invalidar si no coincide)
    if (!entry.version || entry.version !== "v3") {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    // Si expiró el cache, limpiar
    if ((now - entry.ts) > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    // VALIDACIÓN: verificar que el cache tenga sentido
    const totalPhotos = Object.keys(entry.photos).length;
    if (totalPhotos === 0) {
      console.warn("[Cache] Cache vacío, invalidando");
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    const withUrl = Object.values(entry.photos).filter(p => p?.url).length;
    const percentage = withUrl / totalPhotos;
    
    // Si menos del 50% tienen URL, el cache está corrupto
    if (percentage < MIN_VALID_PERCENTAGE) {
      console.warn(`[Cache] Cache corrupto (solo ${Math.round(percentage * 100)}% válidos), invalidando`);
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return entry.photos;
  } catch (err) {
    console.error("[Cache] Error leyendo cache:", err);
    sessionStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function setCachedPhotos(photos: Record<string, PhotoData>) {
  try {
    const entry: CacheEntry = { 
      photos, 
      ts: Date.now(),
      version: "v3"
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    
    // Limpiar caches viejos
    try {
      sessionStorage.removeItem("pueblos_photos_bulk");
      sessionStorage.removeItem("pueblos_photos_bulk_v2");
    } catch {}
  } catch (err) {
    console.warn("[Cache] No se pudo guardar cache:", err);
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
    // Generar IDs ordenados dentro del useEffect para consistencia
    const puebloIds = pueblos.map(p => p.id).sort((a, b) => a - b);
    const idsKey = puebloIds.join(",");
    
    console.log(`[usePuebloPhotos] useEffect triggered, ${pueblos.length} pueblos`);
    console.log(`[usePuebloPhotos] IDs key:`, idsKey.substring(0, 100));
    
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
      if (cached && Object.keys(cached).length > 0) {
        const relevantPhotos: Record<string, PhotoData> = {};
        let allFound = true;
        let validCount = 0;
        
        for (const p of pueblos) {
          const key = String(p.id);
          if (key in cached) {
            // Verificar que el valor no sea null
            if (cached[key] && cached[key].url) {
              relevantPhotos[key] = cached[key];
              validCount++;
            } else {
              // Si es null, incluirlo pero no contar como válido
              relevantPhotos[key] = cached[key];
            }
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
          console.log(`[usePuebloPhotos] Loaded ${pueblos.length} photos from cache (${validCount} with URLs)`);
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
  }, [pueblos]); // Volver a pueblos como dependencia, pero con check de IDs dentro
  
  // observe: ya no es necesario con bulk, pero lo mantenemos para compatibilidad
  const observe = useCallback(() => {
    // noop
  }, []);
  
  return { photos, loading, observe };
}
