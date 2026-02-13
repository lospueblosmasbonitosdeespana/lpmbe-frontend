'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  rutaId: number;
};

type Stats = {
  km: number;
  tiempo: string;
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

/**
 * Células de Km y Tiempo para la tabla de gestión de rutas.
 * Calcula valores vía OSRM cuando la fila es visible.
 */
export default function RutaAdminStatsCells({ rutaId }: Props) {
  const cellRef = useRef<HTMLTableCellElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const el = cellRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let cancelled = false;

    async function loadStats() {
      try {
        const res = await fetch(`/api/gestion/asociacion/rutas/${rutaId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        const pueblos = data.pueblos ?? [];
        const waypoints = pueblos
          .sort((a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0))
          .map((rp: any) => ({
            lat: rp.lat ?? rp.pueblo?.lat ?? null,
            lng: rp.lng ?? rp.pueblo?.lng ?? null,
          }))
          .filter(
            (c: any) => typeof c.lat === 'number' && typeof c.lng === 'number'
          );

        if (waypoints.length < 2) {
          if (!cancelled) {
            setStats(null);
            setLoading(false);
          }
          return;
        }

        const coordsStr = waypoints
          .map((w: any) => `${w.lng},${w.lat}`)
          .join(';');
        const osrmRes = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=false`
        );
        const osrmData = await osrmRes.json();
        if (cancelled) return;

        if (osrmData.code === 'Ok' && osrmData.routes?.[0]) {
          const route = osrmData.routes[0];
          const km = Math.round((route.distance / 1000) * 10) / 10;
          const minutes = Math.round(route.duration / 60);
          setStats({ km, tiempo: formatDuration(minutes) });
        } else {
          setStats(null);
        }
      } catch {
        setStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, [isVisible, rutaId]);

  return (
    <>
      <td ref={cellRef} className="px-4 py-3 text-center text-gray-600">
        {loading ? (
          <span className="text-xs text-gray-400">…</span>
        ) : stats ? (
          stats.km
        ) : (
          '—'
        )}
      </td>
      <td className="px-4 py-3 text-center text-gray-600">
        {loading ? (
          <span className="text-xs text-gray-400">…</span>
        ) : stats ? (
          stats.tiempo
        ) : (
          '—'
        )}
      </td>
    </>
  );
}
