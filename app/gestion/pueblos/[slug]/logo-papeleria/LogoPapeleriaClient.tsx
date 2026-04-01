'use client';

import { useEffect, useRef, useState } from 'react';
import {
  TipoDoc,
  TemaOrdenanza,
  TIPO_LABELS,
  TIPO_COLORS,
  TEMA_ORDENANZA_LABELS,
  DocumentoItem,
  isImageUrl,
  isPdfUrl,
} from '../../../_lib/documentos';

interface PuebloLogo {
  id: number;
  nombre: string;
  url: string;
  createdAt: string;
}

export default function LogoPapeleriaClient({
  puebloId,
  puebloNombre,
}: {
  puebloId: number;
  puebloNombre: string;
  puebloSlug: string;
}) {
  // — Logos (PuebloLogo) —
  const [logos, setLogos] = useState<PuebloLogo[]>([]);
  const [loadingLogos, setLoadingLogos] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const [deletingLogoId, setDeletingLogoId] = useState<number | null>(null);

  // — Documentos (DocumentoPueblo) —
  const [docs, setDocs] = useState<DocumentoItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const docFileRef = useRef<HTMLInputElement>(null);

  const [newDocNombre, setNewDocNombre] = useState('');
  const [newDocDescripcion, setNewDocDescripcion] = useState('');
  const [newDocTipo, setNewDocTipo] = useState<TipoDoc>('PAPELERIA');
  const [newDocTema, setNewDocTema] = useState<TemaOrdenanza>('GENERAL_OTROS');
  const [newDocCompartido, setNewDocCompartido] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function fetchLogos() {
    setLoadingLogos(true);
    try {
      const res = await fetch(`/api/admin/pueblo-logos/pueblo/${puebloId}`, { cache: 'no-store' });
      if (res.status === 401) { window.location.href = '/entrar'; return; }
      const data = await res.json();
      setLogos(Array.isArray(data) ? data : []);
    } finally { setLoadingLogos(false); }
  }

  async function fetchDocs() {
    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/admin/documentos-pueblo/pueblo/${puebloId}`, { cache: 'no-store' });
      if (res.status === 401) { window.location.href = '/entrar'; return; }
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } finally { setLoadingDocs(false); }
  }

  useEffect(() => { fetchLogos(); fetchDocs(); }, []);

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true); setLogoError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'logos-ayuntamientos');
      const uploadRes = await fetch('/api/media/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Error subiendo el archivo');
      const { url } = await uploadRes.json();
      const createRes = await fetch('/api/admin/pueblo-logos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puebloId, nombre: file.name.replace(/\.[^.]+$/, ''), url }),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.message || 'Error guardando el logo');
      }
      await fetchLogos();
    } catch (e) { setLogoError(e instanceof Error ? e.message : 'Error'); }
    finally { setUploadingLogo(false); if (logoFileRef.current) logoFileRef.current.value = ''; }
  }

  async function handleDeleteLogo(id: number) {
    if (!confirm('¿Eliminar este logotipo?')) return;
    setDeletingLogoId(id);
    try {
      const res = await fetch(`/api/admin/pueblo-logos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error eliminando');
      setLogos((prev) => prev.filter((l) => l.id !== id));
    } catch (e) { alert(e instanceof Error ? e.message : 'Error'); }
    finally { setDeletingLogoId(null); }
  }

  async function handleDocUpload(file: File) {
    const nombre = newDocNombre.trim() || file.name.replace(/\.[^.]+$/, '');
    setUploadingDoc(true); setDocError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'documentos-pueblo');
      const uploadRes = await fetch('/api/media/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Error subiendo el archivo');
      const { url } = await uploadRes.json();
      const createRes = await fetch('/api/admin/documentos-pueblo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puebloId,
          nombre,
          url,
          tipo: newDocTipo,
          temaOrdenanza: newDocTipo === 'ORDENANZA' ? newDocTema : null,
          compartido: newDocCompartido,
          descripcion: newDocDescripcion.trim() || null,
          fuente: 'PUEBLO',
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.message || 'Error guardando el documento');
      }
      setNewDocNombre(''); setNewDocDescripcion(''); setNewDocCompartido(false);
      await fetchDocs();
    } catch (e) { setDocError(e instanceof Error ? e.message : 'Error'); }
    finally { setUploadingDoc(false); if (docFileRef.current) docFileRef.current.value = ''; }
  }

  async function handleToggleCompartido(doc: DocumentoItem) {
    setTogglingId(doc.id);
    try {
      const res = await fetch(`/api/admin/documentos-pueblo/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compartido: !doc.compartido }),
      });
      if (!res.ok) throw new Error('Error actualizando');
      setDocs((prev) => prev.map((d) => d.id === doc.id ? { ...d, compartido: !d.compartido } : d));
    } catch (e) { alert(e instanceof Error ? e.message : 'Error'); }
    finally { setTogglingId(null); }
  }

  async function handleDeleteDoc(id: number) {
    if (!confirm('¿Eliminar este documento?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/documentos-pueblo/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error eliminando');
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (e) { alert(e instanceof Error ? e.message : 'Error'); }
    finally { setDeletingId(null); }
  }

  return (
    <div className="mt-8 space-y-10">
      {/* ── LOGOTIPOS ── */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Logotipos</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Tus logotipos son visibles para la asociación y disponibles en el constructor de contenidos del pueblo. Formatos recomendados: PNG, SVG, WEBP. Máx. 6.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{logos.length} / 6</span>
        </div>
        {logoError && <div className="mb-3 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{logoError}</div>}
        {loadingLogos ? (
          <p className="text-sm text-muted-foreground animate-pulse">Cargando...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {logos.map((logo) => (
              <div key={logo.id} className="flex flex-col items-center rounded-xl border border-border bg-background p-3 text-center">
                <div className="flex h-20 w-full items-center justify-center">
                  <img src={logo.url} alt={logo.nombre} className="max-h-16 w-full object-contain" />
                </div>
                <p className="mt-2 text-xs font-medium line-clamp-2">{logo.nombre}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(logo.createdAt).toLocaleDateString('es')}</p>
                <div className="mt-2 flex gap-1.5">
                  <a href={logo.url} download target="_blank" rel="noopener noreferrer" className="rounded border border-border px-2 py-1 text-[11px] hover:bg-muted" title="Descargar">↓</a>
                  <button type="button" disabled={deletingLogoId === logo.id} onClick={() => handleDeleteLogo(logo.id)}
                    className="rounded border border-red-200 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 disabled:opacity-50">
                    {deletingLogoId === logo.id ? '...' : '✕'}
                  </button>
                </div>
              </div>
            ))}
            {logos.length < 6 && (
              <button type="button" disabled={uploadingLogo} onClick={() => logoFileRef.current?.click()}
                className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-50">
                {uploadingLogo ? (
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                ) : (<><svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg><span className="text-xs">Subir logo</span></>)}
              </button>
            )}
          </div>
        )}
        <input ref={logoFileRef} type="file" accept="image/*,.svg" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
      </section>

      {/* ── DOCUMENTOS ── */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Papelería y documentos</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Sube plantillas, ordenanzas, presentaciones y cualquier documento del municipio. Los <strong>compartidos</strong> aparecen en la biblioteca de todos los alcaldes.
          </p>
        </div>

        {/* Form subida */}
        <div className="mb-6 rounded-xl border border-dashed border-border bg-muted/30 p-5">
          <h3 className="mb-4 text-sm font-semibold">Nuevo documento</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Nombre del documento</label>
              <input type="text" placeholder="Ej: Ordenanza de embellecimiento 2024" value={newDocNombre}
                onChange={(e) => setNewDocNombre(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Tipo</label>
              <select value={newDocTipo} onChange={(e) => setNewDocTipo(e.target.value as TipoDoc)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm">
                {(Object.keys(TIPO_LABELS) as TipoDoc[]).filter(t => t !== 'LOGO').map((t) => (
                  <option key={t} value={t}>{TIPO_LABELS[t]}</option>
                ))}
              </select>
            </div>

            {/* Tema para ordenanzas */}
            {newDocTipo === 'ORDENANZA' && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-muted-foreground">Temática de la ordenanza</label>
                <select value={newDocTema} onChange={(e) => setNewDocTema(e.target.value as TemaOrdenanza)}
                  className="w-full rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm">
                  {(Object.keys(TEMA_ORDENANZA_LABELS) as TemaOrdenanza[]).map((t) => (
                    <option key={t} value={t}>{TEMA_ORDENANZA_LABELS[t]}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">Descripción (opcional)</label>
              <input type="text" placeholder="Breve descripción del contenido" value={newDocDescripcion}
                onChange={(e) => setNewDocDescripcion(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
            </div>

            <div className="sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50 w-fit">
                <input type="checkbox" checked={newDocCompartido} onChange={(e) => setNewDocCompartido(e.target.checked)} className="h-4 w-4 rounded" />
                <span>Compartir con todos los alcaldes de la red</span>
                {newDocCompartido && <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">Visible en biblioteca compartida</span>}
              </label>
            </div>
          </div>

          {docError && <div className="mt-3 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{docError}</div>}

          <button type="button" disabled={uploadingDoc} onClick={() => docFileRef.current?.click()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {uploadingDoc ? (<><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Subiendo...</>) : (
              <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Seleccionar archivo</>
            )}
          </button>
          <input ref={docFileRef} type="file" accept="image/*,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocUpload(f); }} />
        </div>

        {/* Lista documentos */}
        {loadingDocs ? (
          <p className="text-sm text-muted-foreground animate-pulse">Cargando documentos...</p>
        ) : docs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Todavía no has subido ningún documento para {puebloNombre}.
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 overflow-hidden">
                  {isImageUrl(doc.url) ? (
                    <img src={doc.url} alt={doc.nombre} className="h-full w-full object-contain" />
                  ) : isPdfUrl(doc.url) ? (
                    <svg className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
                  ) : (
                    <svg className="h-6 w-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.nombre}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${TIPO_COLORS[doc.tipo]}`}>{TIPO_LABELS[doc.tipo]}</span>
                    {doc.temaOrdenanza && (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">{TEMA_ORDENANZA_LABELS[doc.temaOrdenanza]}</span>
                    )}
                    {doc.descripcion && <span className="text-[10px] text-muted-foreground truncate max-w-xs">{doc.descripcion}</span>}
                  </div>
                </div>
                <button type="button" disabled={togglingId === doc.id} onClick={() => handleToggleCompartido(doc)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition disabled:opacity-50 ${doc.compartido ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100' : 'border-border bg-muted text-muted-foreground hover:bg-primary/5 hover:text-primary'}`}>
                  {togglingId === doc.id ? '...' : doc.compartido ? '✓ Compartido' : 'Privado'}
                </button>
                <a href={doc.url} download target="_blank" rel="noopener noreferrer"
                  className="shrink-0 rounded-md border border-border p-2 text-muted-foreground hover:bg-muted" title="Descargar">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                </a>
                <button type="button" disabled={deletingId === doc.id} onClick={() => handleDeleteDoc(doc.id)}
                  className="shrink-0 rounded-md border border-red-200 p-2 text-red-500 hover:bg-red-50 disabled:opacity-50" title="Eliminar">
                  {deletingId === doc.id ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                    : <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6M9 6V4h6v2" /></svg>}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
