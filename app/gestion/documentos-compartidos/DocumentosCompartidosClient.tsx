'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  TipoDoc,
  TemaOrdenanza,
  TIPO_LABELS,
  TIPO_COLORS,
  TEMA_ORDENANZA_LABELS,
  TEMA_ORDENANZA_ICONS,
  DocumentoItem,
  isImageUrl,
  isPdfUrl,
} from '../_lib/documentos';

const ALL_TEMAS = Object.keys(TEMA_ORDENANZA_LABELS) as TemaOrdenanza[];
const TIPOS_SIN_LOGO: TipoDoc[] = ['PAPELERIA', 'ORDENANZA', 'OTRO'];

type LogoAsociacion = {
  id: number;
  nombre: string;
  url: string;
  etiqueta: string | null;
};

/* ─── Iconos con más personalidad ─── */

function FileIcon({ url, size = 'sm' }: { url: string; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'h-6 w-6' : 'h-4 w-4';
  if (isImageUrl(url)) return (
    <svg className={`${cls} text-sky-500`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  );
  if (isPdfUrl(url)) return (
    <svg className={`${cls} text-rose-500`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="15" x2="15" y2="15" /><line x1="9" y1="11" x2="11" y2="11" />
    </svg>
  );
  return (
    <svg className={`${cls} text-slate-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function DownloadButton({ href, label = 'Descargar', variant = 'default' }: { href: string; label?: string; variant?: 'default' | 'blue' }) {
  const base = 'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95';
  const styles = variant === 'blue'
    ? `${base} bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm shadow-blue-200 hover:shadow-md hover:shadow-blue-200 hover:from-blue-600 hover:to-blue-700`
    : `${base} bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-200 hover:shadow-md hover:shadow-amber-200 hover:from-amber-600 hover:to-amber-700`;
  return (
    <a href={href} download target="_blank" rel="noopener noreferrer" className={styles}>
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {label}
    </a>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${open ? 'bg-primary/10 text-primary rotate-180' : 'bg-muted/60 text-muted-foreground'}`}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}

/* ─── Logo Card ─── */

function LogoCard({ logo }: { logo: LogoAsociacion }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`group overflow-hidden rounded-2xl border-2 transition-all duration-300 ${open ? 'border-blue-300 bg-gradient-to-b from-blue-50/60 to-white shadow-lg shadow-blue-100/50' : 'border-transparent bg-white shadow-sm hover:shadow-md hover:border-blue-100'}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 p-4 text-left transition-colors"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 ring-1 ring-blue-200/60 overflow-hidden">
          <img src={logo.url} alt={logo.nombre} className="h-8 w-8 object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-foreground">{logo.nombre}</p>
          {logo.etiqueta && <p className="mt-0.5 text-xs text-muted-foreground">{logo.etiqueta}</p>}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">LPBME</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">Logo</span>
          </div>
        </div>
        <ChevronIcon open={open} />
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="border-t border-blue-100 bg-gradient-to-b from-blue-50/40 to-transparent p-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div className="flex h-36 w-52 shrink-0 items-center justify-center rounded-2xl bg-white p-4 ring-1 ring-blue-100 shadow-inner">
              <img src={logo.url} alt={logo.nombre} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex flex-col gap-2.5 text-center sm:text-left">
              <p className="text-sm font-semibold text-foreground">{logo.nombre}</p>
              {logo.etiqueta && <p className="text-xs text-muted-foreground">{logo.etiqueta}</p>}
              <DownloadButton href={logo.url} label="Descargar logo" variant="blue" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Doc Card ─── */

function DocCard({ doc }: { doc: DocumentoItem }) {
  const [open, setOpen] = useState(false);
  const todosLosArchivos = [
    { url: doc.url, nombre: doc.nombre },
    ...(doc.archivosAdicionales ?? []),
  ];
  const tieneMultiples = todosLosArchivos.length > 1;

  return (
    <div className={`group overflow-hidden rounded-2xl border-2 transition-all duration-300 ${open ? 'border-primary/30 bg-gradient-to-b from-amber-50/40 to-white shadow-lg shadow-amber-100/40' : 'border-transparent bg-white shadow-sm hover:shadow-md hover:border-amber-100'}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-4 p-4 text-left transition-colors"
      >
        <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 ring-1 ring-amber-200/60 overflow-hidden">
          {isImageUrl(doc.url) ? (
            <img src={doc.url} alt={doc.nombre} className="h-8 w-8 object-contain" />
          ) : (
            <FileIcon url={doc.url} size="md" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-foreground leading-tight">{doc.nombre}</p>
          {doc.descripcion && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{doc.descripcion}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {doc.fuente === 'ASOCIACION' ? (
              <span className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">LPBME</span>
            ) : doc.pueblo && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">{doc.pueblo.nombre}</span>
            )}
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${TIPO_COLORS[doc.tipo]}`}>{TIPO_LABELS[doc.tipo]}</span>
            <span className="text-[10px] text-muted-foreground/70">{new Date(doc.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {tieneMultiples && (
              <span className="rounded-full bg-gradient-to-r from-violet-100 to-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-600 ring-1 ring-violet-200/60">
                {todosLosArchivos.length} archivos
              </span>
            )}
          </div>
        </div>
        <ChevronIcon open={open} />
      </button>

      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="border-t border-amber-100/80 bg-gradient-to-b from-amber-50/30 to-transparent divide-y divide-amber-100/60">
            {todosLosArchivos.map((archivo, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-amber-50/40 transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-border shadow-sm">
                  <FileIcon url={archivo.url} />
                </div>
                <span className="flex-1 truncate text-sm text-foreground font-medium">{archivo.nombre}</span>
                {tieneMultiples && (
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {i === 0 ? 'Principal' : `Archivo ${i + 1}`}
                  </span>
                )}
                <DownloadButton href={archivo.url} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Componente principal ─── */

export default function DocumentosCompartidosClient() {
  const [allDocs, setAllDocs] = useState<DocumentoItem[]>([]);
  const [logosAsociacion, setLogosAsociacion] = useState<LogoAsociacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState<TipoDoc | 'TODOS'>('TODOS');
  const [temaFilter, setTemaFilter] = useState<TemaOrdenanza | 'TODOS'>('TODOS');
  const [fuenteFilter, setFuenteFilter] = useState<'TODOS' | 'PUEBLO' | 'ASOCIACION'>('TODOS');
  const [vistaOrdenanza, setVistaOrdenanza] = useState<'tema' | 'lista'>('tema');

  const fetchDocs = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [docsRes, logosRes] = await Promise.all([
        fetch('/api/admin/documentos-pueblo?compartidos=true', { cache: 'no-store' }),
        fetch('/api/admin/logos?compartidos=true', { cache: 'no-store' }),
      ]);
      if (docsRes.status === 401) { window.location.href = '/entrar'; return; }
      if (!docsRes.ok) throw new Error(`Error ${docsRes.status}`);
      const docsData = await docsRes.json();
      setAllDocs(Array.isArray(docsData) ? docsData : []);
      if (logosRes.ok) {
        const logosData = await logosRes.json();
        setLogosAsociacion(Array.isArray(logosData) ? logosData : []);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return allDocs.filter((d) => {
      if (tipoFilter !== 'TODOS' && d.tipo !== tipoFilter) return false;
      if (fuenteFilter !== 'TODOS' && d.fuente !== fuenteFilter) return false;
      if (temaFilter !== 'TODOS' && d.temaOrdenanza !== temaFilter) return false;
      if (q) {
        const haystack = [d.nombre, d.descripcion ?? '', d.pueblo?.nombre ?? '', TIPO_LABELS[d.tipo], d.temaOrdenanza ? TEMA_ORDENANZA_LABELS[d.temaOrdenanza] : '', d.fuente === 'ASOCIACION' ? 'asociacion' : ''].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [allDocs, query, tipoFilter, fuenteFilter, temaFilter]);

  const stats = useMemo(() => {
    const porTipo = (Object.keys(TIPO_LABELS) as TipoDoc[]).reduce<Record<string, number>>((a, t) => { a[t] = allDocs.filter((d) => d.tipo === t).length; return a; }, {});
    const pueblosUnicos = new Set(allDocs.filter(d => d.puebloId).map(d => d.puebloId)).size;
    return { porTipo, pueblosUnicos };
  }, [allDocs]);

  const logosFiltered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return logosAsociacion;
    return logosAsociacion.filter((l) => [l.nombre, l.etiqueta ?? '', 'logo', 'asociacion', 'lpbme'].join(' ').toLowerCase().includes(q));
  }, [logosAsociacion, query]);

  const showLogos = fuenteFilter === 'TODOS' || fuenteFilter === 'ASOCIACION';

  const ordenanzasPorTema = useMemo(() => {
    const ordenanzas = filtered.filter((d) => d.tipo === 'ORDENANZA');
    return ALL_TEMAS.reduce<Record<TemaOrdenanza, DocumentoItem[]>>((acc, tema) => { acc[tema] = ordenanzas.filter((d) => d.temaOrdenanza === tema); return acc; }, {} as Record<TemaOrdenanza, DocumentoItem[]>);
  }, [filtered]);

  const temasConDocs = ALL_TEMAS.filter((t) => ordenanzasPorTema[t].length > 0);
  const docsNoOrdenanza = filtered.filter((d) => d.tipo !== 'ORDENANZA');
  const docsOrdenanza = filtered.filter((d) => d.tipo === 'ORDENANZA');

  const hasActiveFilters = query || tipoFilter !== 'TODOS' || fuenteFilter !== 'TODOS' || temaFilter !== 'TODOS';

  return (
    <div className="space-y-8">
      {/* ── Hero header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-amber-500 to-orange-500 p-8 text-white shadow-xl shadow-amber-200/40">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner">
                <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Biblioteca compartida</h1>
            </div>
            <p className="mt-2 max-w-xl text-sm text-white/80 leading-relaxed">
              Papelería, ordenanzas, logotipos y documentación compartida entre los ayuntamientos y la asociación. Filtra, busca y descarga lo que necesites.
            </p>
          </div>
          <button type="button" onClick={fetchDocs}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 transition-all hover:bg-white/30 hover:ring-white/50 active:scale-95 shadow-sm">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Actualizar
          </button>
        </div>
      </div>

      {/* ── Estadísticas ── */}
      {!loading && (allDocs.length > 0 || logosAsociacion.length > 0) && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total en biblioteca', value: allDocs.length + logosAsociacion.length, icon: '📚', gradient: 'from-slate-50 to-white', ring: 'ring-slate-200/60' },
            { label: 'Logos asociación', value: logosAsociacion.length, icon: '🎨', gradient: 'from-blue-50 to-white', ring: 'ring-blue-200/60' },
            { label: 'Pueblos participantes', value: stats.pueblosUnicos, icon: '🏘️', gradient: 'from-emerald-50 to-white', ring: 'ring-emerald-200/60' },
            { label: 'Ordenanzas', value: stats.porTipo['ORDENANZA'] ?? 0, icon: '📜', gradient: 'from-amber-50 to-white', ring: 'ring-amber-200/60' },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl bg-gradient-to-br ${s.gradient} p-5 ring-1 ${s.ring} shadow-sm transition-shadow hover:shadow-md`}>
              <div className="flex items-center justify-between">
                <span className="text-2xl">{s.icon}</span>
                <p className="text-3xl font-bold text-foreground">{s.value}</p>
              </div>
              <p className="mt-2 text-xs font-medium text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Buscador + filtros ── */}
      <div className="rounded-2xl bg-white p-5 ring-1 ring-border/60 shadow-sm space-y-4">
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <input
            type="search"
            placeholder="Buscar por nombre, pueblo, tipo, temática…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border-0 bg-slate-50 py-3 pl-14 pr-4 text-sm font-medium placeholder:text-muted-foreground/50 ring-1 ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
          />
        </div>

        {/* Filtros de tipo */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</span>
          {(['TODOS', ...Object.keys(TIPO_LABELS)] as const).map((t) => {
            const active = tipoFilter === t;
            return (
              <button key={t} type="button" onClick={() => setTipoFilter(t as typeof tipoFilter)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 ${active ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}>
                {t === 'TODOS' ? `Todos (${allDocs.length})` : `${TIPO_LABELS[t as TipoDoc]} (${stats.porTipo[t] ?? 0})`}
              </button>
            );
          })}
        </div>

        {/* Filtros de fuente */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fuente</span>
          {([['TODOS', 'Todos'], ['PUEBLO', 'Ayuntamientos'], ['ASOCIACION', 'Asociación']] as const).map(([v, l]) => {
            const active = fuenteFilter === v;
            return (
              <button key={v} type="button" onClick={() => setFuenteFilter(v)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 ${active ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm shadow-blue-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}>
                {l}
              </button>
            );
          })}
        </div>

        {/* Filtros temáticos */}
        {(tipoFilter === 'ORDENANZA' || tipoFilter === 'TODOS') && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Temática</span>
            <button type="button" onClick={() => setTemaFilter('TODOS')}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 ${temaFilter === 'TODOS' ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm shadow-violet-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              Todas
            </button>
            {ALL_TEMAS.filter((t) => (ordenanzasPorTema[t]?.length ?? 0) > 0 || temaFilter === t).map((t) => (
              <button key={t} type="button" onClick={() => setTemaFilter(t === temaFilter ? 'TODOS' : t)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 ${temaFilter === t ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm shadow-violet-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {TEMA_ORDENANZA_ICONS[t]} {TEMA_ORDENANZA_LABELS[t]}
              </button>
            ))}
          </div>
        )}

        {hasActiveFilters && (
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs font-medium text-muted-foreground">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
            <button type="button" onClick={() => { setQuery(''); setTipoFilter('TODOS'); setFuenteFilter('TODOS'); setTemaFilter('TODOS'); }}
              className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 ring-1 ring-rose-200 transition-all hover:bg-rose-100 active:scale-95">
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* ── Loading / Error / Empty ── */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-amber-200" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-500 animate-spin" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Cargando biblioteca...</p>
        </div>
      )}
      {error && (
        <div className="rounded-2xl bg-gradient-to-r from-rose-50 to-red-50 px-5 py-4 ring-1 ring-rose-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100">
              <svg className="h-5 w-5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            </div>
            <span className="text-sm font-medium text-rose-700">{error}</span>
          </div>
          <button type="button" onClick={fetchDocs} className="shrink-0 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-rose-600 ring-1 ring-rose-200 transition-all hover:bg-rose-50 active:scale-95">Reintentar</button>
        </div>
      )}

      {!loading && filtered.length === 0 && logosFiltered.length === 0 && (
        <div className="rounded-3xl bg-gradient-to-br from-slate-50 to-white p-16 text-center ring-1 ring-slate-100">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 shadow-inner">
            <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-semibold text-foreground">No hay documentos que coincidan</p>
          <p className="mt-1.5 text-sm text-muted-foreground">Prueba a cambiar los filtros o la búsqueda.</p>
        </div>
      )}

      {/* ── SECCIÓN LOGOS DE LA ASOCIACIÓN ── */}
      {!loading && showLogos && logosFiltered.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm shadow-blue-200">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
            </div>
            <h2 className="text-lg font-bold text-foreground">Logos de la Asociación</h2>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">{logosFiltered.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {logosFiltered.map((logo) => <LogoCard key={logo.id} logo={logo} />)}
          </div>
        </section>
      )}

      {/* ── SECCIÓN OTROS DOCUMENTOS ── */}
      {!loading && docsNoOrdenanza.length > 0 && (
        <div className="space-y-6">
          {TIPOS_SIN_LOGO.filter((t) => docsNoOrdenanza.filter(d => d.tipo === t).length > 0).map((tipo) => {
            const grupo = docsNoOrdenanza.filter((d) => d.tipo === tipo);
            if (grupo.length === 0) return null;
            return (
              <section key={tipo}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm shadow-emerald-200">
                    <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  </div>
                  <h2 className="text-lg font-bold text-foreground">{TIPO_LABELS[tipo]}</h2>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${TIPO_COLORS[tipo]}`}>{grupo.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {grupo.map((doc) => <DocCard key={doc.id} doc={doc} />)}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* ── SECCIÓN ORDENANZAS ── */}
      {!loading && docsOrdenanza.length > 0 && (
        <section>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-sm shadow-amber-200">
                <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
              </div>
              <h2 className="text-lg font-bold text-foreground">Ordenanzas</h2>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">{docsOrdenanza.length}</span>
            </div>
            {temaFilter === 'TODOS' && (
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs ring-1 ring-slate-200/60">
                <button type="button" onClick={() => setVistaOrdenanza('tema')}
                  className={`rounded-lg px-3.5 py-1.5 font-semibold transition-all duration-200 ${vistaOrdenanza === 'tema' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  Por temática
                </button>
                <button type="button" onClick={() => setVistaOrdenanza('lista')}
                  className={`rounded-lg px-3.5 py-1.5 font-semibold transition-all duration-200 ${vistaOrdenanza === 'lista' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  Lista
                </button>
              </div>
            )}
          </div>

          {vistaOrdenanza === 'tema' && temaFilter === 'TODOS' ? (
            <div className="space-y-6">
              {temasConDocs.map((tema) => {
                const grupo = ordenanzasPorTema[tema];
                return (
                  <div key={tema} className="overflow-hidden rounded-2xl ring-1 ring-amber-200/60 shadow-sm">
                    <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 via-amber-50/80 to-orange-50/50 px-6 py-4 border-b border-amber-100">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm ring-1 ring-amber-200/60">{TEMA_ORDENANZA_ICONS[tema]}</span>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">{TEMA_ORDENANZA_LABELS[tema]}</h3>
                        <p className="text-xs text-amber-600/70 font-medium">{grupo.length} ordenanza{grupo.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 bg-white p-4">
                      {grupo.map((doc) => <DocCard key={doc.id} doc={doc} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {docsOrdenanza.map((doc) => <DocCard key={doc.id} doc={doc} />)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
