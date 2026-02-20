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
              {result.items.map((item) => (
                <li key={`${item.type}-${item.id}`} className="py-4">
                  <a
                    href={
                      item.type === "pueblo"
                        ? `/pueblos/${item.slug}`
                        : `/recursos/${item.slug}`
                    }
                    className="group flex items-start gap-4"
                  >
                    {/* Type icon */}
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

                    {/* Text */}
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

                    {/* Arrow */}
                    <span className="mt-2 text-muted-foreground opacity-0 transition group-hover:opacity-100">
                      →
                    </span>
                  </a>
                </li>
              ))}
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
