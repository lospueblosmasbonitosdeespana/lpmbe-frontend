'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Search, X, MapPin,
  Newspaper, UtensilsCrossed, Landmark, CloudSun,
  Users, PawPrint, Building2, Palette, TreePine,
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
  hasSlug?: boolean; // true = colección activa con página /explorar/[slug]
};

type RutaLite = {
  id: number;
  titulo: string;
  slug: string;
  activo: boolean;
};

type DescubreColeccion = {
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  count?: number;
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
  PARKING:               ['parking', 'aparcamiento', 'aparcar'],
  TURISMO:               ['turismo', 'oficina de turismo', 'informacion turistica'],
  FARMACIA:              ['farmacia', 'medicamento'],
  HOSPITAL:              ['hospital', 'centro de salud', 'medico', 'urgencias'],
  COCHE_ELECTRICO:       ['cargador electrico', 'coche electrico', 'recarga', 'electrolinera'],
  COCHE_ELECTRICO_ULTRA: ['ultra rapido', 'ultrarapido', 'cargador ultra'],
  CARAVANAS:             ['caravana', 'autocaravana', 'camper', 'pernocta'],
  LAVABO:                ['lavabo', 'aseo', 'wc', 'bano publico'],
  GASOLINERA:            ['gasolinera', 'gasolina', 'combustible'],
  SUPERMERCADO:          ['supermercado', 'compra', 'tienda alimentacion'],
  AUTOBUS:               ['autobus', 'bus', 'estacion de bus'],
  TAXI:                  ['taxi'],
  TREN:                  ['tren', 'estacion de tren', 'renfe'],
  BANCO:                 ['banco', 'cajero', 'cajero automatico'],
  POLICIA:               ['policia', 'guardia civil'],
  FUENTE:                ['fuente', 'agua potable'],
  PICNIC:                ['picnic', 'merendero', 'area picnic'],
  PARQUE_INFANTIL:       ['parque infantil', 'juegos infantiles'],
  PLAYA:                 ['playa'],
  BANO_NATURAL:          ['bano natural', 'piscina natural', 'piscina fluvial'],
  PIPICAN:               ['pipican', 'area canina', 'perros'],
  ALQUILER_BICI:         ['bicicleta', 'bici', 'alquiler bici', 'alquiler de bicicletas'],
  DESFIBRILADOR:         ['desfibrilador', 'dea'],
};

const PUEBLO_KEYWORDS = [
  { keyword: 'noticias',    navKey: 'actualidad',  path: (s: string) => `/pueblos/${s}/actualidad`,            icon: Newspaper },
  { keyword: 'eventos',     navKey: 'actualidad',  path: (s: string) => `/pueblos/${s}/actualidad`,            icon: Newspaper },
  { keyword: 'articulos',   navKey: 'actualidad',  path: (s: string) => `/pueblos/${s}/actualidad`,            icon: Newspaper },
  { keyword: 'actualidad',  navKey: 'actualidad',  path: (s: string) => `/pueblos/${s}/actualidad`,            icon: Newspaper },
  { keyword: 'comer',       navKey: 'gastronomia', path: (s: string) => `/que-comer/${s}`,                     icon: UtensilsCrossed },
  { keyword: 'gastronomia', navKey: 'gastronomia', path: (s: string) => `/que-comer/${s}`,                     icon: UtensilsCrossed },
  { keyword: 'ver',         navKey: 'queVer',      path: (s: string) => `/pueblos/${s}/lugares-de-interes`,    icon: Landmark },
  { keyword: 'tiempo',      navKey: 'meteo',       path: (s: string) => `/pueblos/${s}/meteo`,                 icon: CloudSun },
  { keyword: 'meteo',       navKey: 'meteo',       path: (s: string) => `/pueblos/${s}/meteo`,                 icon: CloudSun },
  { keyword: 'familia',     navKey: 'family',      path: (s: string) => `/pueblos/${s}/categoria/en-familia`,  icon: Users },
  { keyword: 'ninos',       navKey: 'family',      path: (s: string) => `/pueblos/${s}/categoria/en-familia`,  icon: Users },
  { keyword: 'petfriendly', navKey: 'petfriendly', path: (s: string) => `/pueblos/${s}/categoria/petfriendly`, icon: PawPrint },
  { keyword: 'mascotas',    navKey: 'petfriendly', path: (s: string) => `/pueblos/${s}/categoria/petfriendly`, icon: PawPrint },
  { keyword: 'patrimonio',  navKey: 'patrimonio',  path: (s: string) => `/pueblos/${s}/categoria/patrimonio`,  icon: Building2 },
  { keyword: 'cultura',     navKey: 'culture',     path: (s: string) => `/pueblos/${s}/categoria/cultura`,     icon: Palette },
  { keyword: 'cultural',    navKey: 'culture',     path: (s: string) => `/pueblos/${s}/categoria/cultura`,     icon: Palette },
  { keyword: 'naturaleza',  navKey: 'nature',      path: (s: string) => `/pueblos/${s}/categoria/naturaleza`,  icon: TreePine },
  { keyword: 'paisaje',     navKey: 'nature',      path: (s: string) => `/pueblos/${s}/categoria/naturaleza`,  icon: TreePine },
] as const;

