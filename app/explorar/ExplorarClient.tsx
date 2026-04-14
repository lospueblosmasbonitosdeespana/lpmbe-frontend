'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, MapPin, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { TagIcon } from '@/lib/tag-icon-map';
import {
  FILTER_SLUG_MAP,
  LOCATION_SLUG_MAP,
  filterToSlug,
  locationToSlug,
  type FilterMapping,
  type LocationMapping,
} from '@/lib/explorar-slugs';

type PuebloResult = {
  id: number;
  slug: string;
  nombre: string;
  provincia: string;
  comunidad: string;
  region: string;
  lat: number;
  lng: number;
  foto: string | null;
  caracteristicas: Array<{
    tag: string;
    icono: string;
    color: string;
    nombre_i18n: Record<string, string>;
    nivel: string | null;
    cantidad: number | null;
  }>;
  servicios: string[];
};

type CountItem = {
  tag?: string;
  tipo?: string;
  categoria?: string;
  nombre_i18n?: Record<string, string>;
  icono?: string;
  color?: string;
  count: number;
};

type ExplorarData = {
  pueblos: PuebloResult[];
  total: number;
  filtrosAplicados: any;
  filtrosDisponibles: {
    regiones: Array<{ key: string; count: number }>;
    comunidades: Array<{ nombre: string; count: number }>;
    servicios: Array<{ tipo: string; count: number }>;
  };
};

type CountsData = {
  tags: CountItem[];
  servicios: CountItem[];
  totalPueblos: number;
};

const REGION_LABELS: Record<string, string> = {
  norte: 'Norte',
  sur: 'Sur',
  este: 'Este',
  centro: 'Centro',
};

const SERVICIO_LABELS: Record<string, string> = {
  PARKING: 'Aparcamiento', TURISMO: 'Oficina de turismo', FARMACIA: 'Farmacia',
  HOSPITAL: 'Centro de salud', PARQUE_INFANTIL: 'Parque infantil', LAVABO: 'Lavabos',
  AUTOBUS: 'Autobús', CARAVANAS: 'Caravanas', BANCO: 'Cajero', FUENTE: 'Fuente de agua',
  COCHE_ELECTRICO: 'Cargador EV', PICNIC: 'Picnic', POLICIA: 'Policía',
  SUPERMERCADO: 'Supermercado', GASOLINERA: 'Gasolinera', DESFIBRILADOR: 'Desfibrilador',
  TAXI: 'Taxi', BANO_NATURAL: 'Baño natural', PIPICAN: 'Pipicán', TREN: 'Tren',
  ALQUILER_BICI: 'Alquiler bici', COCHE_ELECTRICO_ULTRA: 'Carga ultra-rápida',
  PLAYA: 'Playa',
};

const CATEGORY_MAP: Record<string, { label: string; emoji: string; order: number }> = {
  PATRIMONIO_MILITAR: { label: 'Patrimonio Militar', emoji: '🏰', order: 0 },
  PATRIMONIO_RELIGIOSO: { label: 'Patrimonio Religioso', emoji: '⛪', order: 1 },
  PATRIMONIO_CIVIL: { label: 'Patrimonio Civil', emoji: '🏛️', order: 2 },
  PATRIMONIO_ARQUEOLOGICO: { label: 'Estilos y Época', emoji: '🎨', order: 3 },
  NATURALEZA: { label: 'Naturaleza', emoji: '🌿', order: 4 },
  GASTRONOMIA: { label: 'Tradición', emoji: '🍷', order: 5 },
  ATMOSFERA: { label: 'Atmósfera', emoji: '✨', order: 6 },
  ACCESIBILIDAD: { label: 'Accesibilidad', emoji: '♿', order: 7 },
};

