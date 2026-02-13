'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';

type Props = {
  rutaId: number;
  /** Pre-supplied waypoints to avoid an extra fetch */
  waypoints?: Array<{ lat: number; lng: number }>;
  /** Width/height in px */
  width?: number;
  height?: number;
};

const COLOR_PRIMARY = '#854d0e';

/**
 * Tiny non-interactive Leaflet map that shows where a route is in Spain.
 * Lazy-loads via IntersectionObserver – only fetches data & tiles when visible.
 */
export default function RutaMiniMap({
  rutaId,
  waypoints: preloadedWaypoints,
  width = 110,
  height = 80,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [waypoints, setWaypoints] = useState<{ lat: number; lng: number }[] | null>(
    preloadedWaypoints ?? null
  );
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<typeof import('leaflet') | null>(null);
  const mapInstanceRef = useRef<any>(null);

  // ── Intersection Observer (lazy load) ────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Fetch waypoints if not preloaded ─────────────────────────
  useEffect(() => {
    if (!isVisible || waypoints) return;
    const API_BASE = typeof window !== 'undefined'
      ? `${window.location.origin}/api`
      : '';

    // Fetch route details to get pueblo coordinates
    fetch(`${API_BASE}/gestion/asociacion/rutas/${rutaId}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((data) => {
        if (!data) {
          // Try public endpoint
          const backendBase = process.env.NEXT_PUBLIC_API_URL ?? 'https://lpmbe-backend-production.up.railway.app';
          return fetch(`${backendBase}/rutas/${rutaId}`).then((r) => r.ok ? r.json() : null).catch(() => null);
        }
        return data;
      })
      .then((data) => {
        if (!data) return;
        const pueblos = data.pueblos ?? data.rutaPueblos ?? [];
        const coords = pueblos
          .map((p: any) => ({
            lat: p.lat ?? p.pueblo?.lat ?? null,
            lng: p.lng ?? p.pueblo?.lng ?? null,
          }))
          .filter((c: any) => typeof c.lat === 'number' && typeof c.lng === 'number');
        if (coords.length > 0) setWaypoints(coords);
      });
  }, [isVisible, waypoints, rutaId]);

  // ── Load Leaflet ─────────────────────────────────────────────
  useEffect(() => {
    if (!isVisible || !waypoints || waypoints.length === 0) return;
    import('leaflet').then((leaflet) => {
      setL(leaflet);
      setMounted(true);
    });
  }, [isVisible, waypoints]);

  // ── Render map ───────────────────────────────────────────────
  useEffect(() => {
    if (!mounted || !L || !waypoints || waypoints.length === 0 || !containerRef.current) return;
    if (mapInstanceRef.current) return; // Already rendered

    const lats = waypoints.map((w) => w.lat);
    const lngs = waypoints.map((w) => w.lng);

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);

    // Fit bounds with padding
    const bounds = L.latLngBounds(
      waypoints.map((w) => [w.lat, w.lng] as [number, number])
    );
    map.fitBounds(bounds, { padding: [15, 15], maxZoom: 8 });

    // Draw a simple polyline
    if (waypoints.length >= 2) {
      L.polyline(
        waypoints.map((w) => [w.lat, w.lng] as [number, number]),
        { color: COLOR_PRIMARY, weight: 2.5, opacity: 0.8 }
      ).addTo(map);
    }

    // Small circle markers
    waypoints.forEach((w) => {
      L.circleMarker([w.lat, w.lng], {
        radius: 3,
        fillColor: COLOR_PRIMARY,
        fillOpacity: 1,
        color: '#fff',
        weight: 1.5,
      }).addTo(map);
    });

    mapInstanceRef.current = map;

    return () => {
      // Cleanup on unmount
    };
  }, [mounted, L, waypoints]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#f0ebe3',
        flexShrink: 0,
      }}
    />
  );
}
