"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";

const TERRACOTTA = "#7c2d34";
const SPAIN_CENTER: [number, number] = [39.5, -3.0];
const SPAIN_ZOOM = 6;

type PuebloMapa = {
  id: number;
  nombre: string;
  slug: string;
  provincia: string;
  comunidad: string;
  lat: number;
  lng: number;
};

const ROSE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="20" height="20">
  <g fill="#fff">
    <ellipse cx="50" cy="42" rx="12" ry="18" transform="rotate(0 50 50)" opacity=".95"/>
    <ellipse cx="50" cy="42" rx="12" ry="18" transform="rotate(72 50 50)" opacity=".85"/>
    <ellipse cx="50" cy="42" rx="12" ry="18" transform="rotate(144 50 50)" opacity=".80"/>
    <ellipse cx="50" cy="42" rx="12" ry="18" transform="rotate(216 50 50)" opacity=".85"/>
    <ellipse cx="50" cy="42" rx="12" ry="18" transform="rotate(288 50 50)" opacity=".90"/>
    <circle cx="50" cy="50" r="8" opacity="1"/>
  </g>
</svg>`;

function makePuebloIcon() {
  return L.divIcon({
    html: `<div style="width:36px;height:36px;border-radius:50%;background:${TERRACOTTA};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.35);border:2.5px solid #fff;transition:transform .15s">${ROSE_SVG}</div>`,
    className: "pueblo-marker",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

interface PueblosMapProps {
  className?: string;
  compact?: boolean;
}

export default function PueblosMap({ className, compact }: PueblosMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [pueblos, setPueblos] = useState<PuebloMapa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${API_BASE}/pueblos`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setPueblos(
            data.filter(
              (p: PuebloMapa) =>
                p.lat != null && p.lng != null && (p.lat !== 0 || p.lng !== 0),
            ),
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!mapRef.current || pueblos.length === 0) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current, {
      scrollWheelZoom: !compact,
      zoomControl: !compact,
      dragging: true,
      attributionControl: !compact,
    }).setView(SPAIN_CENTER, compact ? 5.5 : SPAIN_ZOOM);

    mapInstanceRef.current = map;

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 18,
        subdomains: "abcd",
      },
    ).addTo(map);

    const icon = makePuebloIcon();

    pueblos.forEach((p) => {
      const popup = `
        <div style="min-width:180px;font-family:system-ui,sans-serif;padding:4px 0">
          <strong style="font-size:14px;color:#1a1a1a">${p.nombre}</strong><br/>
          <span style="color:#666;font-size:12px">${p.provincia} · ${p.comunidad}</span><br/>
          <a href="/pueblos/${p.slug}" style="color:${TERRACOTTA};font-weight:600;font-size:12px;text-decoration:none;margin-top:4px;display:inline-block">
            Ver pueblo →
          </a>
        </div>`;

      L.marker([p.lat, p.lng], { icon }).addTo(map).bindPopup(popup);
    });

    if (pueblos.length > 0) {
      const bounds = L.latLngBounds(
        pueblos.map((p) => [p.lat, p.lng] as [number, number]),
      );
      map.fitBounds(bounds, {
        padding: [30, 30],
        maxZoom: compact ? 7 : 8,
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [pueblos, compact]);

  const heightClass = compact
    ? "h-[280px] md:h-[340px]"
    : "h-[70vh] min-h-[500px]";

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-muted ${heightClass} ${className ?? ""}`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Cargando mapa…</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={`relative z-0 w-full rounded-2xl border border-border shadow-sm ${heightClass} ${className ?? ""}`}
    />
  );
}
