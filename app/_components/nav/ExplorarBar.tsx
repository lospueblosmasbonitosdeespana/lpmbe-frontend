'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, X, MapPin, ExternalLink,
  Newspaper, UtensilsCrossed, Landmark, CloudSun,
} from 'lucide-react';
import { TagIcon } from '@/lib/tag-icon-map';
import { TIPOS_SERVICIO } from '@/lib/tipos-servicio';

type PuebloLite = {
  id: number;
  slug: string;
  nombre: string;
  provincia: string;
  comunidad: string;
  foto: string | null;
  semaforoEstado?: string | null;
};

type TagCount = {
  tag: string;
  slug?: string;
  categoria: string;
  nombre_i18n: Record<string, string>;
  icono: string;
  color: string;
  count: number;
};

type SvcTypeCount = { tipo: string; count: number };

type ServiceResult = {
  id: number;
  tipo: string;
  nombre: string | null;
  lat: number;
  lng: number;
  pueblo: { slug: string; nombre: string };
  googleMapsUrl: string;
};

const SEMAFORO_COLORS: Record<string, string> = {
  VERDE: '#22c55e', AMARILLO: '#eab308', ROJO: '#ef4444', GRIS: '#9ca3af',
};

const SVC_LABEL_MAP = new Map<string, string>(
  TIPOS_SERVICIO.map((t) => [t.tipo, t.etiqueta]),
);
const SVC_COLOR_MAP = new Map<string, string>(
  TIPOS_SERVICIO.map((t) => [t.tipo, t.color]),
);

const SVC_SEARCH_ALIASES: Record<string, string[]> = {
  PARKING: ['parking', 'aparcamiento', 'aparcar'],
  TURISMO: ['turismo', 'oficina de turismo', 'informacion'],
  FARMACIA: ['farmacia', 'medicamento'],
  HOSPITAL: ['hospital', 'centro de salud', 'medico', 'urgencias'],
  COCHE_ELECTRICO: ['cargador', 'electrico', 'carga'],
  COCHE_ELECTRICO_ULTRA: ['ultra', 'rapido', 'ultrarapido'],
  CARAVANAS: ['caravana', 'autocaravana', 'camper', 'pernocta'],
  LAVABO: ['lavabo', 'bano', 'aseo', 'wc'],
  GASOLINERA: ['gasolinera', 'gasolina', 'combustible'],
  SUPERMERCADO: ['supermercado', 'compra', 'tienda'],
  AUTOBUS: ['autobus', 'bus', 'transporte'],
  TAXI: ['taxi'],
  TREN: ['tren', 'estacion', 'renfe'],
  BANCO: ['banco', 'cajero', 'dinero'],
  POLICIA: ['policia', 'guardia civil', 'seguridad'],
  FUENTE: ['fuente', 'agua'],
  PICNIC: ['picnic', 'merendero'],
  PARQUE_INFANTIL: ['parque infantil', 'ninos', 'juegos'],
  PLAYA: ['playa'],
  BANO_NATURAL: ['bano natural', 'piscina natural', 'rio'],
  PIPICAN: ['pipican', 'perro', 'mascota'],
  ALQUILER_BICI: ['bicicleta', 'bici', 'alquiler bici'],
  DESFIBRILADOR: ['desfibrilador', 'dea'],
};

const PUEBLO_KEYWORDS = [
  { keyword: 'noticias', label: 'Actualidad', path: (s: string) => `/pueblos/${s}/actualidad`, icon: Newspaper },
  { keyword: 'eventos', label: 'Actualidad', path: (s: string) => `/pueblos/${s}/actualidad`, icon: Newspaper },
  { keyword: 'articulos', label: 'Actualidad', path: (s: string) => `/pueblos/${s}/actualidad`, icon: Newspaper },
  { keyword: 'actualidad', label: 'Actualidad', path: (s: string) => `/pueblos/${s}/actualidad`, icon: Newspaper },
  { keyword: 'comer', label: 'Qué comer', path: (s: string) => `/que-comer/${s}`, icon: UtensilsCrossed },
  { keyword: 'ver', label: 'Qué ver', path: (s: string) => `/pueblos/${s}/lugares-de-interes`, icon: Landmark },
  { keyword: 'tiempo', label: 'Tiempo', path: (s: string) => `/pueblos/${s}/meteo`, icon: CloudSun },
  { keyword: 'meteo', label: 'Tiempo', path: (s: string) => `/pueblos/${s}/meteo`, icon: CloudSun },
] as const;

