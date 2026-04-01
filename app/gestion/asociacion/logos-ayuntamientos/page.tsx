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

interface LogoItem {
  id: number;
  nombre: string;
  url: string;
  createdAt: string;
  _source: 'logo';
}

interface DocItem {
  id: number;
  nombre: string;
  url: string;
  tipo: TipoDoc;
  compartido: boolean;
  createdAt: string;
  _source: 'doc';
}

type PuebloLogoGroup = {
  pueblo: { id: number; nombre: string; slug: string };
  logos: LogoItem[];
};

type PuebloDocGroup = {
  pueblo: { id: number; nombre: string; slug: string };
  documentos: DocItem[];
};

function isImage(url: string) {
  return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
}

export default function LogosAyuntamientosPage() {
  const [logoGroups, setLogoGroups] = useState<PuebloLogoGroup[]>([]);
  const [docGroups, setDocGroups] = useState<PuebloDocGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'logos' | 'documentos'>('logos');
  const [deleting, setDeleting] = useState<string | null>(null);

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const [resLogos, resDocs] = await Promise.all([
        fetch('/api/admin/pueblo-logos?grouped=true', { cache: 'no-store' }),
        fetch('/api/admin/documentos-pueblo?grouped=true', { cache: 'no-store' }),
      ]);
      if (resLogos.status === 401 || resDocs.status === 401) {
        window.location.href = '/entrar';
        return;
      }
      const logos = resLogos.ok ? await resLogos.json() : [];
      const docs = resDocs.ok ? await resDocs.json() : [];
      setLogoGroups(Array.isArray(logos) ? logos : []);
      setDocGroups(Array.isArray(docs) ? docs : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  async function handleDeleteLogo(logoId: number) {
    if (!confirm('¿Eliminar este logo?')) return;
    setDeleting(`logo-${logoId}`);
    try {
      const res = await fetch(`/api/admin/pueblo-logos/${logoId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error eliminando');
      setLogoGroups((prev) =>
        prev.map((g) => ({ ...g, logos: g.logos.filter((l) => l.id !== logoId) }))
            .filter((g) => g.logos.length > 0),
      );
    } catch (e) { alert(e instanceof Error ? e.message : 'Error'); }
    finally { setDeleting(null); }
  }

  async function handleDeleteDoc(docId: number) {
    if (!confirm('¿Eliminar este documento?')) return;
    setDeleting(`doc-${docId}`);
    try {
      const res = await fetch(`/api/admin/documentos-pueblo/${docId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error eliminando');
      setDocGroups((prev) =>
        prev.map((g) => ({ ...g, documentos: g.documentos.filter((d) => d.id !== docId) }))
            .filter((g) => g.documentos.length > 0),
      );
    } catch (e) { alert(e instanceof Error ? e.message : 'Error'); }
    finally { setDeleting(null); }
  }

  const filteredLogos = logoGroups.filter((g) =>
    g.pueblo.nombre.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredDocs = docGroups.filter((g) =>
    g.pueblo.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  const totalLogos = logoGroups.reduce((acc, g) => acc + g.logos.length, 0);
  const totalDocs = docGroups.reduce((acc, g) => acc + g.documentos.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Logos y documentos de ayuntamientos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Archivos subidos por los alcaldes desde su sección "Logo y papelería". Los marcados como compartidos son visibles para todos los alcaldes.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="rounded-md bg-muted px-3 py-1.5 font-medium">
            {logoGroups.length + docGroups.length} pueblos · {totalLogos} logos · {totalDocs} docs
          </span>
        </div>
      </div>

      {/* Búsqueda + tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Buscar pueblo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-md border border-border px-3 py-2 text-sm"
        />
        <div className="flex rounded-lg border border-border bg-muted/30 p-1 text-sm">
          <button
            type="button"
            onClick={() => setTab('logos')}
            className={`rounded-md px-4 py-1.5 font-medium transition ${tab === 'logos' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Logotipos ({totalLogos})
          </button>
          <button
            type="button"
            onClick={() => setTab('documentos')}
            className={`rounded-md px-4 py-1.5 font-medium transition ${tab === 'documentos' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Documentos ({totalDocs})
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground animate-pulse">Cargando...</p>}
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-4">
          <span>{error}</span>
          <button type="button" onClick={fetchAll} className="shrink-0 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50">
            Reintentar
          </button>
        </div>
      )}

      {/* ── TAB LOGOS ── */}
      {!loading && tab === 'logos' && (
        <>
          {filteredLogos.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              {search ? 'No hay resultados.' : 'Ningún ayuntamiento ha subido logotipos todavía.'}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredLogos.map(({ pueblo, logos }) => (
                <div key={pueblo.id} className="rounded-lg border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-3">
                    <div className="flex-1">
                      <h2 className="font-semibold text-base">{pueblo.nombre}</h2>
                      <p className="text-xs text-muted-foreground">{logos.length} logo{logos.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {logos.map((logo) => (
                      <div key={logo.id} className="flex flex-col items-center rounded-lg border border-border bg-background p-3 text-center">
                        <img src={logo.url} alt={logo.nombre} className="h-16 w-full object-contain" />
                        <p className="mt-2 text-xs font-medium line-clamp-2">{logo.nombre}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(logo.createdAt).toLocaleDateString('es')}</p>
                        <div className="mt-2 flex gap-1.5">
                          <a href={logo.url} download target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] hover:bg-muted">
                            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Descargar
                          </a>
                          <button type="button" disabled={deleting === `logo-${logo.id}`}
                            onClick={() => handleDeleteLogo(logo.id)}
                            className="rounded border border-red-200 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 disabled:opacity-50">
                            {deleting === `logo-${logo.id}` ? '...' : '✕'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB DOCUMENTOS ── */}
      {!loading && tab === 'documentos' && (
        <>
          {filteredDocs.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              {search ? 'No hay resultados.' : 'Ningún ayuntamiento ha subido documentos todavía.'}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredDocs.map(({ pueblo, documentos }) => (
                <div key={pueblo.id} className="rounded-lg border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-3">
                    <div className="flex-1">
                      <h2 className="font-semibold text-base">{pueblo.nombre}</h2>
                      <p className="text-xs text-muted-foreground">{documentos.length} documento{documentos.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="divide-y divide-border">
                    {documentos.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 overflow-hidden">
                          {isImage(doc.url) ? (
                            <img src={doc.url} alt={doc.nombre} className="h-full w-full object-contain" />
                          ) : (
                            <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{doc.nombre}</p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TIPO_COLORS[doc.tipo]}`}>
                              {TIPO_LABELS[doc.tipo]}
                            </span>
                            {doc.compartido && (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                                Compartido
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(doc.createdAt).toLocaleDateString('es')}
                            </span>
                          </div>
                        </div>
                        <a href={doc.url} download target="_blank" rel="noopener noreferrer"
                          className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted">
                          Descargar
                        </a>
                        <button type="button" disabled={deleting === `doc-${doc.id}`}
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="shrink-0 rounded-md border border-red-200 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50">
                          {deleting === `doc-${doc.id}` ? '...' : '✕'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
