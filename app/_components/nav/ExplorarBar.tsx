'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, X, MapPin,
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

const SEMAFORO_COLORS: Record<string, string> = {
  VERDE: '#22c55e', AMARILLO: '#eab308', ROJO: '#ef4444', GRIS: '#9ca3af',
};

const SVC_LABEL_MAP = new Map<string, string>(
  TIPOS_SERVICIO.map((t) => [t.tipo, t.etiqueta]),
);
const SVC_COLOR_MAP = new Map<string, string>(
  TIPOS_SERVICIO.map((t) => [t.tipo, t.color]),
);

// Aliases de búsqueda para detectar el tipo de servicio por palabras clave
const SVC_SEARCH_ALIASES: Record<string, string[]> = {
  PARKING:              ['parking', 'aparcamiento', 'aparcar'],
  TURISMO:              ['turismo', 'oficina de turismo', 'informacion turistica'],
  FARMACIA:             ['farmacia', 'medicamento'],
  HOSPITAL:             ['hospital', 'centro de salud', 'medico', 'urgencias'],
  COCHE_ELECTRICO:      ['cargador electrico', 'coche electrico', 'recarga', 'electrolinera'],
  COCHE_ELECTRICO_ULTRA:['ultra rapido', 'ultrarapido'],
  CARAVANAS:            ['caravana', 'autocaravana', 'camper', 'pernocta'],
  LAVABO:               ['lavabo', 'aseo', 'wc', 'bano publico'],
  GASOLINERA:           ['gasolinera', 'gasolina', 'combustible'],
  SUPERMERCADO:         ['supermercado', 'compra', 'tienda alimentacion'],
  AUTOBUS:              ['autobus', 'bus', 'estacion de bus'],
  TAXI:                 ['taxi'],
  TREN:                 ['tren', 'estacion de tren', 'renfe'],
  BANCO:                ['banco', 'cajero', 'cajero automatico'],
  POLICIA:              ['policia', 'guardia civil'],
  FUENTE:               ['fuente', 'agua potable'],
  PICNIC:               ['picnic', 'merendero', 'area picnic'],
  PARQUE_INFANTIL:      ['parque infantil', 'juegos infantiles'],
  PLAYA:                ['playa'],
  BANO_NATURAL:         ['bano natural', 'piscina natural', 'piscina fluvial', 'rio'],
  PIPICAN:              ['pipican', 'area canina', 'perros', 'mascotas'],
  ALQUILER_BICI:        ['bicicleta', 'bici', 'alquiler bici', 'alquiler de bicicletas'],
  DESFIBRILADOR:        ['desfibrilador', 'dea'],
};

const PUEBLO_KEYWORDS = [
  { keyword: 'noticias',   label: 'Actualidad', path: (s: string) => `/pueblos/${s}/actualidad`,        icon: Newspaper },
  { keyword: 'eventos',    label: 'Actualidad', path: (s: string) => `/pueblos/${s}/actualidad`,        icon: Newspaper },
  { keyword: 'articulos',  label: 'Actualidad', path: (s: string) => `/pueblos/${s}/actualidad`,        icon: Newspaper },
  { keyword: 'actualidad', label: 'Actualidad', path: (s: string) => `/pueblos/${s}/actualidad`,        icon: Newspaper },
  { keyword: 'comer',      label: 'Qué comer',  path: (s: string) => `/que-comer/${s}`,                icon: UtensilsCrossed },
  { keyword: 'ver',        label: 'Qué ver',    path: (s: string) => `/pueblos/${s}/lugares-de-interes`, icon: Landmark },
  { keyword: 'tiempo',     label: 'Tiempo',     path: (s: string) => `/pueblos/${s}/meteo`,             icon: CloudSun },
  { keyword: 'meteo',      label: 'Tiempo',     path: (s: string) => `/pueblos/${s}/meteo`,             icon: CloudSun },
] as const;

