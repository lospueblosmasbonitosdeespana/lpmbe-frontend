"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type FormEvent,
} from "react";
import dynamic from "next/dynamic";
import type { RouteItem } from "./RouteMap";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [linkCopied, setLinkCopied] = useState(false);

  const selectedItems =
    result?.items.filter((i) => selectedIds.has(`${i.type}-${i.id}`)) ?? [];

  function toggleItem(key: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAll() {
    if (!result) return;
    setSelectedIds(new Set(result.items.map((i) => `${i.type}-${i.id}`)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  function buildShareUrl() {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    if (originHook.selected) {
      url.searchParams.set("origin", originHook.selected.label);
    }
    if (destHook.selected) {
      url.searchParams.set("dest", destHook.selected.label);
    }
    return url.toString();
  }

  function shareWhatsApp() {
    const stops = selectedItems
      .map((i) => `- ${i.nombre} (${i.provincia})`)
      .join("\n");
    const originLabel = originHook.selected?.label ?? "Origen";
    const destLabel = destHook.selected?.label ?? "Destino";
    const text = `🗺️ Mi ruta por los Pueblos Más Bonitos\n\nDe: ${originLabel} → ${destLabel}\n\n📍 Paradas:\n${stops}\n\n🔗 ${buildShareUrl()}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  }

  function copyLink() {
    navigator.clipboard.writeText(buildShareUrl()).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  function openGoogleMaps() {
    if (!result) return;
    const waypoints = selectedItems
      .map((i) => `${i.lat},${i.lng}`)
      .join("|");
    const url = `https://www.google.com/maps/dir/?api=1&origin=${result.origin.lat},${result.origin.lng}&destination=${result.destination.lat},${result.destination.lng}&waypoints=${waypoints}&travelmode=driving`;
    window.open(url, "_blank");
  }

  function openAppleMaps() {
    if (!result) return;
    const url = `https://maps.apple.com/?saddr=${result.origin.lat},${result.origin.lng}&daddr=${result.destination.lat},${result.destination.lng}&dirflg=d`;
    window.open(url, "_blank");
  }

  function openWaze() {
    if (!result) return;
    const dest = result.destination;
    const url = `https://waze.com/ul?ll=${dest.lat},${dest.lng}&navigate=yes`;
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
      setSelectedIds(new Set(data.items.map((i) => `${i.type}-${i.id}`)));
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

          {/* Distance slider */}
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
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
          {/* Summary */}
          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-800">
              {result.totalPueblos}{" "}
              {result.totalPueblos === 1 ? "pueblo" : "pueblos"}
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">
              {result.totalRecursos}{" "}
              {result.totalRecursos === 1
                ? "recurso turístico"
                : "recursos turísticos"}
            </span>
            <span className="text-muted-foreground">en tu ruta</span>
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
            {selectedIds.size > 0 && (
              <span className="text-xs text-muted-foreground">
                {selectedIds.size} de {result.items.length} seleccionados
              </span>
            )}
          </div>

          {/* Action bar */}
          {selectedIds.size > 0 && (
            <div className="sticky top-20 z-30 mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
              <span className="text-sm font-semibold text-foreground">
                {selectedIds.size} seleccionado{selectedIds.size !== 1 && "s"}
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
                  📋 {linkCopied ? "¡Copiado!" : "Copiar enlace"}
                </button>
                <button
                  type="button"
                  onClick={openGoogleMaps}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: "#4285F4" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
                  Google Maps
                </button>
                <button
                  type="button"
                  onClick={openAppleMaps}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 bg-gray-800"
                >
                  🍎 Apple Maps
                </button>
                <button
                  type="button"
                  onClick={openWaze}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: "#33CCFF" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.54 6.63C19.14 4.02 16.32 2 12.05 2 6.53 2 2.03 6.26 2 11.76c-.01 2.11.66 4.07 1.81 5.68l-.59 2.18a1.5 1.5 0 001.83 1.83l2.18-.59c1.42 1.02 3.09 1.64 4.89 1.72.26.01.52.02.78.02 5.74 0 10.08-4.75 10.08-10.44 0-2.2-.68-4.04-2.44-5.53zM8.5 12a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm7 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg>
                  Waze
                </button>
              </div>
            </div>
          )}

          {/* Map */}
          <RouteMap
            routeCoords={result.routeCoords}
            items={result.items}
            origin={result.origin}
            destination={result.destination}
          />

          {/* Items list */}
          {result.items.length > 0 ? (
            <ul className="mt-8 divide-y divide-border">
              {result.items.map((item) => {
                const key = `${item.type}-${item.id}`;
                return (
                  <li key={key} className="py-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(key)}
                        onChange={() => toggleItem(key)}
                        className="mt-3 h-4 w-4 shrink-0 cursor-pointer rounded border-border text-primary accent-primary"
                      />
                      <a
                        href={
                          item.type === "pueblo"
                            ? `/pueblos/${item.slug}`
                            : `/recursos/${item.slug}`
                        }
                        className="group flex flex-1 items-start gap-4"
                      >
                        <span
                          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${
                            item.type === "pueblo" ? "bg-blue-600" : "bg-amber-600"
                          }`}
                        >
                          {item.type === "pueblo" ? (
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 21h18" />
                              <path d="M5 21V7l7-4 7 4v14" />
                              <path d="M9 21v-4h6v4" />
                            </svg>
                          ) : (
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
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
                              <span className="ml-1.5 text-xs opacity-70">
                                · {item.tipo}
                              </span>
                            )}
                            <span className="ml-1.5">
                              · a {item.distKm.toFixed(1)} km de la ruta
                            </span>
                          </p>
                        </div>

                        <span className="mt-2 text-muted-foreground opacity-0 transition group-hover:opacity-100">
                          →
                        </span>
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