// Páginas temáticas generales (sin pueblo detectado)
// navKey → clave del namespace 'nav' para obtener label traducida
const TEMATICAS = [
  { navKey: 'noticias',    extraNavKey: 'eventos',   keywords: ['noticias', 'eventos', 'alertas', 'notificaciones'], label: 'Noticias y eventos',  href: '/notificaciones',  icon: Newspaper },
  { navKey: 'sectionColecciones', extraNavKey: null,        keywords: ['colecciones', 'descubre', 'tematicas'],             label: 'Colecciones', href: '/descubre',        icon: Landmark },
  { navKey: 'gastronomia', extraNavKey: null,        keywords: ['gastronomia', 'comer'],              label: 'Gastronomía',  href: '/experiencias/gastronomia', icon: UtensilsCrossed },
  { navKey: 'family',      extraNavKey: null,        keywords: ['familia', 'ninos', 'en familia'],    label: 'En familia',   href: '/experiencias/en-familia',  icon: Users },
  { navKey: 'petfriendly', extraNavKey: null,        keywords: ['petfriendly', 'mascotas', 'perros'], label: 'Pet friendly', href: '/experiencias/petfriendly', icon: PawPrint },
  { navKey: 'patrimonio',  extraNavKey: null,        keywords: ['patrimonio'],                        label: 'Patrimonio',   href: '/experiencias/patrimonio',  icon: Building2 },
  { navKey: 'culture',     extraNavKey: null,        keywords: ['cultura', 'cultural'],               label: 'Cultura',      href: '/experiencias/cultura',     icon: Palette },
  { navKey: 'nature',      extraNavKey: null,        keywords: ['naturaleza', 'paisaje'],             label: 'Naturaleza',   href: '/experiencias/naturaleza',  icon: TreePine },
] as const;

