"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type FormEvent,
} from "react";
import dynamic from "next/dynamic";
import type { RouteItem } from "./RouteMap";
import { getResourceLabel } from "@/lib/resource-types";

const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false });

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationValue {
  label: string;
  lat: number;
  lng: number;
}

interface RouteResponse {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  routeCoords: [number, number][];
  items: RouteItem[];
  totalPueblos: number;
  totalRecursos: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

async function fetchOsrmRoute(
  coords: Array<{ lat: number; lng: number }>,
): Promise<{ routeCoords: [number, number][]; durationSec: number; distanceKm: number } | null> {
  if (coords.length < 2) return null;
  const coordStr = coords.map((c) => `${c.lng},${c.lat}`).join(";");
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route?.geometry?.coordinates) return null;
    return {
      routeCoords: route.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]] as [number, number],
      ),
      durationSec: route.duration ?? 0,
      distanceKm: Math.round((route.distance ?? 0) / 100) / 10,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Nominatim autocomplete hook                                        */
/* ------------------------------------------------------------------ */

function useGeoAutocomplete() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [selected, setSelected] = useState<LocationValue | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=es&addressdetails=0`;
        const res = await fetch(url, { signal: controller.signal });
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        /* aborted or network error */
      } finally {
        setLoading(false);
      }
    }, 500);
  }, []);

  const onInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      setSelected(null);
      search(value);
    },
    [search],
  );

  const onSelect = useCallback((r: NominatimResult) => {
    setSelected({
      label: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    });
    setQuery(r.display_name);
    setOpen(false);
    setResults([]);
  }, []);

  const clear = useCallback(() => {
    setQuery("");
    setSelected(null);
    setResults([]);
    setOpen(false);
  }, []);

  return { query, results, selected, open, loading, onInputChange, onSelect, clear, setOpen };
}

/* ------------------------------------------------------------------ */
/*  Autocomplete input component                                       */
/* ------------------------------------------------------------------ */

function LocationInput({
  label,
  placeholder,
  hook,
}: {
  label: string;
  placeholder: string;
  hook: ReturnType<typeof useGeoAutocomplete>;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        hook.setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [hook]);

  return (
    <div ref={wrapperRef} className="relative flex-1 min-w-[260px]">
      <label className="mb-1.5 block text-sm font-semibold text-foreground/80">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={hook.query}
          onChange={(e) => hook.onInputChange(e.target.value)}
          onFocus={() => hook.results.length > 0 && hook.setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {hook.loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        {hook.selected && !hook.loading && (
          <button
            type="button"
            onClick={hook.clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Borrar"
          >
            ✕
          </button>
        )}
      </div>

      {hook.open && hook.results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-white shadow-lg">
          {hook.results.map((r, i) => (
            <li key={`${r.lat}-${r.lon}-${i}`}>
              <button
                type="button"
                onClick={() => hook.onSelect(r)}
                className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-accent transition-colors"
              >
                <span className="mr-2 text-primary">📍</span>
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export default function CreaMiRutaPage() {
  const originHook = useGeoAutocomplete();
  const destHook = useGeoAutocomplete();
  const [maxDist, setMaxDist] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RouteResponse | null>(null);

  const [orderedSelection, setOrderedSelection] = useState<string[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);

  const [displayRoute, setDisplayRoute] = useState<[number, number][]>([]);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const osrmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedIds = useMemo(() => new Set(orderedSelection), [orderedSelection]);

  const selectedItems = useMemo(
    () =>
      orderedSelection
        .map((key) => result?.items.find((i) => `${i.type}-${i.id}` === key))
        .filter(Boolean) as RouteItem[],
    [orderedSelection, result],
  );

  useEffect(() => {
    if (!result) return;

    if (osrmTimerRef.current) clearTimeout(osrmTimerRef.current);

    const waypoints = selectedItems
      .filter((i) => i.lat && i.lng)
      .map((i) => ({ lat: i.lat, lng: i.lng }));

    const allCoords = [
      result.origin,
      ...waypoints,
      result.destination,
    ];

    if (allCoords.length < 2) {
      setDisplayRoute(result.routeCoords);
      setRouteDuration(null);
      setRouteDistance(null);
      return;
    }

    setRouteLoading(true);

    osrmTimerRef.current = setTimeout(async () => {
      const osrm = await fetchOsrmRoute(allCoords);
      if (osrm) {
        setDisplayRoute(osrm.routeCoords);
        setRouteDuration(osrm.durationSec);
        setRouteDistance(osrm.distanceKm);
      } else {
        setDisplayRoute(result.routeCoords);
        setRouteDuration(null);
        setRouteDistance(null);
      }
      setRouteLoading(false);
    }, 400);

    return () => {
      if (osrmTimerRef.current) clearTimeout(osrmTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedSelection, result]);

  /* ----- Selection helpers ----- */

  function toggleItem(key: string) {
    setOrderedSelection((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      return [...prev, key];
    });
  }

  function selectAll() {
    if (!result) return;
    setOrderedSelection(result.items.map((i) => `${i.type}-${i.id}`));
  }

  function deselectAll() {
    setOrderedSelection([]);
  }

  /* ----- Reorder helpers ----- */

  function moveUp(idx: number) {
    if (idx <= 0) return;
    setOrderedSelection((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function moveDown(idx: number) {
    setOrderedSelection((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  function removeFromRoute(key: string) {
    setOrderedSelection((prev) => prev.filter((k) => k !== key));
  }

  /* ----- Share helpers ----- */

  function itemLabel(item: RouteItem) {
    return `${item.nombre}, ${item.provincia}, España`;
  }

  function buildGoogleMapsUrl() {
    if (!result) return "";
    const originLabel = originHook.selected?.label ?? `${result.origin.lat},${result.origin.lng}`;
    const destLabel = destHook.selected?.label ?? `${result.destination.lat},${result.destination.lng}`;
    const points = [
      originLabel,
      ...selectedItems.map((i) => itemLabel(i)),
      destLabel,
    ];
    return `https://www.google.com/maps/dir/${points.map((p) => encodeURIComponent(p)).join("/")}`;
  }

  function shareWhatsApp() {
    const stops = selectedItems
      .map((i, idx) => `${idx + 1}. ${i.nombre} (${i.provincia})`)
      .join("\n");
    const originLabel = originHook.selected?.label ?? "Origen";
    const destLabel = destHook.selected?.label ?? "Destino";
    const timeStr = routeDuration ? `\n⏱️ Tiempo estimado: ${formatDuration(routeDuration)}` : "";
    const distStr = routeDistance ? ` · ${routeDistance} km` : "";
    const gmapsUrl = buildGoogleMapsUrl();
    const text = `🗺️ Mi ruta por los Pueblos Más Bonitos\n\nDe: ${originLabel} → ${destLabel}${timeStr}${distStr}\n\n📍 Paradas:\n${stops}\n\n🗺️ Abrir en Google Maps:\n${gmapsUrl}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  }

  function copyLink() {
    navigator.clipboard.writeText(buildGoogleMapsUrl()).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  function openGoogleMaps() {
    const url = buildGoogleMapsUrl();
    if (url) window.open(url, "_blank");
  }

  function openAppleMaps() {
    if (!result) return;
    const waypointStr = selectedItems.length > 0
      ? selectedItems.map((i) => `${i.lat},${i.lng}`).join("+to:")
      : "";
    const daddr = waypointStr
      ? `${waypointStr}+to:${result.destination.lat},${result.destination.lng}`
      : `${result.destination.lat},${result.destination.lng}`;
    const url = `https://maps.apple.com/?saddr=${result.origin.lat},${result.origin.lng}&daddr=${daddr}&dirflg=d`;
    window.open(url, "_blank");
  }

  function openWaze() {
    if (!result) return;
    const target = selectedItems.length > 0
      ? selectedItems[0]
      : { lat: result.destination.lat, lng: result.destination.lng };
    const url = `https://www.waze.com/ul?ll=${target.lat}%2C${target.lng}&navigate=yes&zoom=17`;
    window.open(url, "_blank");
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!originHook.selected) {
      setError("Selecciona un punto de origen de la lista de sugerencias.");
      return;
    }
    if (!destHook.selected) {
      setError("Selecciona un punto de destino de la lista de sugerencias.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/public/rutas/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originLat: originHook.selected.lat,
          originLng: originHook.selected.lng,
          destLat: destHook.selected.lat,
          destLng: destHook.selected.lng,
          maxDistKm: maxDist,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.message || `Error del servidor (${res.status})`,
        );
      }

      const data: RouteResponse = await res.json();
      setResult(data);
      setOrderedSelection([]);
      setDisplayRoute(data.routeCoords);

      const baseOsrm = await fetchOsrmRoute([data.origin, data.destination]);
      if (baseOsrm) {
        setRouteDuration(baseOsrm.durationSec);
        setRouteDistance(baseOsrm.distanceKm);
      } else {
        setRouteDuration(null);
        setRouteDistance(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error generando la ruta.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Header */}
      <section className="border-b border-border bg-white/60 px-4 py-12 text-center md:py-16">
        <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
          Crea tu ruta
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
          Introduce un origen y un destino y descubre qué pueblos de la
          asociación y recursos turísticos encontrarás por el camino.
        </p>
      </section>

      {/* Form */}
      <section className="mx-auto max-w-4xl px-4 pt-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <LocationInput
              label="Punto de origen"
              placeholder="Ej: Madrid, Bilbao, Salamanca…"
              hook={originHook}
            />
            <LocationInput
              label="Punto de destino"
              placeholder="Ej: Sevilla, Barcelona, Cáceres…"
              hook={destHook}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground/80">
              Distancia máxima desde la ruta:{" "}
              <span className="text-primary">{maxDist} km</span>
            </label>
            <input
              type="range"
              min={5}
              max={50}
              step={1}
              value={maxDist}
              onChange={(e) => setMaxDist(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>5 km</span>
              <span>50 km</span>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Calculando ruta…
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                Buscar ruta
              </>
            )}
          </button>
        </form>
      </section>

      {/* Results */}
      {result && (
        <section className="mx-auto max-w-5xl px-4 pt-12">
          {/* Summary + Route info */}
          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-primary/15 px-3 py-1 font-semibold text-primary">
              {result.totalPueblos}{" "}
              {result.totalPueblos === 1 ? "pueblo" : "pueblos"}
            </span>
            <span className="rounded-full bg-amber-100/80 px-3 py-1 font-semibold text-amber-800">
              {result.totalRecursos}{" "}
              {result.totalRecursos === 1 ? "recurso turístico" : "recursos turísticos"}
            </span>
            <span className="text-muted-foreground">en tu ruta</span>
          </div>

          {/* Duration / distance bar */}
          <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-white px-4 py-3">
            {routeLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Calculando ruta…
              </div>
            ) : (
              <>
                {routeDuration != null && (
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {formatDuration(routeDuration)}
                  </span>
                )}
                {routeDistance != null && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
                    {routeDistance} km
                  </span>
                )}
                {orderedSelection.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    · {orderedSelection.length} parada{orderedSelection.length !== 1 && "s"} seleccionada{orderedSelection.length !== 1 && "s"}
                  </span>
                )}
                {orderedSelection.length === 0 && routeDuration != null && (
                  <span className="text-sm text-muted-foreground">
                    · Ruta directa A → B · Selecciona paradas para personalizar
                  </span>
                )}
              </>
            )}
          </div>

          {/* Select controls */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-accent"
            >
              Seleccionar todos
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-accent"
            >
              Deseleccionar todos
            </button>
          </div>

          {/* Sticky action bar */}
          {orderedSelection.length > 0 && (
            <div className="sticky top-20 z-30 mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
              <span className="text-sm font-semibold text-foreground">
                {orderedSelection.length} parada{orderedSelection.length !== 1 && "s"}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={shareWhatsApp}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: "#25D366" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-accent"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  {linkCopied ? "¡Copiado!" : "Copiar enlace"}
                </button>
                <button
                  type="button"
                  onClick={openGoogleMaps}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
                  Google Maps
                </button>
                <button
                  type="button"
                  onClick={openAppleMaps}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 bg-gray-800"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  Apple Maps
                </button>
                <button
                  type="button"
                  onClick={openWaze}
                  className="inline-flex items-center gap-1.5 rounded-full bg-stone-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.54 6.63C19.14 4.02 16.32 2 12.05 2 6.53 2 2.03 6.26 2 11.76c-.01 2.11.66 4.07 1.81 5.68l-.59 2.18a1.5 1.5 0 001.83 1.83l2.18-.59c1.42 1.02 3.09 1.64 4.89 1.72.26.01.52.02.78.02 5.74 0 10.08-4.75 10.08-10.44 0-2.2-.68-4.04-2.44-5.53zM8.5 12a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm7 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg>
                  Waze
                </button>
              </div>
            </div>
          )}

          {/* "Tu ruta" - Ordered route section */}
          {orderedSelection.length > 0 && (
            <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="8 12 12 16 16 12" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                </svg>
                Tu ruta ({orderedSelection.length} parada{orderedSelection.length !== 1 && "s"})
              </h3>
              <div className="space-y-1">
                {selectedItems.map((item, idx) => {
                  const key = `${item.type}-${item.id}`;
                  const isFirst = idx === 0;
                  const isLast = idx === selectedItems.length - 1;
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm"
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                          item.type === "pueblo" ? "bg-primary" : "bg-amber-600"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {item.nombre}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          ({item.provincia})
                        </span>
                      </span>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveUp(idx)}
                          disabled={isFirst}
                          className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                          aria-label="Subir"
                          title="Subir"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="18 15 12 9 6 15" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDown(idx)}
                          disabled={isLast}
                          className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                          aria-label="Bajar"
                          title="Bajar"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromRoute(key)}
                          className="rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          aria-label="Quitar de la ruta"
                          title="Quitar de la ruta"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Map */}
          <RouteMap
            routeCoords={displayRoute}
            items={result.items}
            origin={result.origin}
            destination={result.destination}
            selectedIds={selectedIds}
            orderedSelection={orderedSelection}
          />

          {/* Items list */}
          {result.items.length > 0 ? (
            <ul className="mt-8 divide-y divide-border">
              {result.items.map((item) => {
                const key = `${item.type}-${item.id}`;
                const isChecked = selectedIds.has(key);
                const position = orderedSelection.indexOf(key);
                return (
                  <li key={key} className="py-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleItem(key)}
                        className="mt-3 h-4 w-4 shrink-0 cursor-pointer rounded border-border text-primary accent-primary"
                      />
                      <a
                        href={
                          item.type === "pueblo"
                            ? `/pueblos/${item.slug}`
                            : `/recursos/${item.slug}`
                        }
                        className={`group flex flex-1 items-start gap-4 transition-opacity ${isChecked ? "opacity-100" : "opacity-50"}`}
                      >
                        <span
                          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${
                            isChecked
                              ? item.type === "pueblo" ? "bg-primary" : "bg-amber-600"
                              : "bg-stone-400"
                          }`}
                        >
                          {isChecked && position >= 0 ? (
                            <span className="text-sm font-bold">{position + 1}</span>
                          ) : item.type === "pueblo" ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" />
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
                            </svg>
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {item.nombre}
                            </span>
                            {item.descuentoClub != null && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                                🎫 Club {item.descuentoClub}%
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {item.provincia}
                            {item.tipo && (
                              <span className="ml-1.5 text-xs opacity-70">· {getResourceLabel(item.tipo)}</span>
                            )}
                            <span className="ml-1.5">· a {item.distKm.toFixed(1)} km de la ruta</span>
                          </p>
                        </div>

                        <span className="mt-2 text-muted-foreground opacity-0 transition group-hover:opacity-100">→</span>
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-8 rounded-lg border border-border bg-white p-8 text-center text-muted-foreground">
              No se han encontrado pueblos ni recursos turísticos cerca de esta
              ruta. Prueba a aumentar la distancia máxima.
            </div>
          )}
        </section>
      )}
    </main>
  );
}
