'use client';

import { useEffect, useState } from 'react';

export type ReglaGamificacion = {
  id: number;
  key: string;
  nombre: string;
  descripcion: string | null;
  puntos: number;
  activo: boolean;
  orden: number;
};

const CACHE_KEY = '__lpmbe_gamificacion_cache__';
const CACHE_TTL_MS = 60_000;

type CacheEntry = { ts: number; data: Record<string, ReglaGamificacion> };

function readCache(): Record<string, ReglaGamificacion> | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  const entry: CacheEntry | undefined = w[CACHE_KEY];
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) return null;
  return entry.data;
}

function writeCache(data: Record<string, ReglaGamificacion>) {
  if (typeof window === 'undefined') return;
  const w = window as any;
  w[CACHE_KEY] = { ts: Date.now(), data };
}

/**
 * Hook compartido para leer la configuración pública de gamificación del Club.
 * Devuelve un mapa key → regla, además de helpers `getPuntos(key)`.
 *
 * Está diseñado para ser extensible: hoy solo existe `RECURSO_VISITADO`,
 * pero el admin puede añadir más reglas (ej. NEGOCIO_VISITADO, COMBO_COMPLETADO,
 * SORTEO_PARTICIPADO…) sin necesidad de cambios de cliente.
 */
export function useGamificacionConfig() {
  const cached = typeof window !== 'undefined' ? readCache() : null;

  const [data, setData] = useState<Record<string, ReglaGamificacion>>(cached ?? {});
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cached) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/club/gamificacion', { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) setError('Error cargando gamificación');
          return;
        }
        const payload = await res.json().catch(() => null);
        const reglas: ReglaGamificacion[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
        const map: Record<string, ReglaGamificacion> = {};
        for (const r of reglas) {
          if (r?.key) map[r.key] = r;
        }
        if (!cancelled) {
          setData(map);
          writeCache(map);
        }
      } catch {
        if (!cancelled) setError('Error de red');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getPuntos(key: string): number {
    const r = data[key];
    return r && r.activo ? r.puntos : 0;
  }

  return { loading, error, reglas: data, getPuntos };
}
