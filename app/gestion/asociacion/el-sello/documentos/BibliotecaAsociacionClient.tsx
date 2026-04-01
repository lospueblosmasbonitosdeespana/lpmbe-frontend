'use client';

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

const TIPOS_DISPONIBLES: TipoDoc[] = ['PAPELERIA', 'ORDENANZA', 'OTRO'];

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

export default function BibliotecaAsociacionClient() {
  const [docs, setDocs] = useState<DocumentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // form nuevo documento
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<TipoDoc>('OTRO');
  const [tema, setTema] = useState<TemaOrdenanza>('GENERAL_OTROS');
  const [showForm, setShowForm] = useState(false);

  // archivos adicionales
  const [addingFileTo, setAddingFileTo] = useState<number | null>(null);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const extraFileRef = useRef<HTMLInputElement>(null);
  const [removingFileIdx, setRemovingFileIdx] = useState<{ docId: number; idx: number } | null>(null);

  async function fetchDocs() {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/admin/documentos-pueblo?compartidos=true', { cache: 'no-store' });
      if (res.status === 401) { window.location.href = '/entrar'; return; }
      const data: DocumentoItem[] = await res.json();
      setDocs(Array.isArray(data) ? data.filter((d) => d.fuente === 'ASOCIACION') : []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchDocs(); }, []);

  async function handleUpload(file: File) {
    const docNombre = nombre.trim() || file.name.replace(/\.[^.]+$/, '');
    setUploading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'documentos-asociacion');
      const uploadRes = await fetch('/api/media/upload', { method: 'POST', body: fd });
      if (!uploadRes.ok) throw new Error('Error subiendo el archivo');
      const { url } = await uploadRes.json();

      const createRes = await fetch('/api/admin/documentos-pueblo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: docNombre,
          url,
          tipo,
          temaOrdenanza: tipo === 'ORDENANZA' ? tema : null,
          fuente: 'ASOCIACION',
          compartido: true,
          descripcion: descripcion.trim() || null,
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.message || 'Error guardando');
      }
      setNombre(''); setDescripcion(''); setShowForm(false);
      await fetchDocs();
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este documento y todos sus archivos de la biblioteca?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/documentos-pueblo/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error eliminando');
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (e) { alert(e instanceof Error ? e.message : 'Error'); }
    finally { setDeleting(null); }
  }

  async function handleAddExtraFile(doc: DocumentoItem, file: File) {
    setUploadingExtra(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'documentos-asociacion');
      const uploadRes = await fetch('/api/media/upload', { method: 'POST', body: fd });
      if (!uploadRes.ok) throw new Error('Error subiendo el archivo');
      const { url } = await uploadRes.json();
      const nuevosArchivos: ArchivoAdicional[] = [
        ...(doc.archivosAdicionales ?? []),
        { url, nombre: file.name.replace(/\.[^.]+$/, '') },
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
    finally { setUploadingExtra(false); if (extraFileRef.current) extraFileRef.current.value = ''; }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Biblioteca compartida — Asociación</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Documentos que la asociación comparte con todos los alcaldes. Cada entrada puede tener <strong>varios archivos adjuntos</strong> (PDF, Word, imagen…). Aparecen en la biblioteca con la insignia "Asociación LPBME".
          </p>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)}
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          {showForm ? 'Cancelar' : '+ Subir documento'}
        </button>
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

      {/* Formulario nuevo documento */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-semibold">Nuevo documento para la biblioteca</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Nombre *</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Guía de embellecimiento de fachadas"
                className="w-full rounded-md border border-border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipo *</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoDoc)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm">
                {TIPOS_DISPONIBLES.map((t) => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
              </select>
            </div>
            {tipo === 'ORDENANZA' && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Temática de la ordenanza *</label>
                <select value={tema} onChange={(e) => setTema(e.target.value as TemaOrdenanza)}
                  className="w-full rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm">
                  {(Object.keys(TEMA_ORDENANZA_LABELS) as TemaOrdenanza[]).map((t) => (
                    <option key={t} value={t}>{TEMA_ORDENANZA_LABELS[t]}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Descripción (recomendado)</label>
              <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Breve descripción del contenido para facilitar búsqueda"
                className="w-full rounded-md border border-border px-3 py-2 text-sm" />
            </div>
          </div>
          {error && <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
          <div className="flex items-center gap-3">
            <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {uploading ? 'Subiendo...' : 'Seleccionar y subir archivo'}
            </button>
            <p className="text-xs text-muted-foreground">PDF, imagen, Word, Excel, PowerPoint, ZIP</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
        </div>
      )}

      {/* Lista */}
      {loading && <p className="text-sm text-muted-foreground animate-pulse">Cargando...</p>}
      {!loading && docs.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No hay documentos de la asociación en la biblioteca. Usa el botón "Subir documento" para añadir el primero.
        </div>
      )}
      {!loading && docs.length > 0 && (
        <div className="space-y-3">
          {docs.map((doc) => {
            const archivosExtra = doc.archivosAdicionales ?? [];
            const totalArchivos = 1 + archivosExtra.length;
            const isAddingHere = addingFileTo === doc.id;
            return (
              <div key={doc.id} className="overflow-hidden rounded-xl border border-border bg-background">
                {/* Cabecera */}
                <div className="flex items-center gap-3 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 overflow-hidden">
                    {isImageUrl(doc.url) ? <img src={doc.url} alt={doc.nombre} className="h-full w-full object-contain" /> : <FileIcon url={doc.url} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{doc.nombre}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${TIPO_COLORS[doc.tipo]}`}>{TIPO_LABELS[doc.tipo]}</span>
                      {doc.temaOrdenanza && <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">{TEMA_ORDENANZA_LABELS[doc.temaOrdenanza]}</span>}
                      {doc.descripcion && <span className="text-[10px] text-muted-foreground truncate max-w-xs">{doc.descripcion}</span>}
                      {totalArchivos > 1 && (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                          {totalArchivos} archivos
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString('es')}</span>
                    </div>
                  </div>
                  <button type="button" disabled={deleting === doc.id} onClick={() => handleDelete(doc.id)}
                    className="shrink-0 rounded-md border border-red-200 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50">
                    {deleting === doc.id ? '...' : '✕'}
                  </button>
                </div>

                {/* Archivos */}
                <div className="border-t border-border bg-muted/20 divide-y divide-border">
                  {/* Archivo principal */}
                  <div className="flex items-center gap-2 px-4 py-2">
                    <FileIcon url={doc.url} />
                    <span className="flex-1 truncate text-xs text-muted-foreground">{doc.nombre} <span className="text-[10px] opacity-60">(principal)</span></span>
                    <a href={doc.url} download target="_blank" rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1 rounded border border-border bg-white px-2.5 py-1 text-xs font-medium hover:bg-muted">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      Descargar
                    </a>
                  </div>

                  {/* Archivos adicionales */}
                  {archivosExtra.map((arch, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2">
                      <FileIcon url={arch.url} />
                      <span className="flex-1 truncate text-xs text-muted-foreground">{arch.nombre}</span>
                      <a href={arch.url} download target="_blank" rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-1 rounded border border-border bg-white px-2.5 py-1 text-xs font-medium hover:bg-muted">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        Descargar
                      </a>
                      <button
                        type="button"
                        disabled={removingFileIdx?.docId === doc.id && removingFileIdx?.idx === i}
                        onClick={() => handleRemoveExtraFile(doc, i)}
                        className="shrink-0 rounded border border-red-200 p-1 text-red-400 hover:bg-red-50 disabled:opacity-40"
                        title="Quitar este archivo"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  ))}

                  {/* Añadir archivo */}
                  <div className="px-4 py-2">
                    <button
                      type="button"
                      disabled={isAddingHere && uploadingExtra}
                      onClick={() => {
                        setAddingFileTo(doc.id);
                        setTimeout(() => extraFileRef.current?.click(), 50);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
                    >
                      {isAddingHere && uploadingExtra ? (
                        <><svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Subiendo...</>
                      ) : (
                        <><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Añadir otro archivo (PDF, DOC, imagen…)</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
