'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  rutaId: number;
};

type Stats = {
  km: number;
  tiempo: string;
  paradas: number;
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

/**
 * Client component that fetches route waypoints and calculates OSRM
 * distance/time for each route card. Lazy-loads via IntersectionObserver.
 */
export default function RutaCardStats({ rutaId }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Lazy load: only fetch when visible
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Fetch route data + OSRM when visible
  useEffect(() => {
    if (!isVisible) return;
    let cancelled = false;

    async function loadStats() {
      try {
        // Fetch route detail to get pueblos/waypoints
        const backendBase =
          process.env.NEXT_PUBLIC_API_URL ??
          'https://lpmbe-backend-production.up.railway.app';

        const res = await fetch(`${backendBase}/rutas/${rutaId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        const pueblos = data.pueblos ?? data.rutaPueblos ?? [];
        const waypoints = pueblos
          .map((p: any) => ({
            lat: p.lat ?? p.pueblo?.lat ?? null,
            lng: p.lng ?? p.pueblo?.lng ?? null,
          }))
          .filter(
            (c: any) => typeof c.lat === 'number' && typeof c.lng === 'number'
          );

        const paradasCount = pueblos.length;

        if (waypoints.length < 2) {
          if (!cancelled) {
            setStats(paradasCount > 0 ? { km: 0, tiempo: '', paradas: paradasCount } : null);
            setLoading(false);
          }
          return;
        }

        // Call OSRM for distance/time
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
          setStats({
            km,
            tiempo: formatDuration(minutes),
            paradas: paradasCount,
          });
        } else {
          setStats({ km: 0, tiempo: '', paradas: paradasCount });
        }
      } catch {
        // Silently fail
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
    <div ref={ref} className="flex flex-1 flex-col justify-center gap-1.5">
      {loading ? (
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 animate-pulse rounded-full bg-primary/30" />
          <span className="text-xs text-muted-foreground">Calculando...</span>
        </div>
      ) : stats ? (
        <>
          {stats.km > 0 && (
            <div className="flex items-center gap-1.5">
              <svg
                className="h-3.5 w-3.5 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-sm font-bold text-foreground">
                {stats.km} km
              </span>
            </div>
          )}
          {stats.tiempo && (
            <div className="flex items-center gap-1.5">
              <svg
                className="h-3.5 w-3.5 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-sm font-bold text-foreground">
                {stats.tiempo}
              </span>
            </div>
          )}
          {stats.paradas > 0 && (
            <div className="flex items-center gap-1.5">
              <svg
                className="h-3.5 w-3.5 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </svg>
              <span className="text-sm font-bold text-foreground">
                {stats.paradas} paradas
              </span>
            </div>
          )}
        </>
      ) : (
        <span className="text-xs text-muted-foreground">Ubicación en España</span>
      )}
    </div>
  );
}
