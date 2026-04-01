'use client';

import { useEffect, useMemo, useState } from 'react';
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

function FileIcon({ url }: { url: string }) {
  if (isImageUrl(url)) return (
    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  );
  if (isPdfUrl(url)) return (
    <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="15" x2="15" y2="15" /><line x1="9" y1="11" x2="11" y2="11" />
    </svg>
  );
  return (
    <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function DocCard({ doc }: { doc: DocumentoItem }) {
  const srcLabel = doc.fuente === 'ASOCIACION' ? 'Asociación LPBME' : (doc.pueblo?.nombre ?? '');
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-background p-4 transition hover:shadow-sm">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60 overflow-hidden">
        {isImageUrl(doc.url) ? (
          <img src={doc.url} alt={doc.nombre} className="h-full w-full object-contain" />
        ) : (
          <FileIcon url={doc.url} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm leading-tight">{doc.nombre}</p>
        {doc.descripcion && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{doc.descripcion}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {doc.fuente === 'ASOCIACION' ? (
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Asociación LPBME</span>
          ) : doc.pueblo && (
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{doc.pueblo.nombre}</span>
          )}
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${TIPO_COLORS[doc.tipo]}`}>{TIPO_LABELS[doc.tipo]}</span>
          <span className="text-[10px] text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>
      <a href={doc.url} download target="_blank" rel="noopener noreferrer"
        title={`Descargar de ${srcLabel}`}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Descargar
      </a>
    </div>
  );
}

export default function DocumentosCompartidosClient() {
  const [allDocs, setAllDocs] = useState<DocumentoItem[]>([]);
  const [logosAsociacion, setLogosAsociacion] = useState<LogoAsociacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [query, setQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState<TipoDoc | 'TODOS'>('TODOS');
  const [temaFilter, setTemaFilter] = useState<TemaOrdenanza | 'TODOS'>('TODOS');
  const [fuenteFilter, setFuenteFilter] = useState<'TODOS' | 'PUEBLO' | 'ASOCIACION'>('TODOS');
  const [vistaOrdenanza, setVistaOrdenanza] = useState<'tema' | 'lista'>('tema');

  async function fetchDocs() {
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
  }

  useEffect(() => { fetchDocs(); }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return allDocs.filter((d) => {
      if (tipoFilter !== 'TODOS' && d.tipo !== tipoFilter) return false;
      if (fuenteFilter !== 'TODOS' && d.fuente !== fuenteFilter) return false;
      if (temaFilter !== 'TODOS' && d.temaOrdenanza !== temaFilter) return false;
      if (q) {
        const haystack = [
          d.nombre,
          d.descripcion ?? '',
          d.pueblo?.nombre ?? '',
          TIPO_LABELS[d.tipo],
          d.temaOrdenanza ? TEMA_ORDENANZA_LABELS[d.temaOrdenanza] : '',
          d.fuente === 'ASOCIACION' ? 'asociacion' : '',
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [allDocs, query, tipoFilter, fuenteFilter, temaFilter]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = allDocs.length;
    const porTipo = (Object.keys(TIPO_LABELS) as TipoDoc[]).reduce<Record<string, number>>((a, t) => {
      a[t] = allDocs.filter((d) => d.tipo === t).length;
      return a;
    }, {});
    const deAsociacion = allDocs.filter((d) => d.fuente === 'ASOCIACION').length;
    const pueblosUnicos = new Set(allDocs.filter(d => d.puebloId).map(d => d.puebloId)).size;
    return { total, porTipo, deAsociacion, pueblosUnicos };
  }, [allDocs]);

  // Logos de la asociación filtrados por búsqueda
  const logosFiltered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return logosAsociacion;
    return logosAsociacion.filter((l) =>
      [l.nombre, l.etiqueta ?? '', 'logo', 'asociacion', 'lpbme'].join(' ').toLowerCase().includes(q)
    );
  }, [logosAsociacion, query]);

  // Mostrar sección de logos si no hay filtros que la excluyan
  const showLogos = fuenteFilter === 'TODOS' || fuenteFilter === 'ASOCIACION';

  const ordenanzasPorTema = useMemo(() => {
    const ordenanzas = filtered.filter((d) => d.tipo === 'ORDENANZA');
    return ALL_TEMAS.reduce<Record<TemaOrdenanza, DocumentoItem[]>>((acc, tema) => {
      acc[tema] = ordenanzas.filter((d) => d.temaOrdenanza === tema);
      return acc;
    }, {} as Record<TemaOrdenanza, DocumentoItem[]>);
  }, [filtered]);

  const temasConDocs = ALL_TEMAS.filter((t) => ordenanzasPorTema[t].length > 0);

  const docsNoOrdenanza = filtered.filter((d) => d.tipo !== 'ORDENANZA');
  const docsOrdenanza = filtered.filter((d) => d.tipo === 'ORDENANZA');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Biblioteca de documentos compartidos</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Papelería, ordenanzas, recursos gráficos y documentación que los ayuntamientos y la asociación han compartido con toda la red. Puedes filtrar, buscar y descargar cualquier documento.
          </p>
        </div>
        <button type="button" onClick={fetchDocs}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Actualizar
        </button>
      </div>

      {/* Estadísticas */}
      {!loading && (allDocs.length > 0 || logosAsociacion.length > 0) && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total documentos', value: stats.total, color: 'text-foreground' },
            { label: 'Logos asociación', value: logosAsociacion.length, color: 'text-blue-600' },
            { label: 'Pueblos participantes', value: stats.pueblosUnicos, color: 'text-foreground' },
            { label: 'Ordenanzas', value: stats.porTipo['ORDENANZA'] ?? 0, color: 'text-amber-600' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Buscador + filtros */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Buscar por nombre, pueblo, tipo, temática…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-border py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-muted-foreground">Tipo:</span>
          {(['TODOS', ...Object.keys(TIPO_LABELS)] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTipoFilter(t as typeof tipoFilter)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${tipoFilter === t ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
              {t === 'TODOS' ? `Todos (${allDocs.length})` : `${TIPO_LABELS[t as TipoDoc]} (${stats.porTipo[t] ?? 0})`}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-muted-foreground">Fuente:</span>
          {([['TODOS', 'Todos'], ['PUEBLO', 'Ayuntamientos'], ['ASOCIACION', 'Asociación']] as const).map(([v, l]) => (
            <button key={v} type="button" onClick={() => setFuenteFilter(v)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${fuenteFilter === v ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
              {l}
            </button>
          ))}
        </div>
        {(tipoFilter === 'ORDENANZA' || tipoFilter === 'TODOS') && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-medium text-muted-foreground">Temática:</span>
            <button type="button" onClick={() => setTemaFilter('TODOS')}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${temaFilter === 'TODOS' ? 'border-amber-500 bg-amber-500 text-white' : 'border-border text-muted-foreground hover:border-amber-400'}`}>
              Todas
            </button>
            {ALL_TEMAS.filter((t) => (ordenanzasPorTema[t]?.length ?? 0) > 0 || temaFilter === t).map((t) => (
              <button key={t} type="button" onClick={() => setTemaFilter(t === temaFilter ? 'TODOS' : t)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${temaFilter === t ? 'border-amber-500 bg-amber-500 text-white' : 'border-border text-muted-foreground hover:border-amber-400'}`}>
                {TEMA_ORDENANZA_ICONS[t]} {TEMA_ORDENANZA_LABELS[t]}
              </button>
            ))}
          </div>
        )}
        {(query || tipoFilter !== 'TODOS' || fuenteFilter !== 'TODOS' || temaFilter !== 'TODOS') && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
            <button type="button" onClick={() => { setQuery(''); setTipoFilter('TODOS'); setFuenteFilter('TODOS'); setTemaFilter('TODOS'); }}
              className="text-xs text-primary hover:underline">Limpiar filtros</button>
          </div>
        )}
      </div>

      {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse"><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Cargando biblioteca...</div>}
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 flex justify-between gap-4">
          <span>{error}</span>
          <button type="button" onClick={fetchDocs} className="shrink-0 rounded border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50">Reintentar</button>
        </div>
      )}

      {!loading && filtered.length === 0 && logosFiltered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-14 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <svg className="h-7 w-7 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-medium text-sm">No hay documentos que coincidan</p>
          <p className="mt-1 text-xs text-muted-foreground">Prueba a cambiar los filtros o la búsqueda.</p>
        </div>
      )}

      {/* ── SECCIÓN LOGOS DE LA ASOCIACIÓN ── */}
      {!loading && showLogos && logosFiltered.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-semibold">Logos de la Asociación LPBME</h2>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
              Asociación LPBME
            </span>
            <span className="text-xs text-muted-foreground">{logosFiltered.length} logo{logosFiltered.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {logosFiltered.map((logo) => (
              <div key={logo.id} className="flex flex-col overflow-hidden rounded-xl border border-blue-100 bg-blue-50/30 shadow-sm">
                <div className="flex h-28 items-center justify-center bg-white border-b border-blue-100 p-4">
                  <img src={logo.url} alt={logo.nombre} className="max-h-full max-w-full object-contain" />
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <p className="text-sm font-medium leading-tight">{logo.nombre}</p>
                  {logo.etiqueta && <p className="mt-0.5 text-xs text-muted-foreground">{logo.etiqueta}</p>}
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      Asociación LPBME
                    </span>
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      Logo
                    </span>
                  </div>
                  <a
                    href={logo.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 transition"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Descargar
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SECCIÓN LOGOS / PAPELERÍA / OTROS (no ordenanzas) ── */}
      {!loading && docsNoOrdenanza.length > 0 && (
        <div className="space-y-4">
          {TIPOS_SIN_LOGO.filter((t) => docsNoOrdenanza.filter(d => d.tipo === t).length > 0).map((tipo) => {
            const grupo = docsNoOrdenanza.filter((d) => d.tipo === tipo);
            if (grupo.length === 0) return null;
            return (
              <section key={tipo}>
                <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${TIPO_COLORS[tipo]}`}>{TIPO_LABELS[tipo]}</span>
                  <span className="text-xs text-muted-foreground">{grupo.length} documento{grupo.length !== 1 ? 's' : ''}</span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
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
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Ordenanzas</span>
              <span className="text-xs text-muted-foreground">{docsOrdenanza.length} ordenanza{docsOrdenanza.length !== 1 ? 's' : ''}</span>
            </h2>
            {temaFilter === 'TODOS' && (
              <div className="flex rounded-lg border border-border bg-muted/30 p-0.5 text-xs">
                <button type="button" onClick={() => setVistaOrdenanza('tema')}
                  className={`rounded-md px-3 py-1.5 font-medium transition ${vistaOrdenanza === 'tema' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>
                  Por temática
                </button>
                <button type="button" onClick={() => setVistaOrdenanza('lista')}
                  className={`rounded-md px-3 py-1.5 font-medium transition ${vistaOrdenanza === 'lista' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>
                  Lista
                </button>
              </div>
            )}
          </div>

          {/* Vista por temática */}
          {vistaOrdenanza === 'tema' && temaFilter === 'TODOS' ? (
            <div className="space-y-6">
              {temasConDocs.map((tema) => {
                const grupo = ordenanzasPorTema[tema];
                return (
                  <div key={tema} className="rounded-xl border border-amber-100 bg-amber-50/40 overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-amber-100 bg-amber-50 px-5 py-3">
                      <span className="text-xl">{TEMA_ORDENANZA_ICONS[tema]}</span>
                      <div>
                        <h3 className="font-semibold text-sm">{TEMA_ORDENANZA_LABELS[tema]}</h3>
                        <p className="text-xs text-amber-700/70">{grupo.length} ordenanza{grupo.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="grid gap-3 p-4 sm:grid-cols-2">
                      {grupo.map((doc) => <DocCard key={doc.id} doc={doc} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Vista lista / tema filtrado */
            <div className="grid gap-3 sm:grid-cols-2">
              {docsOrdenanza.map((doc) => <DocCard key={doc.id} doc={doc} />)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