const PUEBLO_QUICK_LINKS = [
  { navKey: 'actualidad', path: (s: string) => `/pueblos/${s}/actualidad`,         icon: Newspaper },
  { navKey: 'queVer',     path: (s: string) => `/pueblos/${s}/lugares-de-interes`, icon: Landmark },
  { navKey: 'meteo',      path: (s: string) => `/pueblos/${s}/meteo`,              icon: CloudSun },
  { navKey: 'servicios',  path: (s: string) => `/pueblos/${s}#mapa`,               icon: MapPin },
] as const;

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function toSlug(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Intenta extraer un pueblo del query.
 * Soporta "ainsa parking", "parking ainsa", "ainsa" y nombres compuestos.
 * Devuelve el pueblo encontrado y el resto del query.
 */
function findPuebloInQuery(
  q: string,
  pueblos: PuebloLite[],
): { pueblo: PuebloLite; remainder: string } | null {
  // Ordenar de mayor a menor longitud para priorizar nombres compuestos
  const sorted = [...pueblos].sort((a, b) => b.nombre.length - a.nombre.length);

  for (const pueblo of sorted) {
    const pNorm = norm(pueblo.nombre);

    if (q === pNorm) return { pueblo, remainder: '' };

    // Pueblo al inicio: "ainsa parking" / "ainsa p"
    if (q.startsWith(pNorm + ' ')) {
      return { pueblo, remainder: q.slice(pNorm.length + 1).trim() };
    }

    // Pueblo al final: "parking ainsa"
    if (q.endsWith(' ' + pNorm)) {
      return { pueblo, remainder: q.slice(0, q.length - pNorm.length - 1).trim() };
    }
  }

  return null;
}

/**
 * Devuelve los tipos de servicio que coinciden (total o parcialmente) con el texto dado.
 */
function getMatchingServiceTypes(
  partial: string,
): Array<{ tipo: string; label: string; color: string }> {
  if (!partial) return [];
  const results: Array<{ tipo: string; label: string; color: string }> = [];
  const seen = new Set<string>();

  for (const t of TIPOS_SERVICIO) {
    if (seen.has(t.tipo)) continue;
    const label = norm(t.etiqueta);
    const aliases = (SVC_SEARCH_ALIASES[t.tipo] ?? []).map(norm);

    const matches =
      label.startsWith(partial) ||
      label.includes(partial) ||
      partial.includes(label) ||   // "farmacia de".includes("farmacia") → true
      aliases.some((a) => a.startsWith(partial) || a.includes(partial) || partial.includes(a));

    if (matches) {
      results.push({ tipo: t.tipo, label: t.etiqueta, color: t.color });
      seen.add(t.tipo);
    }
  }

  return results.slice(0, 7);
}

export default function ExplorarBar() {
  const pathname = usePathname();
  const tNav = useTranslations('nav');
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [pueblos, setPueblos] = useState<PuebloLite[] | null>(null);
  const [tags, setTags] = useState<TagCount[] | null>(null);
  const [mxList, setMxList] = useState<RutaLite[] | null>(null);
  const [descubreList, setDescubreList] = useState<DescubreColeccion[] | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hidden =
    pathname?.startsWith('/gestion') || pathname?.startsWith('/explorar');

  // Mapa de keywords traducidos → keyword base en español (para matching multilingüe)
  const localeKeyMap = useMemo<Record<string, string>>(() => {
    const pairs: [string, string][] = [
      [norm(tNav('meteo')),        'meteo'],
      [norm(tNav('gastronomia')),  'gastronomia'],
      [norm(tNav('nature')),       'naturaleza'],
      [norm(tNav('culture')),      'cultura'],
      [norm(tNav('family')),       'familia'],
      [norm(tNav('petfriendly')),  'petfriendly'],
      [norm(tNav('patrimonio')),   'patrimonio'],
      [norm(tNav('noticias')),     'noticias'],
      [norm(tNav('eventos')),      'eventos'],
      [norm(tNav('actualidad')),   'actualidad'],
      [norm(tNav('rutas')),        'rutas'],
      [norm(tNav('queVer')),       'ver'],
      [norm(tNav('servicios')),    'servicios'],
      [norm(tNav('descubre')),     'descubre'],
      [norm(tNav('sectionColecciones')), 'colecciones'],
    ];
    // Elimina entradas donde el keyword ya coincide con el español (no-op)
    return Object.fromEntries(pairs.filter(([k, v]) => k !== v));
  }, [tNav]);

  useEffect(() => {
    if (hidden || pueblos) return;
    Promise.all([
      fetch('/api/public/explorar').then((r) => r.json()),
      fetch('/api/public/explorar/counts?soloColecciones=true').then((r) => r.json()),
      fetch('/api/public/rutas').then((r) => r.json()).catch(() => []),
    ])
      .then(([explorar, counts, rutasData]) => {
        setPueblos(explorar.pueblos ?? []);
        setTags(counts.tags ?? []);
        setMxList(Array.isArray(rutasData) ? rutasData.filter((r: RutaLite) => r.activo) : []);
      })
      .catch(() => {});
  }, [hidden, pueblos]);

  // Colecciones /descubre/ siempre frescas — sin caché en cliente
  useEffect(() => {
    if (hidden) return;
    fetch('/api/public/descubre')
      .then((r) => r.json())
      .then((data) => setDescubreList(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [hidden]);

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
  const hasQuery = q.length >= 1;

  // ── Detectar pueblo dentro del query ─────────────────────────────────────
  const parsedQuery = useMemo(() => {
    if (!hasQuery || !pueblos) return null;
    return findPuebloInQuery(q, pueblos);
  }, [hasQuery, q, pueblos]);

  // ── Cuando hay pueblo: servicios que coinciden con el resto ───────────────
  const matchingServices = useMemo(() => {
    if (!parsedQuery) return [];
    const { remainder } = parsedQuery;
    if (!remainder) return [];
    return getMatchingServiceTypes(remainder);
  }, [parsedQuery]);

  // ── Sección de pueblo (noticias, meteo…) cuando hay pueblo + keyword ──────
  const sectionKeyword = useMemo(() => {
    if (!parsedQuery?.remainder) return null;
    const rem = parsedQuery.remainder;
    // Comprueba keyword en español directamente
    const direct = PUEBLO_KEYWORDS.find((sec) => rem.includes(sec.keyword));
    if (direct) return direct;
    // Comprueba keyword en el idioma actual → mapea al español
    for (const [localeKw, spanishKw] of Object.entries(localeKeyMap)) {
      if (rem.includes(localeKw)) {
        const match = PUEBLO_KEYWORDS.find((sec) => sec.keyword === spanishKw);
        if (match) return match;
      }
    }
    return null;
  }, [parsedQuery, localeKeyMap]);

  // ── Búsqueda general sin pueblo detectado ─────────────────────────────────
  // Palabras individuales del query (≥3 chars) para búsqueda tolerante
  const qWords = useMemo(
    () => q.split(/\s+/).filter((w) => w.length >= 3),
    [q],
  );

  const matchingPueblos = useMemo(() => {
    if (!hasQuery || !pueblos || parsedQuery) return [];
    return pueblos
      .filter((p) => {
        const nombre = norm(p.nombre);
        const prov = norm(p.provincia);
        const com = norm(p.comunidad);
        return (
          nombre.includes(q) ||
          prov.includes(q) ||
          com.includes(q) ||
          qWords.some((w) => nombre.includes(w) || prov.includes(w) || com.includes(w))
        );
      })
      .slice(0, 5);
  }, [hasQuery, pueblos, q, qWords, parsedQuery]);

  const matchingTags = useMemo(() => {
    if (!hasQuery || !tags || parsedQuery) return [];
    return tags
      .filter((t) => {
        const name = norm(t.nombre_i18n?.es ?? '');
        const tagKey = norm(t.tag);
        return (
          name.includes(q) ||
          tagKey.includes(q) ||
          q.includes(name) ||          // "pueblos con castillo" contiene "castillo"
          qWords.some((w) => name.includes(w) || tagKey.includes(w))
        );
      })
      .slice(0, 6);
  }, [hasQuery, tags, q, qWords, parsedQuery]);

  const matchingMx = useMemo(() => {
    if (!hasQuery || !mxList || parsedQuery) return [];
    return mxList
      .filter((r) => {
        const titulo = norm(r.titulo);
        return (
          titulo.includes(q) ||
          q.includes(titulo) ||
          qWords.some((w) => titulo.includes(w))
        );
      })
      .slice(0, 5);
  }, [hasQuery, mxList, q, qWords, parsedQuery]);

  const matchingDescubre = useMemo(() => {
    if (!hasQuery || !descubreList || parsedQuery) return [];
    return descubreList
      .filter((c) => {
        const title = norm(c.title);
        const desc = norm(c.description ?? '');
        return (
          title.includes(q) ||
          q.includes(title) ||
          qWords.some((w) => title.includes(w) || desc.includes(w))
        );
      })
      .slice(0, 4);
  }, [hasQuery, descubreList, q, qWords, parsedQuery]);

  const matchingTematicas = useMemo(() => {
    if (!hasQuery || parsedQuery) return [];
    return TEMATICAS.filter((t) => {
      // Keywords base en español
      const spanishMatch = t.keywords.some((kw) => q.includes(norm(kw)) || norm(kw).includes(q));
      if (spanishMatch) return true;
      // Label traducida al idioma actual
      const localeLabel = norm(tNav(t.navKey));
      const localeExtra = t.extraNavKey ? norm(tNav(t.extraNavKey)) : '';
      return q.includes(localeLabel) || localeLabel.includes(q)
        || (localeExtra && (q.includes(localeExtra) || localeExtra.includes(q)));
    });
  }, [hasQuery, q, parsedQuery, tNav]);

  if (hidden) return null;

  const close = () => { setFocused(false); setQuery(''); };

  const hasAnyResults =
    !!parsedQuery ||
    matchingTags.length > 0 ||
    matchingPueblos.length > 0 ||
    matchingMx.length > 0 ||
    matchingDescubre.length > 0 ||
    matchingTematicas.length > 0;

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
              placeholder={tNav('searchPlaceholder')}
              enterKeyHint="search"
              autoComplete="off"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-9 text-base sm:text-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card/80"
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
                  {/* ── MODO PUEBLO DETECTADO ──────────────────────────────── */}
                  {parsedQuery && (
                    <>
                      {/* Servicios que coinciden con el resto del query */}
                      {matchingServices.length > 0 && (
                        <div>
                          <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Servicios en {parsedQuery.pueblo.nombre}
                          </p>
                          {matchingServices.map((svc) => (
                            <Link
                              key={svc.tipo}
                              href={`/pueblos/${parsedQuery.pueblo.slug}#mapa`}
                              onClick={close}
                              className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                            >
                              <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                style={{ backgroundColor: `${svc.color}20` }}
                              >
                                <MapPin className="h-4 w-4" style={{ color: svc.color }} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {svc.label} en {parsedQuery.pueblo.nombre}
                                </p>
                                <p className="truncate text-[11px] text-muted-foreground">
                                  Ver en el mapa del pueblo
                                </p>
                              </div>
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Sección de pueblo (noticias, meteo…) */}
                      {sectionKeyword && (
                        <div>
                          <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {tNav(sectionKeyword.navKey)}
                          </p>
                          <Link
                            href={sectionKeyword.path(parsedQuery.pueblo.slug)}
                            onClick={close}
                            className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                              <sectionKeyword.icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {tNav(sectionKeyword.navKey)} de {parsedQuery.pueblo.nombre}
                              </p>
                            </div>
                          </Link>
                        </div>
                      )}

                      {/* El pueblo siempre visible para acceder directamente */}
                      <div>
                        <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Pueblo
                        </p>
                        <div>
                          <Link
                            href={`/pueblos/${parsedQuery.pueblo.slug}`}
                            onClick={close}
                            className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                          >
                            {parsedQuery.pueblo.foto ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={parsedQuery.pueblo.foto}
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
                                {parsedQuery.pueblo.nombre}
                                {parsedQuery.pueblo.semaforoEstado &&
                                  SEMAFORO_COLORS[parsedQuery.pueblo.semaforoEstado] && (
                                    <span
                                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                                      style={{ backgroundColor: SEMAFORO_COLORS[parsedQuery.pueblo.semaforoEstado!] }}
                                      title={
                                        parsedQuery.pueblo.semaforoEstado === 'VERDE' ? 'Ideal para visitar'
                                        : parsedQuery.pueblo.semaforoEstado === 'AMARILLO' ? 'Afluencia media'
                                        : parsedQuery.pueblo.semaforoEstado === 'ROJO' ? 'Alta afluencia'
                                        : ''
                                      }
                                    />
                                  )}
                              </p>
                              <p className="truncate text-[11px] text-muted-foreground">
                                {parsedQuery.pueblo.provincia}
                              </p>
                            </div>
                          </Link>
                          <div className="flex flex-wrap gap-1 px-3 pb-2 pl-14">
                            {PUEBLO_QUICK_LINKS.map((sec) => (
                              <Link
                                key={sec.navKey}
                                href={sec.path(parsedQuery.pueblo.slug)}
                                onClick={close}
                                className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                              >
                                <sec.icon className="h-2.5 w-2.5" />
                                {tNav(sec.navKey)}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── MODO BÚSQUEDA GENERAL ──────────────────────────────── */}
                  {!parsedQuery && (
                    <>
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

                      {matchingDescubre.length > 0 && (
                        <div>
                          <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {tNav('sectionColecciones')}
                          </p>
                          {matchingDescubre.map((c) => (
                            <Link
                              key={c.slug}
                              href={`/descubre/${c.slug}`}
                              onClick={close}
                              className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                            >
                              <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                style={{ backgroundColor: `${c.color}20` }}
                              >
                                <Landmark className="h-4 w-4" style={{ color: c.color || '#6b7280' }} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {c.title}
                                </p>
                                {c.count != null && (
                                  <p className="truncate text-[11px] text-muted-foreground">
                                    {c.count} pueblos
                                  </p>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {matchingTematicas.length > 0 && (
                        <div>
                          <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {tNav('sectionTematicas')}
                          </p>
                          {matchingTematicas.map((t) => {
                            const Icon = t.icon;
                            return (
                              <Link
                                key={t.href}
                                href={t.href}
                                onClick={close}
                                className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                              >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                  <Icon className="h-4 w-4 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-foreground">
                                    {tNav(t.navKey)}
                                  </p>
                                  <p className="truncate text-[11px] text-muted-foreground">
                                    {t.href === '/notificaciones'
                                      ? tNav('searchAssocDesc')
                                      : tNav('searchAllVillages')}
                                  </p>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}

                      {matchingMx.length > 0 && (
                        <div>
                          <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {tNav('sectionRutas')}
                          </p>
                          {matchingMx.map((ruta) => (
                            <Link
                              key={ruta.id}
                              href={`/rutas/${ruta.slug}`}
                              onClick={close}
                              className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                                <Landmark className="h-4 w-4 text-amber-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {ruta.titulo}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {matchingPueblos.length > 0 && (
                        <div>
                          <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Pueblos
                          </p>
                          {matchingPueblos.map((p) => (
                            <div key={p.id}>
                              <Link
                                href={`/pueblos/${p.slug}`}
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
                                    {p.nombre}
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
                              <div className="flex flex-wrap gap-1 px-3 pb-2 pl-14">
                                {PUEBLO_QUICK_LINKS.map((sec) => (
                                  <Link
                                    key={sec.navKey}
                                    href={sec.path(p.slug)}
                                    onClick={close}
                                    className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                  >
                                    <sec.icon className="h-2.5 w-2.5" />
                                    {tNav(sec.navKey)}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  {tNav('searchNoResults')} &ldquo;{query}&rdquo;
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
