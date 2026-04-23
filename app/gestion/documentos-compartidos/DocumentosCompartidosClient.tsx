'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
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
  isDestacadoActivo,
} from '../_lib/documentos';

const ALL_TEMAS = Object.keys(TEMA_ORDENANZA_LABELS) as TemaOrdenanza[];
const TIPOS_SIN_LOGO: TipoDoc[] = ['PAPELERIA', 'ORDENANZA', 'CARTEL', 'MANUAL_WEB', 'OTRO'];

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

function ViewButton({ href, variant = 'default' }: { href: string; variant?: 'default' | 'blue' }) {
  const base = 'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95';
  const styles = variant === 'blue'
    ? `${base} bg-white/80 text-blue-600 ring-1 ring-blue-200 hover:bg-blue-50 hover:ring-blue-300`
    : `${base} bg-white/80 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={styles}>
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
      </svg>
      Ver
    </a>
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

/* ─── Sección colapsable ─── */

type CollapsibleSectionProps = {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  count: number;
  countColor: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

function CollapsibleSection({ icon, iconBg, title, count, countColor, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="overflow-hidden rounded-2xl bg-card ring-1 ring-border/50 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/30"
      >
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm ${iconBg}`}>
          {icon}
        </div>
        <h2 className="flex-1 text-xl font-bold text-foreground">{title}</h2>
        <span className={`rounded-full border px-3 py-0.5 text-xs font-bold ${countColor}`}>{count}</span>
        <div className={`ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${open ? 'bg-primary/10 text-primary rotate-180' : 'bg-muted/60 text-muted-foreground'}`}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="border-t border-border/40 px-4 pb-4 pt-3">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Logo Card ─── */

