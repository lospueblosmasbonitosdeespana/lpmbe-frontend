"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, useCallback } from "react";
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

const LOGO_MARKER_URL = "/brand/logo-mapa-marker.png";
const LABEL_ZOOM = 9;

function makePuebloIcon() {
  return L.divIcon({
    html: `<div style="width:42px;height:42px;border-radius:50%;background:#fff;border:2px solid rgba(124,45,52,0.35);box-shadow:0 2px 8px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;overflow:hidden"><img src="${LOGO_MARKER_URL}" alt="" style="width:52px;height:52px;object-fit:contain;pointer-events:none;display:block" /></div>`,
    className: "pueblo-marker",
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -23],
  });
}

interface PueblosMapProps {
  className?: string;
  compact?: boolean;
}

function makeUserIcon() {
  return L.divIcon({
    html: `<div style="width:20px;height:20px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 2px 8px rgba(37,99,235,.5)"></div>`,
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

const LABEL_STYLES = `
  .pueblo-label {
    background: rgba(255,255,255,0.92) !important;
    border: none !important;
    box-shadow: 0 1px 4px rgba(0,0,0,.18) !important;
    border-radius: 6px !important;
    padding: 2px 7px !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    color: #1a1a1a !important;
    white-space: nowrap !important;
    pointer-events: none !important;
  }
  .pueblo-label::before { display:none !important; }
`;

export default function PueblosMap({ className, compact }: PueblosMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [pueblos, setPueblos] = useState<PuebloMapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const map = mapInstanceRef.current;
        if (!map) { setGeoLoading(false); return; }

        // Eliminar marcador previo del usuario
        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
        }

        // Crear marcador de usuario con animación de pulso
        const userIcon = makeUserIcon();
        const marker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 })
          .addTo(map)
          .bindPopup("<strong>Tu ubicación</strong>", { closeButton: false });
        userMarkerRef.current = marker;

        // Centrar el mapa en el usuario con zoom apropiado
        map.flyTo([lat, lng], 9, { animate: true, duration: 1.2 });
        marker.openPopup();
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === 1) {
          setGeoError("Permiso denegado. Activa la ubicación en tu navegador.");
        } else {
          setGeoError("No se pudo obtener tu posición.");
        }
        setTimeout(() => setGeoError(null), 4000);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    if (document.getElementById("pueblo-label-styles")) return;
    const style = document.createElement("style");
    style.id = "pueblo-label-styles";
    style.textContent = LABEL_STYLES;
    document.head.appendChild(style);
  }, []);

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
    const markers: L.Marker[] = [];

    pueblos.forEach((p) => {
      const googleMapsWalking = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=walking`;
      const popup = `
        <div style="min-width:180px;font-family:system-ui,sans-serif;padding:4px 0">
          <strong style="font-size:14px;color:#1a1a1a">${p.nombre}</strong><br/>
          <span style="color:#666;font-size:12px">${p.provincia} · ${p.comunidad}</span><br/>
          <a href="/pueblos/${p.slug}" style="color:${TERRACOTTA};font-weight:600;font-size:12px;text-decoration:none;margin-top:4px;display:inline-block">
            Ver pueblo →
          </a>
          <br/>
          <a href="${googleMapsWalking}" target="_blank" rel="noopener noreferrer" style="color:${TERRACOTTA};font-weight:600;font-size:12px;text-decoration:none;margin-top:6px;display:inline-block">
            Ir a (Google Maps) →
          </a>
        </div>`;

      const marker = L.marker([p.lat, p.lng], { icon })
        .addTo(map)
        .bindPopup(popup)
        .bindTooltip(p.nombre, {
          permanent: true,
          direction: "bottom",
          offset: [0, 4],
          className: "pueblo-label",
          opacity: 1,
        });

      markers.push(marker);
    });

    const updateLabels = () => {
      const zoom = map.getZoom();
      markers.forEach((m) => {
        const tooltip = m.getTooltip();
        if (!tooltip) return;
        const el = tooltip.getElement();
        if (el) {
          el.style.display = zoom >= LABEL_ZOOM ? "" : "none";
        }
      });
    };

    map.on("zoomend", updateLabels);
    // Apply initial state after tiles load
    map.whenReady(updateLabels);

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
      userMarkerRef.current = null;
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
    <div className={`relative w-full ${className ?? ""}`}>
      <div
        ref={mapRef}
        className={`relative z-0 w-full rounded-2xl border border-border shadow-sm ${heightClass}`}
      />
      {/* Botón de geolocalización */}
      {!compact && (
        <div className="absolute bottom-5 right-3 z-[400] flex flex-col items-end gap-2">
          {geoError && (
            <div className="rounded-lg bg-white px-3 py-2 text-xs text-red-600 shadow-md border border-red-200 max-w-[200px] text-right">
              {geoError}
            </div>
          )}
          <button
            type="button"
            onClick={handleGeolocate}
            disabled={geoLoading}
            title="Mi ubicación"
            aria-label="Centrar mapa en mi ubicación"
            className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-md transition hover:bg-muted disabled:opacity-60 dark:bg-neutral-800 dark:border-neutral-600 dark:hover:bg-neutral-700"
          >
            {geoLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-primary" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
            )}
            <span>Mi ubicación</span>
          </button>
        </div>
      )}
    </div>
  );
}