export default function ExplorarClient({
  initialFilter,
  initialLocation,
}: {
  initialFilter: FilterMapping | null;
  initialLocation: LocationMapping | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<ExplorarData | null>(null);
  const [counts, setCounts] = useState<CountsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [textSearch, setTextSearch] = useState('');
  const [openSection, setOpenSection] = useState<string | null>(null);

  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialFilter?.type === 'tag' ? [initialFilter.key] : [],
  );
  const [selectedServicios, setSelectedServicios] = useState<string[]>(
    initialFilter?.type === 'servicio' ? [initialFilter.key] : [],
  );
  const [selectedRegion, setSelectedRegion] = useState<string | null>(
    initialLocation?.type === 'region' ? initialLocation.key : null,
  );
  const [selectedComunidad, setSelectedComunidad] = useState<string | null>(
    initialLocation?.type === 'comunidad' ? initialLocation.key : null,
  );

  const hasFilters = selectedTags.length > 0 || selectedServicios.length > 0 || selectedRegion || selectedComunidad;

  useEffect(() => {
    fetch('/api/public/explorar/counts').then(r => r.json()).then(setCounts).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    if (selectedServicios.length > 0) params.set('servicios', selectedServicios.join(','));
    if (selectedRegion) params.set('region', selectedRegion);
    if (selectedComunidad) params.set('comunidad', selectedComunidad);

    try {
      const res = await fetch(`/api/public/explorar?${params}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedTags, selectedServicios, selectedRegion, selectedComunidad]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredPueblos = useMemo(() => {
    if (!data?.pueblos) return [];
    if (!textSearch.trim()) return data.pueblos;
    const q = textSearch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return data.pueblos.filter(p => {
      const name = p.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const prov = p.provincia.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return name.includes(q) || prov.includes(q);
    });
  }, [data, textSearch]);

  function toggleTag(tag: string) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    setOpenSection(null);
  }

  function toggleServicio(tipo: string) {
    setSelectedServicios(prev => prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]);
    setOpenSection(null);
  }

  function selectRegion(r: string | null) {
    setSelectedRegion(r);
    setSelectedComunidad(null);
    setOpenSection(null);
  }

  function selectComunidad(c: string | null) {
    setSelectedComunidad(c);
    setSelectedRegion(null);
    setOpenSection(null);
  }

  function clearAll() {
    setSelectedTags([]);
    setSelectedServicios([]);
    setSelectedRegion(null);
    setSelectedComunidad(null);
    setTextSearch('');
  }

  const tagsByCategory = useMemo(() => {
    if (!counts?.tags) return {};
    const grouped: Record<string, CountItem[]> = {};
    for (const t of counts.tags) {
      const cat = t.categoria ?? 'OTRO';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(t);
    }
    return grouped;
  }, [counts]);

  const sortedCategories = useMemo(() => {
    return Object.keys(tagsByCategory).sort(
      (a, b) => (CATEGORY_MAP[a]?.order ?? 99) - (CATEGORY_MAP[b]?.order ?? 99),
    );
  }, [tagsByCategory]);

  function getActiveFilterLabels(): Array<{ key: string; label: string; type: 'tag' | 'servicio' | 'region' | 'comunidad' }> {
    const labels: Array<{ key: string; label: string; type: 'tag' | 'servicio' | 'region' | 'comunidad' }> = [];
    for (const tag of selectedTags) {
      const def = counts?.tags.find(t => t.tag === tag);
      labels.push({ key: tag, label: def?.nombre_i18n?.es ?? tag, type: 'tag' });
    }
    for (const svc of selectedServicios) {
      labels.push({ key: svc, label: SERVICIO_LABELS[svc] ?? svc, type: 'servicio' });
    }
    if (selectedRegion) {
      labels.push({ key: selectedRegion, label: REGION_LABELS[selectedRegion] ?? selectedRegion, type: 'region' });
    }
    if (selectedComunidad) {
      labels.push({ key: selectedComunidad, label: selectedComunidad, type: 'comunidad' });
    }
    return labels;
  }

  function removeFilter(type: string, key: string) {
    if (type === 'tag') setSelectedTags(prev => prev.filter(t => t !== key));
    if (type === 'servicio') setSelectedServicios(prev => prev.filter(t => t !== key));
    if (type === 'region') setSelectedRegion(null);
    if (type === 'comunidad') setSelectedComunidad(null);
  }

  const activeLabels = getActiveFilterLabels();

  return (
    <div className="min-h-[60vh]">
      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={textSearch}
          onChange={e => setTextSearch(e.target.value)}
          placeholder="Buscar pueblo por nombre..."
          className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        />
      </div>

      {/* Filter buttons */}
      <div className="mb-3 flex flex-wrap gap-2">
        {sortedCategories.map(cat => {
          const cfg = CATEGORY_MAP[cat];
          const isOpen = openSection === cat;
          const hasActive = tagsByCategory[cat]?.some(t => selectedTags.includes(t.tag!));
          return (
            <button
              key={cat}
              onClick={() => setOpenSection(isOpen ? null : cat)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                hasActive
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : isOpen
                    ? 'border-primary/30 bg-muted text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/20 hover:text-foreground'
              }`}
            >
              <span>{cfg?.emoji ?? '📋'}</span>
              <span className="hidden sm:inline">{cfg?.label ?? cat}</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          );
        })}

        <button
          onClick={() => setOpenSection(openSection === 'servicios' ? null : 'servicios')}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
            selectedServicios.length > 0
              ? 'border-primary/40 bg-primary/10 text-primary'
              : openSection === 'servicios'
                ? 'border-primary/30 bg-muted text-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/20 hover:text-foreground'
          }`}
        >
          <span>🚗</span>
          <span className="hidden sm:inline">Servicios</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${openSection === 'servicios' ? 'rotate-180' : ''}`} />
        </button>

        <button
          onClick={() => setOpenSection(openSection === 'ubicacion' ? null : 'ubicacion')}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
            selectedRegion || selectedComunidad
              ? 'border-primary/40 bg-primary/10 text-primary'
              : openSection === 'ubicacion'
                ? 'border-primary/30 bg-muted text-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/20 hover:text-foreground'
          }`}
        >
          <MapPin className="h-3 w-3" />
          <span className="hidden sm:inline">Ubicación</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${openSection === 'ubicacion' ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown panels */}
      {openSection && openSection !== 'servicios' && openSection !== 'ubicacion' && tagsByCategory[openSection] && (
        <div className="mb-4 rounded-xl border border-border/60 bg-card p-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-wrap gap-1.5">
            {tagsByCategory[openSection].map(t => {
              const isActive = selectedTags.includes(t.tag!);
              return (
                <button
                  key={t.tag}
                  onClick={() => toggleTag(t.tag!)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all ${
                    isActive
                      ? 'border-primary/40 bg-primary/10 font-semibold text-primary'
                      : 'border-border/60 bg-background text-foreground hover:border-primary/30'
                  }`}
                >
                  {t.icono && <TagIcon name={t.icono} color={t.color ?? '#888'} size={14} />}
                  <span>{t.nombre_i18n?.es ?? t.tag}</span>
                  <span className="text-[10px] text-muted-foreground">({t.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {openSection === 'servicios' && counts?.servicios && (
        <div className="mb-4 rounded-xl border border-border/60 bg-card p-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-wrap gap-1.5">
            {counts.servicios.map(s => {
              const isActive = selectedServicios.includes(s.tipo!);
              return (
                <button
                  key={s.tipo}
                  onClick={() => toggleServicio(s.tipo!)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all ${
                    isActive
                      ? 'border-primary/40 bg-primary/10 font-semibold text-primary'
                      : 'border-border/60 bg-background text-foreground hover:border-primary/30'
                  }`}
                >
                  <span>{SERVICIO_LABELS[s.tipo!] ?? s.tipo}</span>
                  <span className="text-[10px] text-muted-foreground">({s.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {openSection === 'ubicacion' && (
        <div className="mb-4 rounded-xl border border-border/60 bg-card p-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Regiones LPMBE</p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {(['norte', 'sur', 'este', 'centro'] as const).map(r => (
              <button
                key={r}
                onClick={() => selectRegion(selectedRegion === r ? null : r)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${
                  selectedRegion === r
                    ? 'border-primary/40 bg-primary/10 font-semibold text-primary'
                    : 'border-border/60 bg-background text-foreground hover:border-primary/30'
                }`}
              >
                {REGION_LABELS[r]}
              </button>
            ))}
          </div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Comunidades Autónomas</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(LOCATION_SLUG_MAP)
              .filter(([, m]) => m.type === 'comunidad')
              .sort(([, a], [, b]) => a.label_es.localeCompare(b.label_es))
              .map(([slug, m]) => (
                <button
                  key={slug}
                  onClick={() => selectComunidad(selectedComunidad === m.key ? null : m.key)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs transition-all ${
                    selectedComunidad === m.key
                      ? 'border-primary/40 bg-primary/10 font-semibold text-primary'
                      : 'border-border/60 bg-background text-foreground hover:border-primary/30'
                  }`}
                >
                  {m.label_es}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Active filters chips */}
      {activeLabels.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtros:</span>
          {activeLabels.map(f => (
            <span
              key={`${f.type}-${f.key}`}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary"
            >
              {f.label}
              <button onClick={() => removeFilter(f.type, f.key)} className="ml-0.5 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-destructive">
            Limpiar todo
          </button>
        </div>
      )}

      {/* Results count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredPueblos.length}</span>{' '}
          pueblo{filteredPueblos.length !== 1 ? 's' : ''} encontrado{filteredPueblos.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Results grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card">
              <div className="aspect-[16/10] bg-muted" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPueblos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Search className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">No se encontraron pueblos</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Prueba con otros filtros o{' '}
            <button onClick={clearAll} className="text-primary underline">limpia los filtros</button>
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPueblos.map(pueblo => (
            <Link
              key={pueblo.id}
              href={`/pueblos/${pueblo.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                {pueblo.foto ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={pueblo.foto}
                    alt={`${pueblo.nombre}, ${pueblo.provincia}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                    <MapPin className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-3">
                <h3 className="font-display text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary">
                  {pueblo.nombre}
                </h3>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {pueblo.provincia}, {pueblo.comunidad}
                </p>
                {pueblo.caracteristicas.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    {pueblo.caracteristicas.slice(0, 6).map(c => (
                      <span
                        key={c.tag}
                        className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5"
                        style={{ backgroundColor: `${c.color}14` }}
                        title={c.nombre_i18n?.es ?? c.tag}
                      >
                        <TagIcon name={c.icono} color={c.color} size={12} />
                        {c.cantidad && c.cantidad > 1 && (
                          <span className="text-[9px] font-semibold" style={{ color: c.color }}>
                            {c.cantidad}
                          </span>
                        )}
                      </span>
                    ))}
                    {pueblo.caracteristicas.length > 6 && (
                      <span className="text-[9px] text-muted-foreground">+{pueblo.caracteristicas.length - 6}</span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