function LogoCard({ logo }: { logo: LogoAsociacion }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`group overflow-hidden rounded-2xl border-2 transition-all duration-300 ${open ? 'border-blue-300 bg-gradient-to-b from-blue-50/60 to-card shadow-lg shadow-blue-100/50 dark:from-blue-950/30' : 'border-transparent bg-card shadow-sm hover:border-blue-100 hover:shadow-md dark:hover:border-blue-900/60'}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 p-4 text-left transition-colors"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 ring-1 ring-blue-200/60 overflow-hidden">
          <img src={logo.url} alt={logo.nombre} className="h-8 w-8 object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-base text-foreground">{logo.nombre}</p>
          {logo.etiqueta && <p className="mt-0.5 text-sm text-muted-foreground">{logo.etiqueta}</p>}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">LPMBE</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-300">Logo</span>
          </div>
        </div>
        <ChevronIcon open={open} />
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="flex flex-col items-center gap-5 border-t border-blue-100 bg-gradient-to-b from-blue-50/40 to-transparent p-5 dark:border-blue-900/60 dark:from-blue-950/20 sm:flex-row sm:items-start">
            <div className="flex h-36 w-52 shrink-0 items-center justify-center rounded-2xl bg-card p-4 ring-1 ring-blue-100 shadow-inner dark:ring-blue-900/60">
              <img src={logo.url} alt={logo.nombre} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex flex-col gap-2.5 text-center sm:text-left">
              <p className="text-sm font-semibold text-foreground">{logo.nombre}</p>
              {logo.etiqueta && <p className="text-xs text-muted-foreground">{logo.etiqueta}</p>}
              <div className="flex flex-wrap gap-2">
                <ViewButton href={logo.url} variant="blue" />
                <DownloadButton href={logo.url} label="Descargar logo" variant="blue" />
              </div>
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
  const esManualWeb = doc.tipo === 'MANUAL_WEB';

  // Los manuales web navegan a su página de detalle (muestra todos los
  // archivos con previsualización). El resto mantiene el despliegue inline.
  if (esManualWeb) {
    return (
      <Link
        href={`/gestion/manuales/${doc.id}?from=/gestion/documentos-compartidos`}
        className="group flex items-start gap-4 overflow-hidden rounded-2xl border-2 border-transparent bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md dark:hover:border-sky-900/60"
      >
        <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 ring-1 ring-sky-200/60 overflow-hidden dark:from-sky-950/40 dark:to-sky-900/30 dark:ring-sky-800/50">
          <svg className="h-5 w-5 text-sky-700 dark:text-sky-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
            <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-base text-foreground leading-tight transition-colors group-hover:text-sky-900 dark:group-hover:text-sky-100">{doc.nombre}</p>
          {doc.descripcion && (
            <p className="mt-0.5 text-sm text-muted-foreground break-words leading-relaxed line-clamp-2">
              {doc.descripcion}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {doc.fuente === 'ASOCIACION' ? (
              <span className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">LPMBE</span>
            ) : doc.pueblo && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200">{doc.pueblo.nombre}</span>
            )}
            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TIPO_COLORS[doc.tipo]}`}>{TIPO_LABELS[doc.tipo]}</span>
            <span className="text-[11px] text-muted-foreground/70">{new Date(doc.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span className="rounded-full bg-gradient-to-r from-sky-100 to-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 ring-1 ring-sky-200/60 dark:from-sky-950/60 dark:to-sky-900/50 dark:text-sky-200 dark:ring-sky-800/50">
              {todosLosArchivos.length} {todosLosArchivos.length === 1 ? 'archivo' : 'archivos'}
            </span>
          </div>
        </div>
        <span className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-lg bg-sky-600/10 px-2.5 py-1 text-xs font-semibold text-sky-700 transition-colors group-hover:bg-sky-600 group-hover:text-white dark:text-sky-200">
          Abrir
          <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </Link>
    );
  }

  return (
    <div className={`group overflow-hidden rounded-2xl border-2 transition-all duration-300 ${open ? 'border-primary/30 bg-gradient-to-b from-amber-50/40 to-card shadow-lg shadow-amber-100/40 dark:from-amber-950/20' : 'border-transparent bg-card shadow-sm hover:border-amber-100 hover:shadow-md dark:hover:border-amber-900/60'}`}>
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
          <p className="font-semibold text-base text-foreground leading-tight">{doc.nombre}</p>
          {doc.descripcion && (
            <p
              className={`mt-0.5 text-sm text-muted-foreground break-words leading-relaxed ${open ? '' : 'line-clamp-3'}`}
            >
              {doc.descripcion}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {doc.fuente === 'ASOCIACION' ? (
              <span className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">LPMBE</span>
            ) : doc.pueblo && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200">{doc.pueblo.nombre}</span>
            )}
            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TIPO_COLORS[doc.tipo]}`}>{TIPO_LABELS[doc.tipo]}</span>
            <span className="text-[11px] text-muted-foreground/70">{new Date(doc.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {tieneMultiples && (
              <span className="rounded-full bg-gradient-to-r from-violet-100 to-violet-50 px-2 py-0.5 text-[11px] font-bold text-violet-600 ring-1 ring-violet-200/60">
                {todosLosArchivos.length} archivos
              </span>
            )}
          </div>
        </div>
        <ChevronIcon open={open} />
      </button>

      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="divide-y divide-amber-100/60 border-t border-amber-100/80 bg-gradient-to-b from-amber-50/30 to-transparent dark:divide-amber-900/50 dark:border-amber-900/50 dark:from-amber-950/20">
            {todosLosArchivos.map((archivo, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-amber-50/40 dark:hover:bg-amber-950/20">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card ring-1 ring-border shadow-sm">
                  <FileIcon url={archivo.url} />
                </div>
                <span className="flex-1 truncate text-sm text-foreground font-medium">{archivo.nombre}</span>
                {tieneMultiples && (
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {i === 0 ? 'Principal' : `Archivo ${i + 1}`}
                  </span>
                )}
                <div className="flex shrink-0 items-center gap-1.5">
                  <ViewButton href={archivo.url} />
                  <DownloadButton href={archivo.url} />
                </div>
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

  useEffect(() => {
    try { localStorage.setItem('lpmbe_importantesLastSeen', new Date().toISOString()); } catch {}
  }, []);

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
    return logosAsociacion.filter((l) => [l.nombre, l.etiqueta ?? '', 'logo', 'asociacion', 'lpmbe'].join(' ').toLowerCase().includes(q));
  }, [logosAsociacion, query]);

  const showLogos = fuenteFilter === 'TODOS' || fuenteFilter === 'ASOCIACION';
  /** Logos vienen de otra API; solo cuentan en chips cuando la fuente permite verlos. */
  const logoCountVisible = showLogos ? logosAsociacion.length : 0;
  const totalBibliotecaTipoTodos = allDocs.length + logoCountVisible;
  const showDocSections = tipoFilter !== 'LOGO';
  const showLogosSection =
    showLogos && logosFiltered.length > 0 && (tipoFilter === 'TODOS' || tipoFilter === 'LOGO');
  const hasVisibleContent = showLogosSection || (showDocSections && filtered.length > 0);
  const totalVisibleResults =
    tipoFilter === 'LOGO'
      ? logosFiltered.length
      : tipoFilter === 'TODOS'
        ? filtered.length + (showLogos ? logosFiltered.length : 0)
        : filtered.length;

  const ordenanzasPorTema = useMemo(() => {
    const ordenanzas = filtered.filter((d) => d.tipo === 'ORDENANZA');
    return ALL_TEMAS.reduce<Record<TemaOrdenanza, DocumentoItem[]>>((acc, tema) => { acc[tema] = ordenanzas.filter((d) => d.temaOrdenanza === tema); return acc; }, {} as Record<TemaOrdenanza, DocumentoItem[]>);
  }, [filtered]);

  const temasConDocs = ALL_TEMAS.filter((t) => ordenanzasPorTema[t].length > 0);
  const docsNoOrdenanza = filtered.filter((d) => d.tipo !== 'ORDENANZA');
  const docsOrdenanza = filtered.filter((d) => d.tipo === 'ORDENANZA');
  const docsManualWeb = filtered.filter((d) => d.tipo === 'MANUAL_WEB');

  const docsDestacados = useMemo(() => allDocs.filter(isDestacadoActivo), [allDocs]);

  const hasActiveFilters = query || tipoFilter !== 'TODOS' || fuenteFilter !== 'TODOS' || temaFilter !== 'TODOS';

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
      {/* ── Hero header ── */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 text-white shadow-xl" style={{ background: 'linear-gradient(135deg, #a0705a 0%, #b8856d 40%, #c49a82 100%)' }}>
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-white/6 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm shadow-inner">
                <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">Biblioteca compartida</h1>
            </div>
            <p className="mt-3 max-w-xl text-base text-white/75 leading-relaxed">
              Papelería, ordenanzas, carteles, logotipos y documentación compartida entre los ayuntamientos y la asociación. Filtra, busca y descarga lo que necesites.
            </p>
          </div>
          <button type="button" onClick={fetchDocs}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition-all hover:bg-white/25 hover:ring-white/40 active:scale-95 shadow-sm">
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
              <p className="mt-2 text-sm font-medium text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Buscador + filtros ── */}
      <div className="space-y-4 rounded-2xl bg-card p-5 ring-1 ring-border/60 shadow-sm">
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-300">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <input
            type="search"
            placeholder="Buscar por nombre, pueblo, tipo, temática…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border-0 bg-slate-50 py-3.5 pl-14 pr-4 text-base font-medium placeholder:text-muted-foreground/50 ring-1 ring-slate-200 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 dark:bg-slate-900 dark:ring-slate-700 dark:focus:bg-slate-800"
          />
        </div>

        {/* Filtros de tipo */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</span>
          {(['TODOS', ...Object.keys(TIPO_LABELS)] as const).map((t) => {
            const active = tipoFilter === t;
            return (
              <button key={t} type="button" onClick={() => setTipoFilter(t as typeof tipoFilter)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${active ? 'text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100'}`}
                style={active ? { background: 'linear-gradient(to right, #a0705a, #b8856d)' } : undefined}>
                {t === 'TODOS'
                  ? `Todos (${totalBibliotecaTipoTodos})`
                  : t === 'LOGO'
                    ? `${TIPO_LABELS.LOGO} (${logoCountVisible})`
                    : `${TIPO_LABELS[t as TipoDoc]} (${stats.porTipo[t] ?? 0})`}
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
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${active ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm shadow-blue-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100'}`}>
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
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${temaFilter === 'TODOS' ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm shadow-violet-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
              Todas
            </button>
            {ALL_TEMAS.filter((t) => (ordenanzasPorTema[t]?.length ?? 0) > 0 || temaFilter === t).map((t) => (
              <button key={t} type="button" onClick={() => setTemaFilter(t === temaFilter ? 'TODOS' : t)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${temaFilter === t ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm shadow-violet-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
                {TEMA_ORDENANZA_ICONS[t]} {TEMA_ORDENANZA_LABELS[t]}
              </button>
            ))}
          </div>
        )}

        {hasActiveFilters && (
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs font-medium text-muted-foreground">
              {totalVisibleResults} resultado{totalVisibleResults !== 1 ? 's' : ''}
            </span>
            <button type="button" onClick={() => { setQuery(''); setTipoFilter('TODOS'); setFuenteFilter('TODOS'); setTemaFilter('TODOS'); }}
              className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 ring-1 ring-rose-200 transition-all hover:bg-rose-100 active:scale-95 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-800">
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* ── Loading / Error / Empty ── */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-stone-200" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-stone-500 animate-spin" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Cargando biblioteca...</p>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-rose-50 to-red-50 px-5 py-4 ring-1 ring-rose-200 dark:from-rose-950/20 dark:to-red-950/20 dark:ring-rose-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100">
              <svg className="h-5 w-5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            </div>
            <span className="text-sm font-medium text-rose-700">{error}</span>
          </div>
          <button type="button" onClick={fetchDocs} className="shrink-0 rounded-xl bg-card px-4 py-2 text-xs font-semibold text-rose-600 ring-1 ring-rose-200 transition-all hover:bg-rose-50 active:scale-95 dark:text-rose-300 dark:ring-rose-800 dark:hover:bg-rose-950/30">Reintentar</button>
        </div>
      )}

      {!loading && !hasVisibleContent && (
        <div className="rounded-3xl bg-gradient-to-br from-slate-50 to-card p-16 text-center ring-1 ring-slate-100 dark:from-slate-900/40 dark:ring-slate-800">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 shadow-inner dark:from-slate-800 dark:to-slate-900">
            <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-semibold text-foreground">No hay documentos que coincidan</p>
          <p className="mt-1.5 text-sm text-muted-foreground">Prueba a cambiar los filtros o la búsqueda.</p>
        </div>
      )}

      {/* ── SECCIÓN DOCUMENTOS IMPORTANTES ── */}
      {!loading && docsDestacados.length > 0 && (
        <section className="overflow-hidden rounded-2xl border-2 border-red-400 bg-gradient-to-b from-red-50 to-card shadow-lg shadow-red-100/50 dark:from-red-950/20 dark:shadow-none">
          <div className="flex items-center gap-3 bg-red-500 px-5 py-3 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">Lectura importante</h2>
              <p className="text-sm text-white/80">La asociación ha marcado estos documentos como lectura obligatoria</p>
            </div>
            <span className="rounded-full bg-white/20 px-3 py-0.5 text-sm font-bold">{docsDestacados.length}</span>
          </div>
          <div className="divide-y divide-red-100 p-3">
            {docsDestacados.map((doc) => (
              <div key={doc.id} className="py-2">
                <DocCard doc={doc} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SECCIÓN MANUAL Y AYUDA DE LA WEB ── */}
      {!loading && showDocSections && docsManualWeb.length > 0 && (
        <CollapsibleSection
          iconBg="bg-gradient-to-br from-sky-500 to-sky-600 shadow-sky-200"
          icon={<svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg>}
          title="Manual y ayuda de la web"
          count={docsManualWeb.length}
          countColor="bg-sky-100 text-sky-700 border-sky-200"
          defaultOpen={true}
        >
          <div className="flex flex-col gap-2">
            {docsManualWeb.map((doc) => <DocCard key={doc.id} doc={doc} />)}
          </div>
        </CollapsibleSection>
      )}

      {/* ── SECCIÓN LOGOS DE LA ASOCIACIÓN ── */}
      {!loading && showLogosSection && (
        <CollapsibleSection
          iconBg="bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-200"
          icon={<svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>}
          title="Logos de la Asociación"
          count={logosFiltered.length}
          countColor="bg-blue-100 text-blue-700 border-blue-200"
        >
          <div className="flex flex-col gap-2">
            {logosFiltered.map((logo) => <LogoCard key={logo.id} logo={logo} />)}
          </div>
        </CollapsibleSection>
      )}

      {/* ── SECCIÓN OTROS DOCUMENTOS ── */}
      {!loading && showDocSections && docsNoOrdenanza.length > 0 && (
        <div className="space-y-3">
          {TIPOS_SIN_LOGO.filter((t) => t !== 'MANUAL_WEB' && docsNoOrdenanza.filter(d => d.tipo === t).length > 0).map((tipo) => {
            const grupo = docsNoOrdenanza.filter((d) => d.tipo === tipo);
            if (grupo.length === 0) return null;
            const esAsociacion = grupo.every((d) => d.fuente === 'ASOCIACION');
            const iconoTipo = tipo === 'CARTEL'
              ? <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v4H3z" /><path d="M6 7v14" /><path d="M18 7v14" /></svg>
              : <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
            return (
              <CollapsibleSection
                key={tipo}
                iconBg={esAsociacion ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-200' : 'bg-gradient-to-br from-slate-500 to-slate-600 shadow-slate-200'}
                icon={iconoTipo}
                title={TIPO_LABELS[tipo]}
                count={grupo.length}
                countColor={TIPO_COLORS[tipo]}
              >
                <div className="flex flex-col gap-2">
                  {grupo.map((doc) => <DocCard key={doc.id} doc={doc} />)}
                </div>
              </CollapsibleSection>
            );
          })}
        </div>
      )}

      {/* ── SECCIÓN ORDENANZAS ── */}
      {!loading && showDocSections && docsOrdenanza.length > 0 && (
        <CollapsibleSection
          iconBg="bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-200"
          icon={<svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>}
          title="Ordenanzas"
          count={docsOrdenanza.length}
          countColor="bg-amber-100 text-amber-700 border-amber-200"
          defaultOpen={true}
        >
          <div className="mb-4 flex justify-end">
            {temaFilter === 'TODOS' && (
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs ring-1 ring-slate-200/60 dark:bg-slate-800 dark:ring-slate-700">
                <button type="button" onClick={() => setVistaOrdenanza('tema')}
                  className={`rounded-lg px-3.5 py-1.5 font-semibold transition-all duration-200 ${vistaOrdenanza === 'tema' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  Por temática
                </button>
                <button type="button" onClick={() => setVistaOrdenanza('lista')}
                  className={`rounded-lg px-3.5 py-1.5 font-semibold transition-all duration-200 ${vistaOrdenanza === 'lista' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
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
                  <div key={tema} className="overflow-hidden rounded-2xl ring-1 ring-amber-200/60 shadow-sm dark:ring-amber-900/50">
                    <div className="flex items-center gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 via-amber-50/80 to-orange-50/50 px-6 py-4 dark:border-amber-900/50 dark:from-amber-950/20 dark:via-amber-950/10 dark:to-orange-950/10">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-xl shadow-sm ring-1 ring-amber-200/60 dark:ring-amber-900/50">{TEMA_ORDENANZA_ICONS[tema]}</span>
                      <div>
                        <h3 className="font-bold text-base text-foreground">{TEMA_ORDENANZA_LABELS[tema]}</h3>
                        <p className="text-sm font-medium text-amber-600/70 dark:text-amber-300/80">{grupo.length} ordenanza{grupo.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 bg-card p-4">
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
        </CollapsibleSection>
      )}
    </div>
  );
}
