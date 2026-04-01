'use client';

import { useEffect, useState } from 'react';

type TipoDoc = 'LOGO' | 'PAPELERIA' | 'ORDENANZA' | 'OTRO';

const TIPO_LABELS: Record<TipoDoc, string> = {
  LOGO: 'Logotipo',
  PAPELERIA: 'Papelería',
  ORDENANZA: 'Ordenanza',
  OTRO: 'Otro',
};

const TIPO_COLORS: Record<TipoDoc, string> = {
  LOGO: 'bg-blue-100 text-blue-700',
  PAPELERIA: 'bg-purple-100 text-purple-700',
  ORDENANZA: 'bg-amber-100 text-amber-700',
  OTRO: 'bg-gray-100 text-gray-600',
};

interface Documento {
  id: number;
  nombre: string;
  url: string;
  tipo: TipoDoc;
  compartido: boolean;
  createdAt: string;
}

interface PuebloDocGroup {
  pueblo: { id: number; nombre: string; slug: string };
  documentos: Documento[];
}

function isImage(url: string) {
  return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
}

export default function DocumentosCompartidosPage() {
  const [groups, setGroups] = useState<PuebloDocGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<TipoDoc | 'TODOS'>('TODOS');

  async function fetchGroups() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/documentos-pueblo?compartidos=true', { cache: 'no-store' });
      if (res.status === 401) { window.location.href = '/entrar'; return; }
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchGroups(); }, []);

  const filtered = groups
    .map((g) => ({
      ...g,
      documentos: g.documentos.filter((d) =>
        (tipoFilter === 'TODOS' || d.tipo === tipoFilter) &&
        (g.pueblo.nombre.toLowerCase().includes(search.toLowerCase()) ||
          d.nombre.toLowerCase().includes(search.toLowerCase())),
      ),
    }))
    .filter((g) => g.documentos.length > 0);

  const total = groups.reduce((acc, g) => acc + g.documentos.length, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documentos compartidos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Documentos que los ayuntamientos han decidido compartir con toda la red: plantillas de papelería, ordenanzas, recursos gráficos y más.
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground">
          {total} documento{total !== 1 ? 's' : ''} · {groups.length} pueblo{groups.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Buscar por pueblo o nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-md border border-border px-3 py-2 text-sm"
        />
        <div className="flex gap-2 flex-wrap">
          {(['TODOS', 'LOGO', 'PAPELERIA', 'ORDENANZA', 'OTRO'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipoFilter(t)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                tipoFilter === t
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {t === 'TODOS' ? 'Todos' : TIPO_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground animate-pulse">Cargando documentos...</p>}
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 flex justify-between gap-4">
          <span>{error}</span>
          <button type="button" onClick={fetchGroups} className="shrink-0 rounded border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50">
            Reintentar
          </button>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">
            {search || tipoFilter !== 'TODOS'
              ? 'No hay documentos que coincidan con tu búsqueda.'
              : 'Todavía no hay documentos compartidos. Cuando un alcalde marque un documento como compartido, aparecerá aquí.'}
          </p>
        </div>
      )}

      {/* Lista agrupada por pueblo */}
      <div className="space-y-4">
        {filtered.map(({ pueblo, documentos }) => (
          <div key={pueblo.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="border-b border-border bg-muted/30 px-5 py-3">
              <h2 className="font-semibold">{pueblo.nombre}</h2>
              <p className="text-xs text-muted-foreground">{documentos.length} documento{documentos.length !== 1 ? 's' : ''} compartido{documentos.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="divide-y divide-border">
              {documentos.map((doc) => (
                <div key={doc.id} className="flex items-center gap-4 px-5 py-3">
                  {/* Icono/preview */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 overflow-hidden">
                    {isImage(doc.url) ? (
                      <img src={doc.url} alt={doc.nombre} className="h-full w-full object-contain" />
                    ) : (
                      <svg className="h-6 w-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                        <line x1="9" y1="11" x2="11" y2="11" />
                      </svg>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{doc.nombre}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TIPO_COLORS[doc.tipo]}`}>
                        {TIPO_LABELS[doc.tipo]}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Descargar */}
                  <a
                    href={doc.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Descargar
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
