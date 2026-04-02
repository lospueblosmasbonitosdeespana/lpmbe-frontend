'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  TipoDoc,
  TemaOrdenanza,
  TIPO_LABELS,
  TIPO_COLORS,
  TEMA_ORDENANZA_LABELS,
  ArchivoAdicional,
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

function FileIcon({ url }: { url: string }) {
  if (isImageUrl(url)) return (
    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  );
  if (isPdfUrl(url)) return (
    <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
  return (
    <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

const HERO_GRADIENT = 'linear-gradient(135deg, #a0705a 0%, #b8856d 40%, #c49a82 100%)';

function ViewFileButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white/80 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 transition-all active:scale-95"
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      Ver
    </a>
  );
}

function DownloadFileButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      download
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-200 hover:from-amber-600 hover:to-amber-700 transition-all active:scale-95"
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Descargar
    </a>
  );
}

export default function LogoPapeleriaClient({
  puebloId,
  puebloNombre,
  puebloSlug,
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
  /** Archivo elegido en el disco; la subida al servidor ocurre solo al pulsar «Guardar documento». */
  const [pendingDocFile, setPendingDocFile] = useState<File | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // — Archivos adicionales —
  const [addingFileTo, setAddingFileTo] = useState<number | null>(null);
  const [uploadingExtraFile, setUploadingExtraFile] = useState(false);
  const extraFileRef = useRef<HTMLInputElement>(null);
  const [removingFileIdx, setRemovingFileIdx] = useState<{ docId: number; idx: number } | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTipo, setEditTipo] = useState<TipoDoc>('PAPELERIA');
  const [editTema, setEditTema] = useState<TemaOrdenanza>('GENERAL_OTROS');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

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

  async function submitNewDocument() {
    if (!pendingDocFile) {
      setDocError('Selecciona un archivo con «Seleccionar archivo» y, cuando hayas rellenado título y datos, pulsa «Guardar documento».');
      return;
    }
    const file = pendingDocFile;
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
      setPendingDocFile(null);
      await fetchDocs();
    } catch (e) { setDocError(e instanceof Error ? e.message : 'Error'); }
    finally {
      setUploadingDoc(false);
      if (docFileRef.current) docFileRef.current.value = '';
    }
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
    if (!confirm('¿Eliminar este documento y todos sus archivos?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/documentos-pueblo/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error eliminando');
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (e) { alert(e instanceof Error ? e.message : 'Error'); }
    finally { setDeletingId(null); }
  }

  async function handleAddExtraFile(doc: DocumentoItem, file: File) {
    setUploadingExtraFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'documentos-pueblo');
      const uploadRes = await fetch('/api/media/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Error subiendo el archivo');
      const { url } = await uploadRes.json();
      const nombreArchivo = file.name.replace(/\.[^.]+$/, '');
      const nuevosArchivos: ArchivoAdicional[] = [
        ...(doc.archivosAdicionales ?? []),
        { url, nombre: nombreArchivo },
      ];
      const patchRes = await fetch(`/api/admin/documentos-pueblo/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivosAdicionales: nuevosArchivos }),
      });
      if (!patchRes.ok) throw new Error('Error guardando el archivo adicional');
      const updated = await patchRes.json();
      setDocs((prev) => prev.map((d) => d.id === doc.id ? { ...d, archivosAdicionales: updated.archivosAdicionales ?? nuevosArchivos } : d));
      setAddingFileTo(null);
    } catch (e) { alert(e instanceof Error ? e.message : 'Error al añadir archivo'); }
    finally { setUploadingExtraFile(false); if (extraFileRef.current) extraFileRef.current.value = ''; }
  }

  async function handleRemoveExtraFile(doc: DocumentoItem, idx: number) {
    if (!confirm('¿Eliminar este archivo adicional?')) return;
    setRemovingFileIdx({ docId: doc.id, idx });
    try {
      const nuevosArchivos = (doc.archivosAdicionales ?? []).filter((_, i) => i !== idx);
      const patchRes = await fetch(`/api/admin/documentos-pueblo/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivosAdicionales: nuevosArchivos }),
      });
      if (!patchRes.ok) throw new Error('Error eliminando el archivo');
      setDocs((prev) => prev.map((d) => d.id === doc.id ? { ...d, archivosAdicionales: nuevosArchivos } : d));
    } catch (e) { alert(e instanceof Error ? e.message : 'Error'); }
    finally { setRemovingFileIdx(null); }
  }

  function handleOpenEdit(doc: DocumentoItem) {
    setEditingId(doc.id);
    setEditNombre(doc.nombre);
    setEditTipo(doc.tipo);
    setEditTema(doc.temaOrdenanza ?? 'GENERAL_OTROS');
    setEditDescripcion(doc.descripcion ?? '');
  }

  async function handleSaveMetadata(docId: number) {
    const nombre = editNombre.trim();
    if (!nombre) {
      alert('El nombre del documento es obligatorio.');
      return;
    }
    setSavingEdit(true);
    try {
      const body = {
        nombre,
        tipo: editTipo,
        descripcion: editDescripcion.trim() ? editDescripcion.trim() : null,
        temaOrdenanza: editTipo === 'ORDENANZA' ? editTema : null,
      };
      const res = await fetch(`/api/admin/documentos-pueblo/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'No se pudo guardar los cambios');
      }
      await fetchDocs();
      setEditingId(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
        style={{ background: HERO_GRADIENT }}
      >
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/6 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm shadow-inner">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Logo y papelería</h1>
                <p className="mt-0.5 text-sm text-white/80">
                  <span className="font-semibold text-white/95">{puebloNombre}</span>
                  {' · '}
                  Identidad visual y documentos del municipio
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-3">
          <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
            <span className="text-lg font-bold">{loadingLogos ? '—' : logos.length}</span>
            <span className="ml-1.5 text-xs text-white/70">logotipos</span>
            <span className="ml-1 text-xs text-white/50">/ 6</span>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
            <span className="text-lg font-bold">{loadingDocs ? '—' : docs.length}</span>
            <span className="ml-1.5 text-xs text-white/70">{docs.length === 1 ? 'documento' : 'documentos'}</span>
          </div>
        </div>
      </div>

      {/* Logotipos */}
      <section className="overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-b from-violet-50/50 to-white p-6 shadow-md shadow-violet-100/40">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-md shadow-violet-200">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Logotipos</h2>
              <p className="mt-0.5 max-w-xl text-sm text-muted-foreground leading-relaxed">
                Visibles para la asociación y en el constructor de contenidos del pueblo. Formatos: PNG, SVG, WEBP. Máximo 6 versiones.
              </p>
            </div>
          </div>
          <span className="shrink-0 self-start rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-800 ring-1 ring-violet-200">
            {loadingLogos ? '…' : `${logos.length} / 6`}
          </span>
        </div>
        {logoError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{logoError}</div>
        )}
        {loadingLogos ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-violet-500" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Cargando logotipos…</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {logos.map((logo) => (
              <div
                key={logo.id}
                className="group flex flex-col rounded-2xl border border-violet-100 bg-white p-3 text-center shadow-sm transition-all hover:border-violet-200 hover:shadow-md"
              >
                <div className="flex h-24 w-full items-center justify-center rounded-xl bg-gradient-to-b from-slate-50 to-white ring-1 ring-slate-100">
                  <img src={logo.url} alt={logo.nombre} className="max-h-20 w-full object-contain p-1" />
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-semibold text-foreground">{logo.nombre}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(logo.createdAt).toLocaleDateString('es')}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  <ViewFileButton href={logo.url} />
                  <DownloadFileButton href={logo.url} />
                  <button
                    type="button"
                    disabled={deletingLogoId === logo.id}
                    onClick={() => handleDeleteLogo(logo.id)}
                    className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white p-1.5 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                    title="Eliminar"
                  >
                    {deletingLogoId === logo.id ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                    ) : (
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
            {logos.length < 6 && (
              <button
                type="button"
                disabled={uploadingLogo}
                onClick={() => logoFileRef.current?.click()}
                className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/30 text-sm text-violet-700/80 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-900 disabled:opacity-50"
              >
                {uploadingLogo ? (
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
                ) : (
                  <>
                    <svg className="h-8 w-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs font-semibold">Subir logo</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
        <input
          ref={logoFileRef}
          type="file"
          accept="image/*,.svg"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleLogoUpload(f);
          }}
        />
      </section>

      {/* Papelería y documentos */}
      <section className="overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-b from-amber-50/40 to-white p-6 shadow-md shadow-amber-100/30">
        <div className="mb-6 flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-amber-200">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Papelería y documentos</h2>
            <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground leading-relaxed">
              Plantillas, ordenanzas y archivos del municipio. El archivo <strong className="text-foreground/80">no se sube</strong> hasta pulsar{' '}
              <strong className="text-foreground/80">Guardar documento</strong>. Puedes añadir más archivos a la misma ficha. Los{' '}
              <strong className="text-emerald-700/90">compartidos</strong> aparecen en la biblioteca de todos los alcaldes.
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border-2 border-primary/15 bg-gradient-to-b from-amber-50/30 to-white p-6 shadow-inner">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="font-bold text-foreground">Nuevo documento</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre</label>
              <input
                type="text"
                placeholder="Ej: Ordenanza de embellecimiento 2024"
                value={newDocNombre}
                onChange={(e) => setNewDocNombre(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</label>
              <select
                value={newDocTipo}
                onChange={(e) => setNewDocTipo(e.target.value as TipoDoc)}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm shadow-sm"
              >
                {(Object.keys(TIPO_LABELS) as TipoDoc[])
                  .filter((t) => t !== 'LOGO')
                  .map((t) => (
                    <option key={t} value={t}>
                      {TIPO_LABELS[t]}
                    </option>
                  ))}
              </select>
            </div>

            {newDocTipo === 'ORDENANZA' && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Temática</label>
                <select
                  value={newDocTema}
                  onChange={(e) => setNewDocTema(e.target.value as TemaOrdenanza)}
                  className="w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm shadow-sm"
                >
                  {(Object.keys(TEMA_ORDENANZA_LABELS) as TemaOrdenanza[]).map((t) => (
                    <option key={t} value={t}>
                      {TEMA_ORDENANZA_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descripción</label>
              <textarea
                placeholder="Breve descripción del contenido"
                value={newDocDescripcion}
                onChange={(e) => setNewDocDescripcion(e.target.value)}
                rows={3}
                className="w-full resize-y rounded-xl border border-border px-4 py-2.5 text-sm shadow-sm"
              />
            </div>

            <div className="sm:col-span-2 rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={newDocCompartido}
                  onChange={(e) => setNewDocCompartido(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-emerald-300"
                />
                <span>
                  <span className="text-sm font-semibold text-foreground">Compartir con todos los alcaldes de la red</span>
                  {newDocCompartido && (
                    <span className="mt-1 block w-fit rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 ring-1 ring-emerald-200">
                      Visible en biblioteca compartida
                    </span>
                  )}
                </span>
              </label>
            </div>
          </div>

          {docError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{docError}</div>
          )}

          <div className="mt-5 flex flex-col gap-3 border-t border-border/40 pt-5 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              disabled={uploadingDoc}
              onClick={() => docFileRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-white px-5 py-2.5 text-sm font-semibold transition-all hover:border-primary/30 hover:bg-muted disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Seleccionar archivo
            </button>
            <button
              type="button"
              disabled={uploadingDoc || !pendingDocFile}
              onClick={() => void submitNewDocument()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:from-primary/90 hover:to-primary/80 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]"
            >
              {uploadingDoc ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Guardando…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardar documento
                </>
              )}
            </button>
            {pendingDocFile && (
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200 sm:w-auto">
                <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="truncate text-sm font-medium text-emerald-800" title={pendingDocFile.name}>
                  {pendingDocFile.name}
                </span>
                <button
                  type="button"
                  disabled={uploadingDoc}
                  onClick={() => {
                    setPendingDocFile(null);
                    setDocError(null);
                    if (docFileRef.current) docFileRef.current.value = '';
                  }}
                  className="ml-auto shrink-0 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Quitar
                </button>
              </div>
            )}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Rellena datos → elige archivo → <strong>Guardar documento</strong>. El estado compartido se aplica al guardar.
          </p>
          <input
            ref={docFileRef}
            type="file"
            accept="image/*,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setPendingDocFile(f);
                setDocError(null);
              }
              e.target.value = '';
            }}
          />
        </div>

        {/* Input oculto para archivos adicionales */}
        <input
          ref={extraFileRef}
          type="file"
          accept="image/*,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f && addingFileTo !== null) {
              const doc = docs.find((d) => d.id === addingFileTo);
              if (doc) handleAddExtraFile(doc, f);
            }
          }}
        />

        {loadingDocs ? (
          <div className="flex flex-col items-center gap-3 py-14">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 rounded-full border-4 border-amber-100" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-amber-600" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Cargando documentos…</p>
          </div>
        ) : docs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/20 p-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100/80 ring-1 ring-amber-200">
              <svg className="h-6 w-6 text-amber-700/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="font-semibold text-foreground">Sin documentos todavía</p>
            <p className="mt-1 text-sm text-muted-foreground">Usa el formulario de arriba para subir el primero para {puebloNombre}.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {docs.map((doc) => {
              const archivosExtra = doc.archivosAdicionales ?? [];
              const totalArchivos = 1 + archivosExtra.length;
              const isAddingHere = addingFileTo === doc.id;
              return (
                <div
                  key={doc.id}
                  className="group overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm transition-all hover:border-amber-200 hover:shadow-md"
                >
                  <div className="flex items-start gap-4 p-5">
                    <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 ring-1 ring-amber-200/60 shadow-sm">
                      {isImageUrl(doc.url) ? (
                        <img src={doc.url} alt={doc.nombre} className="h-full w-full object-contain p-1" />
                      ) : isPdfUrl(doc.url) ? (
                        <svg className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="9" y1="15" x2="15" y2="15" />
                        </svg>
                      ) : (
                        <svg className="h-6 w-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {editingId === doc.id ? (
                        <div className="space-y-3 rounded-xl border border-amber-200/90 bg-amber-50/50 p-4">
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Nombre</label>
                            <input
                              type="text"
                              value={editNombre}
                              onChange={(e) => setEditNombre(e.target.value)}
                              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm shadow-sm"
                            />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Tipo</label>
                              <select
                                value={editTipo}
                                onChange={(e) => setEditTipo(e.target.value as TipoDoc)}
                                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm shadow-sm"
                              >
                                {(Object.keys(TIPO_LABELS) as TipoDoc[])
                                  .filter((t) => t !== 'LOGO')
                                  .map((t) => (
                                    <option key={t} value={t}>
                                      {TIPO_LABELS[t]}
                                    </option>
                                  ))}
                              </select>
                            </div>
                            {editTipo === 'ORDENANZA' && (
                              <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Temática</label>
                                <select
                                  value={editTema}
                                  onChange={(e) => setEditTema(e.target.value as TemaOrdenanza)}
                                  className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-sm shadow-sm"
                                >
                                  {(Object.keys(TEMA_ORDENANZA_LABELS) as TemaOrdenanza[]).map((t) => (
                                    <option key={t} value={t}>
                                      {TEMA_ORDENANZA_LABELS[t]}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Descripción</label>
                            <textarea
                              value={editDescripcion}
                              onChange={(e) => setEditDescripcion(e.target.value)}
                              rows={3}
                              placeholder="Breve descripción del contenido"
                              className="w-full resize-y rounded-lg border border-border bg-white px-3 py-2.5 text-sm shadow-sm"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={savingEdit}
                              onClick={() => handleSaveMetadata(doc.id)}
                              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
                            >
                              {savingEdit ? 'Guardando…' : 'Guardar cambios'}
                            </button>
                            <button
                              type="button"
                              disabled={savingEdit}
                              onClick={() => setEditingId(null)}
                              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-base font-semibold leading-tight text-foreground">{doc.nombre}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${TIPO_COLORS[doc.tipo]}`}>
                              {TIPO_LABELS[doc.tipo]}
                            </span>
                            {doc.temaOrdenanza && (
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-amber-700">
                                {TEMA_ORDENANZA_LABELS[doc.temaOrdenanza]}
                              </span>
                            )}
                            {totalArchivos > 1 && (
                              <span className="rounded-full bg-gradient-to-r from-violet-100 to-violet-50 px-2.5 py-0.5 text-[10px] font-bold text-violet-600 ring-1 ring-violet-200/60">
                                {totalArchivos} archivos
                              </span>
                            )}
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${
                                doc.compartido
                                  ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
                                  : 'bg-slate-100 text-slate-600 ring-slate-200'
                              }`}
                            >
                              {doc.compartido ? 'Compartido' : 'Privado'}
                            </span>
                          </div>
                          {doc.descripcion && (
                            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground break-words">{doc.descripcion}</p>
                          )}
                        </>
                      )}
                    </div>
                    {editingId !== doc.id && (
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(doc)}
                          className="rounded-xl border border-border p-2.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                          title="Editar"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          disabled={togglingId === doc.id}
                          onClick={() => handleToggleCompartido(doc)}
                          className={`rounded-xl border px-3 py-2 text-[11px] font-bold transition disabled:opacity-50 ${
                            doc.compartido
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                              : 'border-border bg-slate-50 text-slate-600 hover:border-primary/30 hover:bg-primary/5 hover:text-primary'
                          }`}
                          title={doc.compartido ? 'Dejar de compartir con la red' : 'Compartir con todos los alcaldes'}
                        >
                          {togglingId === doc.id ? '…' : doc.compartido ? 'Compartido' : 'Compartir'}
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === doc.id}
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="rounded-xl border border-red-200 p-2.5 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                          title="Eliminar documento"
                        >
                          {deletingId === doc.id ? (
                            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                          ) : (
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="divide-y divide-amber-100 border-t border-amber-100/80 bg-gradient-to-b from-amber-50/30 to-transparent">
                    <div className="flex flex-wrap items-center gap-3 px-5 py-3 transition-colors hover:bg-white/60">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-border shadow-sm">
                        <FileIcon url={doc.url} />
                      </div>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{doc.nombre}</span>
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Principal</span>
                      <div className="flex shrink-0 gap-1.5">
                        <ViewFileButton href={doc.url} />
                        <DownloadFileButton href={doc.url} />
                      </div>
                    </div>

                    {archivosExtra.map((arch, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-3 px-5 py-3 transition-colors hover:bg-white/60">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-border shadow-sm">
                          <FileIcon url={arch.url} />
                        </div>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{arch.nombre}</span>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          Archivo {i + 2}
                        </span>
                        <div className="flex shrink-0 gap-1.5">
                          <ViewFileButton href={arch.url} />
                          <DownloadFileButton href={arch.url} />
                          <button
                            type="button"
                            disabled={removingFileIdx?.docId === doc.id && removingFileIdx?.idx === i}
                            onClick={() => handleRemoveExtraFile(doc, i)}
                            className="rounded-lg border border-red-200 p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                            title="Quitar archivo"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="px-5 py-3">
                      <button
                        type="button"
                        disabled={isAddingHere && uploadingExtraFile}
                        onClick={() => {
                          setAddingFileTo(doc.id);
                          setTimeout(() => extraFileRef.current?.click(), 50);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-all hover:border-primary hover:text-primary hover:bg-primary/5 disabled:opacity-50"
                      >
                        {isAddingHere && uploadingExtraFile ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
                            Subiendo…
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Añadir otro archivo
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="border-t border-border/60 pt-8">
        <Link
          href={`/gestion/pueblos/${puebloSlug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a gestión del pueblo
        </Link>
      </div>
    </div>
  );
}
