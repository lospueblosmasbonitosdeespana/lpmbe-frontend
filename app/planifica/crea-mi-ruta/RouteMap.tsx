"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { getResourceColor, getResourceSvg } from "@/lib/resource-types";

const LEAFLET_CDN =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images";

function fixLeafletIcons() {
  delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: `${LEAFLET_CDN}/marker-icon-2x.png`,
    iconUrl: `${LEAFLET_CDN}/marker-icon.png`,
    shadowUrl: `${LEAFLET_CDN}/marker-shadow.png`,
  });
}

export interface RouteItem {
  type: "pueblo" | "recurso";
  id: number;
  nombre: string;
  slug: string;
  lat: number;
  lng: number;
  provincia: string;
  comunidad: string;
  fotoUrl: string | null;
  distKm: number;
  descuentoClub: number | null;
  tipo?: string;
}

interface RouteMapProps {
  routeCoords: [number, number][];
  items: RouteItem[];
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  selectedIds?: Set<string>;
  orderedSelection?: string[];
}

function makeNumberedIcon(bg: string, num: number) {
  return L.divIcon({
    html: `<div style="background:${bg};width:32px;height:32px;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.4);color:#fff;font-weight:700;font-size:13px">${num}</div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

function makeUnselectedIcon(color: string, svgPath: string) {
  return L.divIcon({
    html: `<div style="background:#fff;width:28px;height:28px;border-radius:50%;border:2.5px solid ${color};display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.25)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg>
    </div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

const PUEBLO_SVG = '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/>';
const PUEBLO_COLOR = "#1d4ed8";

const endpointIcon = (label: string, color: string) =>
  L.divIcon({
    html: `<div style="background:${color};color:#fff;font-weight:700;font-size:12px;width:32px;height:32px;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.4)">${label}</div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });

export default function RouteMap({
  routeCoords,
  items,
  origin,
  destination,
  selectedIds,
  orderedSelection,
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    fixLeafletIcons();

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current, {
      scrollWheelZoom: true,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    const polyline = L.polyline(routeCoords, {
      color: "#854d0e",
      weight: 4,
      opacity: 0.8,
    }).addTo(map);

    L.marker([origin.lat, origin.lng], {
      icon: endpointIcon("A", "#16a34a"),
    })
      .addTo(map)
      .bindPopup("<strong>Origen</strong>");

    L.marker([destination.lat, destination.lng], {
      icon: endpointIcon("B", "#dc2626"),
    })
      .addTo(map)
      .bindPopup("<strong>Destino</strong>");

    const orderMap = new Map<string, number>();
    if (orderedSelection) {
      orderedSelection.forEach((key, idx) => orderMap.set(key, idx + 1));
    }

    items.forEach((item) => {
      const key = `${item.type}-${item.id}`;
      const isSelected = !selectedIds || selectedIds.has(key);
      const position = orderMap.get(key);

      const itemColor = item.type === "pueblo"
        ? PUEBLO_COLOR
        : getResourceColor(item.tipo ?? "OTRO");
      const itemSvg = item.type === "pueblo"
        ? PUEBLO_SVG
        : getResourceSvg(item.tipo ?? "OTRO");

      const icon = isSelected && position
        ? makeNumberedIcon(itemColor, position)
        : isSelected
          ? makeNumberedIcon(itemColor, 0)
          : makeUnselectedIcon(itemColor, itemSvg);

      const detailUrl =
        item.type === "pueblo"
          ? `/pueblos/${item.slug}`
          : `/recursos/${item.slug}`;

      const descuento =
        item.descuentoClub != null
          ? `<br/><span style="color:#b45309;font-weight:600">🎫 Club ${item.descuentoClub}% dto.</span>`
          : "";

      const posLabel = position ? `<span style="color:#854d0e;font-weight:700">Parada ${position}</span><br/>` : "";

      const popup = `
        <div style="min-width:160px">
          ${posLabel}<strong>${item.nombre}</strong><br/>
          <span style="color:#666;font-size:13px">${item.provincia} · a ${item.distKm.toFixed(1)} km</span>
          ${descuento}
          <br/><a href="${detailUrl}" style="color:#854d0e;font-weight:600;font-size:13px">Ver detalle →</a>
        </div>`;

      L.marker([item.lat, item.lng], { icon, zIndexOffset: isSelected ? 100 : 0 })
        .addTo(map)
        .bindPopup(popup);
    });

    const bounds = polyline.getBounds();
    items.forEach((item) => bounds.extend([item.lat, item.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [routeCoords, items, origin, destination, selectedIds, orderedSelection]);

  return (
    <div
      ref={mapRef}
      className="relative z-0 h-[500px] w-full rounded-xl border border-border shadow-sm"
    />
  );
}