const PUEBLO_QUICK_LINKS = [
  { label: 'Actualidad', path: (s: string) => `/pueblos/${s}/actualidad`, icon: Newspaper },
  { label: 'Qué comer', path: (s: string) => `/que-comer/${s}`, icon: UtensilsCrossed },
  { label: 'Qué ver', path: (s: string) => `/pueblos/${s}/lugares-de-interes`, icon: Landmark },
  { label: 'Tiempo', path: (s: string) => `/pueblos/${s}/meteo`, icon: CloudSun },
] as const;

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function toSlug(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function matchSvcType(q: string): string | null {
  for (const [tipo, aliases] of Object.entries(SVC_SEARCH_ALIASES)) {
    if (aliases.some((a) => q.includes(a))) return tipo;
    const label = norm(SVC_LABEL_MAP.get(tipo) ?? '');
    if (label && q.includes(label)) return tipo;
  }
  return null;
}

export default function ExplorarBar() {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [pueblos, setPueblos] = useState<PuebloLite[] | null>(null);
  const [tags, setTags] = useState<TagCount[] | null>(null);
  const [svcCounts, setSvcCounts] = useState<SvcTypeCount[] | null>(null);
  const [svcResults, setSvcResults] = useState<ServiceResult[]>([]);
  const [svcLoading, setSvcLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const svcAbortRef = useRef<AbortController | null>(null);

  const hidden =
    pathname?.startsWith('/gestion') || pathname?.startsWith('/explorar');

  useEffect(() => {
    if (hidden || pueblos) return;
    Promise.all([
      fetch('/api/public/explorar').then((r) => r.json()),
      fetch('/api/public/explorar/counts?soloColecciones=true').then((r) => r.json()),
      fetch('/api/public/puntos-servicio/counts').then((r) => r.json()),
    ])
      .then(([explorar, counts, svcCountsData]) => {
        setPueblos(explorar.pueblos ?? []);
        setTags(counts.tags ?? []);
        setSvcCounts(Array.isArray(svcCountsData) ? svcCountsData : []);
      })
      .catch(() => {});
  }, [hidden, pueblos]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const q = norm(query.trim());
  const hasQuery = q.length >= 2;

  const sectionKeyword = useMemo(() => {
    if (!hasQuery) return null;
    return PUEBLO_KEYWORDS.find(sec => q.includes(sec.keyword)) ?? null;
  }, [hasQuery, q]);

  const detectedSvcType = useMemo(() => {
    if (!hasQuery || sectionKeyword) return null;
    return matchSvcType(q);
  }, [hasQuery, q, sectionKeyword]);

  const puebloQuery = useMemo(() => {
    if (sectionKeyword) return q.replace(sectionKeyword.keyword, '').trim();
    if (detectedSvcType) {
      let rest = q;
      const aliases = SVC_SEARCH_ALIASES[detectedSvcType] ?? [];
      for (const a of aliases) {
        rest = rest.replace(a, '').trim();
      }
      const label = norm(SVC_LABEL_MAP.get(detectedSvcType) ?? '');
      if (label) rest = rest.replace(label, '').trim();
      return rest;
    }
    return q;
  }, [q, sectionKeyword, detectedSvcType]);

  const matchedPuebloForSvc = useMemo(() => {
    if (!detectedSvcType || !puebloQuery || puebloQuery.length < 2 || !pueblos) return null;
    return pueblos.find(
      (p) => norm(p.nombre).includes(puebloQuery) || norm(p.slug).includes(puebloQuery),
    ) ?? null;
  }, [detectedSvcType, puebloQuery, pueblos]);

  const fetchSvcPoints = useCallback(async (tipo: string, puebloSlug: string) => {
    svcAbortRef.current?.abort();
    const controller = new AbortController();
    svcAbortRef.current = controller;
    setSvcLoading(true);
    try {
      const qs = new URLSearchParams({ tipo, pueblo: puebloSlug });
      const res = await fetch(`/api/public/puntos-servicio/buscar?${qs}`, {
        signal: controller.signal,
      });
      if (!res.ok) { setSvcResults([]); return; }
      const data = await res.json();
      setSvcResults(Array.isArray(data) ? data : []);
    } catch {
      if (!controller.signal.aborted) setSvcResults([]);
    } finally {
      setSvcLoading(false);
    }
  }, []);

  useEffect(() => {
    if (detectedSvcType && matchedPuebloForSvc) {
      fetchSvcPoints(detectedSvcType, matchedPuebloForSvc.slug);
    } else {
      setSvcResults([]);
    }
  }, [detectedSvcType, matchedPuebloForSvc, fetchSvcPoints]);

  const matchingTags = useMemo(
    () =>
      hasQuery && tags && !sectionKeyword && !detectedSvcType
        ? tags
            .filter((t) => {
              const name = norm(t.nombre_i18n?.es ?? '');
              return name.includes(q) || norm(t.tag).includes(q);
            })
            .slice(0, 4)
        : [],
    [hasQuery, tags, q, sectionKeyword, detectedSvcType],
  );

  const matchingSvcTypes = useMemo(
    () => {
      if (!hasQuery || !svcCounts || sectionKeyword) return [];
      if (detectedSvcType && matchedPuebloForSvc) return [];
      const matches: Array<SvcTypeCount & { label: string; color: string }> = [];
      for (const sc of svcCounts) {
        const label = SVC_LABEL_MAP.get(sc.tipo) ?? sc.tipo;
        const color = SVC_COLOR_MAP.get(sc.tipo) ?? '#6b7280';
        const aliases = SVC_SEARCH_ALIASES[sc.tipo] ?? [];
        const normLabel = norm(label);
        if (
          normLabel.includes(q) ||
          norm(sc.tipo).includes(q) ||
          aliases.some((a) => q.includes(a) || a.includes(q))
        ) {
          matches.push({ ...sc, label, color });
        }
      }
      return matches.slice(0, 5);
    },
    [hasQuery, svcCounts, q, sectionKeyword, detectedSvcType, matchedPuebloForSvc],
  );

  const matchingPueblos = useMemo(
    () =>
      hasQuery && pueblos && !detectedSvcType
        ? pueblos
            .filter(
              (p) =>
                norm(p.nombre).includes(puebloQuery) ||
                norm(p.provincia).includes(puebloQuery) ||
                norm(p.comunidad).includes(puebloQuery),
            )
            .slice(0, sectionKeyword ? 3 : 5)
        : [],
    [hasQuery, pueblos, puebloQuery, sectionKeyword, detectedSvcType],
  );

  if (hidden) return null;

  const close = () => { setFocused(false); setQuery(''); };

  const hasAnyResults =
    matchingTags.length > 0 ||
    matchingSvcTypes.length > 0 ||
    matchingPueblos.length > 0 ||
    svcResults.length > 0 ||
    (detectedSvcType && !matchedPuebloForSvc);
  const showDropdown = focused && hasQuery;

  const svcTypeLabel = detectedSvcType ? (SVC_LABEL_MAP.get(detectedSvcType) ?? detectedSvcType) : '';

  return (
    <div className="border-b border-border/30 bg-muted/30 dark:bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 py-1.5">
        <div ref={wrapperRef} className="relative mx-auto max-w-lg">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder="Buscar pueblo, parking, farmacia, castillo..."
              enterKeyHint="search"
              autoComplete="off"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-9 text-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card/80"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground/50 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
              {hasAnyResults ? (
                <>
                  {/* Service type + pueblo → real geolocated points */}
                  {detectedSvcType && matchedPuebloForSvc && (
                    <div>
                      <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {svcTypeLabel} en {matchedPuebloForSvc.nombre}
                      </p>
                      {svcLoading && (
                        <p className="px-3 py-2 text-xs text-muted-foreground">Buscando...</p>
                      )}
                      {!svcLoading && svcResults.length === 0 && (
                        <p className="px-3 py-2 text-xs text-muted-foreground">
                          No hay {svcTypeLabel.toLowerCase()} en {matchedPuebloForSvc.nombre}
                        </p>
                      )}
                      {svcResults.map((r) => (
                        <a
                          key={r.id}
                          href={r.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={close}
                          className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                        >
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${SVC_COLOR_MAP.get(r.tipo) ?? '#6b7280'}20` }}
                          >
                            <MapPin className="h-4 w-4" style={{ color: SVC_COLOR_MAP.get(r.tipo) ?? '#6b7280' }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {r.nombre ?? svcTypeLabel}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              Abrir en Google Maps
                            </p>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Service type only → show type with count */}
                  {detectedSvcType && !matchedPuebloForSvc && (
                    <div>
                      <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Servicios del visitante
                      </p>
                      <p className="px-3 py-2 text-xs text-muted-foreground">
                        Escribe el nombre del pueblo para ver los {svcTypeLabel.toLowerCase()} (ej: &ldquo;{query} ainsa&rdquo;)
                      </p>
                    </div>
                  )}

                  {/* Generic service type matches (no specific type+pueblo) */}
                  {matchingSvcTypes.length > 0 && (
                    <div>
                      <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Servicios del visitante
                      </p>
                      {matchingSvcTypes.map((s) => (
                        <div
                          key={s.tipo}
                          className="flex items-center gap-3 px-3 py-2"
                        >
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${s.color}20` }}
                          >
                            <MapPin className="h-4 w-4" style={{ color: s.color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {s.label}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              En {s.count} pueblos — escribe un pueblo para ver puntos concretos
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tags (colecciones) */}
                  {matchingTags.length > 0 && (
                    <div>
                      <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Características
                      </p>
                      {matchingTags.map((t) => {
                        const slug = t.slug || toSlug(t.nombre_i18n?.es ?? t.tag);
                        return (
                          <Link
                            key={t.tag}
                            href={`/explorar/${slug}`}
                            onClick={close}
                            className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                          >
                            <div
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                              style={{ backgroundColor: `${t.color}18` }}
                            >
                              <TagIcon name={t.icono} color={t.color} size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {t.nombre_i18n?.es ?? t.tag}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                              {t.count} pueblos
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* Pueblos */}
                  {matchingPueblos.length > 0 && (
                    <div>
                      <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {sectionKeyword
                          ? `${sectionKeyword.label} en pueblos`
                          : 'Pueblos'}
                      </p>
                      {matchingPueblos.map((p) => (
                        <div key={p.id}>
                          <Link
                            href={sectionKeyword
                              ? sectionKeyword.path(p.slug)
                              : `/pueblos/${p.slug}`}
                            onClick={close}
                            className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                          >
                            {p.foto ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={p.foto}
                                alt=""
                                className="h-8 w-8 shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                                {sectionKeyword
                                  ? `${sectionKeyword.label} de ${p.nombre}`
                                  : p.nombre}
                                {p.semaforoEstado && SEMAFORO_COLORS[p.semaforoEstado] && (
                                  <span
                                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: SEMAFORO_COLORS[p.semaforoEstado] }}
                                    title={p.semaforoEstado === 'VERDE' ? 'Ideal para visitar' : p.semaforoEstado === 'AMARILLO' ? 'Afluencia media' : p.semaforoEstado === 'ROJO' ? 'Alta afluencia' : ''}
                                  />
                                )}
                              </p>
                              <p className="truncate text-[11px] text-muted-foreground">
                                {p.provincia}
                              </p>
                            </div>
                          </Link>
                          {!sectionKeyword && (
                            <div className="flex flex-wrap gap-1 px-3 pb-2 pl-14">
                              {PUEBLO_QUICK_LINKS.map((sec) => (
                                <Link
                                  key={sec.label}
                                  href={sec.path(p.slug)}
                                  onClick={close}
                                  className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                >
                                  <sec.icon className="h-2.5 w-2.5" />
                                  {sec.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No se encontraron resultados para &ldquo;{query}&rdquo;
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