const PUEBLO_QUICK_LINKS = [
  { label: 'Actualidad', path: (s: string) => `/pueblos/${s}/actualidad`,         icon: Newspaper },
  { label: 'Qué comer',  path: (s: string) => `/que-comer/${s}`,                  icon: UtensilsCrossed },
  { label: 'Qué ver',    path: (s: string) => `/pueblos/${s}/lugares-de-interes`, icon: Landmark },
  { label: 'Tiempo',     path: (s: string) => `/pueblos/${s}/meteo`,              icon: CloudSun },
] as const;

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function toSlug(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function matchSvcType(q: string): string | null {
  for (const [tipo, aliases] of Object.entries(SVC_SEARCH_ALIASES)) {
    if (aliases.some((a) => q.includes(norm(a)))) return tipo;
  }
  // también coincide con la etiqueta del tipo
  for (const t of TIPOS_SERVICIO) {
    if (q.includes(norm(t.etiqueta))) return t.tipo;
  }
  return null;
}

export default function ExplorarBar() {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [pueblos, setPueblos] = useState<PuebloLite[] | null>(null);
  const [tags, setTags] = useState<TagCount[] | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hidden =
    pathname?.startsWith('/gestion') || pathname?.startsWith('/explorar');

  useEffect(() => {
    if (hidden || pueblos) return;
    Promise.all([
      fetch('/api/public/explorar').then((r) => r.json()),
      fetch('/api/public/explorar/counts?soloColecciones=true').then((r) => r.json()),
    ])
      .then(([explorar, counts]) => {
        setPueblos(explorar.pueblos ?? []);
        setTags(counts.tags ?? []);
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

  // ── Detectar si el query contiene un tipo de servicio ─────────────────────
  const detectedSvcType = useMemo(() => {
    if (!hasQuery) return null;
    return matchSvcType(q);
  }, [hasQuery, q]);

  // ── Detectar si hay también un pueblo en el query ─────────────────────────
  const matchedPuebloForSvc = useMemo(() => {
    if (!detectedSvcType || !pueblos) return null;
    // eliminar los alias del tipo del query para quedarnos con el pueblo
    let rest = q;
    const aliases = SVC_SEARCH_ALIASES[detectedSvcType] ?? [];
    for (const a of aliases) { rest = rest.replace(norm(a), '').trim(); }
    rest = rest.replace(norm(SVC_LABEL_MAP.get(detectedSvcType) ?? ''), '').trim();
    if (rest.length < 2) return null;
    return (
      pueblos.find((p) => norm(p.nombre).includes(rest) || norm(p.slug).includes(rest)) ?? null
    );
  }, [detectedSvcType, q, pueblos]);

  // ── Sección de página de pueblo (noticias, meteo…) ───────────────────────
  const sectionKeyword = useMemo(() => {
    if (!hasQuery || detectedSvcType) return null;
    return PUEBLO_KEYWORDS.find(sec => q.includes(sec.keyword)) ?? null;
  }, [hasQuery, q, detectedSvcType]);

  const puebloQuery = useMemo(() => {
    if (sectionKeyword) return q.replace(sectionKeyword.keyword, '').trim();
    return q;
  }, [q, sectionKeyword]);

  // ── Tags / colecciones ────────────────────────────────────────────────────
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

  // ── Pueblos ───────────────────────────────────────────────────────────────
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

  const svcLabel = detectedSvcType ? (SVC_LABEL_MAP.get(detectedSvcType) ?? detectedSvcType) : '';
  const svcColor = detectedSvcType ? (SVC_COLOR_MAP.get(detectedSvcType) ?? '#6b7280') : '#6b7280';

  const hasAnyResults =
    !!detectedSvcType ||
    matchingTags.length > 0 ||
    matchingPueblos.length > 0;
  const showDropdown = focused && hasQuery;

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
                  {/* ── Servicio detectado ───────────────────────────── */}
                  {detectedSvcType && (
                    <div>
                      <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Servicios del visitante
                      </p>

                      {matchedPuebloForSvc ? (
                        /* Tipo + pueblo → UN resultado → mapa del pueblo */
                        <Link
                          href={`/pueblos/${matchedPuebloForSvc.slug}#mapa`}
                          onClick={close}
                          className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                        >
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${svcColor}20` }}
                          >
                            <MapPin className="h-4 w-4" style={{ color: svcColor }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {svcLabel} en {matchedPuebloForSvc.nombre}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              Ver en el mapa del pueblo
                            </p>
                          </div>
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                        </Link>
                      ) : (
                        /* Solo tipo → pide añadir el pueblo */
                        <div className="px-3 py-2">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                              style={{ backgroundColor: `${svcColor}20` }}
                            >
                              <MapPin className="h-4 w-4" style={{ color: svcColor }} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {svcLabel}
                              </p>
                              <p className="truncate text-[11px] text-muted-foreground">
                                Añade el nombre del pueblo (ej: &ldquo;{query} Aínsa&rdquo;)
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Tags / colecciones ───────────────────────────── */}
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

                  {/* ── Pueblos ──────────────────────────────────────── */}
                  {matchingPueblos.length > 0 && (
                    <div>
                      <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {sectionKeyword ? `${sectionKeyword.label} en pueblos` : 'Pueblos'}
                      </p>
                      {matchingPueblos.map((p) => (
                        <div key={p.id}>
                          <Link
                            href={sectionKeyword ? sectionKeyword.path(p.slug) : `/pueblos/${p.slug}`}
                            onClick={close}
                            className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                          >
                            {p.foto ? (
                              // eslint-disable-next-line @next/next/no-img-element
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
                                {sectionKeyword ? `${sectionKeyword.label} de ${p.nombre}` : p.nombre}
                                {p.semaforoEstado && SEMAFORO_COLORS[p.semaforoEstado] && (
                                  <span
                                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: SEMAFORO_COLORS[p.semaforoEstado] }}
                                    title={
                                      p.semaforoEstado === 'VERDE' ? 'Ideal para visitar'
                                      : p.semaforoEstado === 'AMARILLO' ? 'Afluencia media'
                                      : p.semaforoEstado === 'ROJO' ? 'Alta afluencia'
                                      : ''
                                    }
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
