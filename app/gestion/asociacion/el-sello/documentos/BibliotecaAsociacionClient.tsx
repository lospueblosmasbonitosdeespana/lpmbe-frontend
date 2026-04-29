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
  isDestacadoActivo,
} from '../../../_lib/documentos';

const TIPOS_DISPONIBLES: TipoDoc[] = ['PAPELERIA', 'ORDENANZA', 'CARTEL', 'MANUAL_WEB', 'OTRO'];

const DESIGN_ACCEPT = '.ai,.eps,.psd,.indd,.tif,.tiff';
const BASE_ACCEPT = 'image/*,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip';
const ALL_ACCEPT = `${BASE_ACCEPT},${DESIGN_ACCEPT}`;

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
  const [destacado, setDestacado] = useState(false);
  const [duracionDestacado, setDuracionDestacado] = useState<string>('2w');
  const [showForm, setShowForm] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // archivos adicionales
  const [addingFileTo, setAddingFileTo] = useState<number | null>(null);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const extraFileRef = useRef<HTMLInputElement>(null);
  const [removingFileIdx, setRemovingFileIdx] = useState<{ docId: number; idx: number } | null>(null);
  const [removingMainFor, setRemovingMainFor] = useState<number | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTipo, setEditTipo] = useState<TipoDoc>('OTRO');
  const [editTema, setEditTema] = useState<TemaOrdenanza>('GENERAL_OTROS');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [togglingDestacado, setTogglingDestacado] = useState<number | null>(null);

  function calcDestacadoHasta(duracion: string): string | null {
    if (duracion === 'indefinido') return null;
    const now = new Date();
    const map: Record<string, number> = { '1w': 7, '2w': 14, '1m': 30, '3m': 90 };
    const days = map[duracion] ?? 14;
    now.setDate(now.getDate() + days);
    return now.toISOString();
  }

  async function parseUploadError(res: Response): Promise<string> {
    const data = await res.json().catch(() => ({} as any));
    const msg = data?.error ?? data?.message ?? data?.data?.message;
    return typeof msg === 'string' && msg.trim().length > 0
      ? msg
      : 'Error subiendo el archivo';
  }

  async function uploadFileViaPresign(file: File, folder: string): Promise<string> {
    const contentType = file.type?.trim() || 'application/octet-stream';
    const presignRes = await fetch('/api/media/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType,
        folder,
      }),
    });
    if (!presignRes.ok) throw new Error(await parseUploadError(presignRes));
    const presign = await presignRes.json();
    const uploadRes = await fetch(String(presign.uploadUrl), {
      method: 'PUT',
      headers: { 'Content-Type': String(presign.contentType || contentType) },
      body: file,
    });
    if (!uploadRes.ok) throw new Error(`Error subiendo a R2 (status ${uploadRes.status})`);
    const publicUrl = String(presign.publicUrl || '');
    if (!publicUrl) throw new Error('R2 no devolvió URL pública');
    return publicUrl;
  }

  async function uploadFileDirectToR2(file: File, folder: string): Promise<string> {
    const ticketRes = await fetch('/api/media/upload-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folder,
      }),
    });
    if (!ticketRes.ok) {
      // Compatibilidad: algunos despliegues de backend aún no exponen /media/upload-ticket
      const raw = await ticketRes.text().catch(() => '');
      if (ticketRes.status === 404 || /Cannot POST \/media\/upload-ticket/i.test(raw)) {
        return uploadFileViaPresign(file, folder);
      }
      throw new Error(raw || 'No se pudo preparar la subida');
    }
    const ticketData = await ticketRes.json();
    const uploadUrl = String(ticketData.uploadUrl || '');
    const ticket = String(ticketData.ticket || '');
    if (!uploadUrl || !ticket) throw new Error('No se pudo preparar la subida');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('ticket', ticket);

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      body: fd,
    });
    if (!uploadRes.ok) {
      const txt = await uploadRes.text().catch(() => '');
      throw new Error(`Error subiendo archivo (status ${uploadRes.status})${txt ? `: ${txt}` : ''}`);
    }
    const data = await uploadRes.json().catch(() => ({}));
    const publicUrl = String(data.publicUrl || data.url || '');
    if (!publicUrl) throw new Error('R2 no devolvió URL pública');
    return publicUrl;
  }

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

  async function submitNewAssociationDoc() {
    if (!pendingFile) {
      setError('Selecciona un archivo y pulsa «Guardar documento» cuando hayas rellenado los datos.');
      return;
    }
    const file = pendingFile;
    const docNombre = nombre.trim() || file.name.replace(/\.[^.]+$/, '');
    setUploading(true); setError(null);
    try {
      const url = await uploadFileDirectToR2(file, 'documentos-asociacion');

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
          destacado,
          destacadoHasta: destacado ? calcDestacadoHasta(duracionDestacado) : null,
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.message || 'Error guardando');
      }
      setNombre(''); setDescripcion(''); setPendingFile(null); setShowForm(false); setDestacado(false);
      await fetchDocs();
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
    finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
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
      const url = await uploadFileDirectToR2(file, 'documentos-asociacion');
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

  /**
   * Elimina el archivo "principal" de un documento sin necesidad de borrar
   * el documento entero. Si hay archivos adicionales, el siguiente
   * (`archivosAdicionales[0]`) se promociona a principal y deja de aparecer
   * como adicional. Si NO hay adicionales, se ofrece borrar el documento
   * completo (delegado a `handleDelete`).
   */
  async function handleRemoveMainFile(doc: DocumentoItem) {
    const archivos = doc.archivosAdicionales ?? [];
    if (archivos.length === 0) {
      if (!confirm(`Este es el único archivo del documento.\n\nSi lo eliminas, se borrará también el documento «${doc.nombre}» de la biblioteca.\n\n¿Continuar?`)) return;
      await handleDelete(doc.id);
      return;
    }
    if (!confirm('¿Eliminar el archivo principal?\n\nEl siguiente archivo pasará a ocupar el lugar del principal.')) return;
    setRemovingMainFor(doc.id);
    try {
      const [nuevoPrincipal, ...resto] = archivos;
      const patchRes = await fetch(`/api/admin/documentos-pueblo/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: nuevoPrincipal.url, archivosAdicionales: resto }),
      });
      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => ({}));
        throw new Error(err.message || 'No se pudo eliminar el archivo principal');
      }
      setDocs((prev) => prev.map((d) => d.id === doc.id ? { ...d, url: nuevoPrincipal.url, archivosAdicionales: resto } : d));
    } catch (e) { alert(e instanceof Error ? e.message : 'Error'); }
    finally { setRemovingMainFor(null); }
  }

  async function handleToggleDestacado(doc: DocumentoItem) {
    const nuevoDestacado = !isDestacadoActivo(doc);
    setTogglingDestacado(doc.id);
    try {
      let destacadoHasta: string | null = null;
      if (nuevoDestacado) {
        const duracion = prompt('Duración del aviso importante:\n1w = 1 semana\n2w = 2 semanas\n1m = 1 mes\n3m = 3 meses\nindefinido = sin fecha límite', '2w');
        if (!duracion) { setTogglingDestacado(null); return; }
        destacadoHasta = calcDestacadoHasta(duracion.trim());
      }
      const res = await fetch(`/api/admin/documentos-pueblo/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destacado: nuevoDestacado, destacadoHasta }),
      });
      if (!res.ok) throw new Error('Error actualizando');
      await fetchDocs();
    } catch (e) { alert(e instanceof Error ? e.message : 'Error'); }
    finally { setTogglingDestacado(null); }
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

  const docsImportantes = docs.filter(isDestacadoActivo);
  const docsNormales = docs.filter((d) => !isDestacadoActivo(d));

  function renderDocCard(doc: DocumentoItem) {
    const archivosExtra = doc.archivosAdicionales ?? [];
    const totalArchivos = 1 + archivosExtra.length;
    const isAddingHere = addingFileTo === doc.id;
    const esImportante = isDestacadoActivo(doc);

    return (
      <div key={doc.id} className={`group overflow-hidden rounded-2xl border-2 transition-all duration-300 shadow-sm hover:shadow-md ${esImportante ? 'border-red-300 bg-gradient-to-b from-red-50/60 to-white' : 'border-transparent bg-white hover:border-amber-100'}`}>
        {/* Cabecera del documento */}
        <div className="flex items-start gap-4 p-5">
          <div className={`mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl overflow-hidden ring-1 shadow-sm ${esImportante ? 'bg-gradient-to-br from-red-50 to-red-100 ring-red-200/60' : 'bg-gradient-to-br from-amber-50 to-amber-100 ring-amber-200/60'}`}>
            {isImageUrl(doc.url) ? <img src={doc.url} alt={doc.nombre} className="h-10 w-10 object-contain" /> : <FileIcon url={doc.url} />}
          </div>
          <div className="min-w-0 flex-1">
            {editingId === doc.id ? (
              <div className="space-y-3 rounded-xl border border-amber-200/90 bg-amber-50/50 p-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">Nombre</label>
                  <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-primary/20 focus:outline-none" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Tipo</label>
                    <select value={editTipo} onChange={(e) => setEditTipo(e.target.value as TipoDoc)} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm shadow-sm">
                      {TIPOS_DISPONIBLES.map((t) => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
                    </select>
                  </div>
                  {editTipo === 'ORDENANZA' && (
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-muted-foreground">Temática</label>
                      <select value={editTema} onChange={(e) => setEditTema(e.target.value as TemaOrdenanza)} className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-sm shadow-sm">
                        {(Object.keys(TEMA_ORDENANZA_LABELS) as TemaOrdenanza[]).map((t) => (
                          <option key={t} value={t}>{TEMA_ORDENANZA_LABELS[t]}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">Descripción</label>
                  <textarea value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} rows={3} placeholder="Breve descripción" className="w-full resize-y rounded-lg border border-border bg-white px-3 py-2.5 text-sm shadow-sm" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={savingEdit} onClick={() => handleSaveMetadata(doc.id)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shadow-sm">
                    {savingEdit ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                  <button type="button" disabled={savingEdit} onClick={() => setEditingId(null)} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-base font-semibold text-foreground leading-tight">{doc.nombre}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {esImportante && (
                    <span className="rounded-full bg-gradient-to-r from-red-500 to-red-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm animate-pulse">IMPORTANTE</span>
                  )}
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${TIPO_COLORS[doc.tipo]}`}>{TIPO_LABELS[doc.tipo]}</span>
                  {doc.temaOrdenanza && <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-amber-700">{TEMA_ORDENANZA_LABELS[doc.temaOrdenanza]}</span>}
                  {totalArchivos > 1 && (
                    <span className="rounded-full bg-gradient-to-r from-violet-100 to-violet-50 px-2.5 py-0.5 text-[10px] font-bold text-violet-600 ring-1 ring-violet-200/60">{totalArchivos} archivos</span>
                  )}
                  <span className="text-[10px] text-muted-foreground/70">{new Date(doc.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  {esImportante && doc.destacadoHasta && (
                    <span className="text-[10px] font-medium text-red-500">hasta {new Date(doc.destacadoHasta).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</span>
                  )}
                </div>
                {doc.descripcion && <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground break-words">{doc.descripcion}</p>}
              </>
            )}
          </div>
          {editingId !== doc.id && (
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                disabled={togglingDestacado === doc.id}
                onClick={() => handleToggleDestacado(doc)}
                className={`rounded-xl border p-2.5 transition-all duration-200 disabled:opacity-50 ${esImportante ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100 shadow-sm shadow-red-100' : 'border-border text-muted-foreground hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'}`}
                title={esImportante ? 'Quitar importancia' : 'Marcar como Importante'}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill={esImportante ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
              </button>
              <button type="button" onClick={() => handleOpenEdit(doc)} className="rounded-xl border border-border p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200" title="Editar">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                </svg>
              </button>
              <button type="button" disabled={deleting === doc.id} onClick={() => handleDelete(doc.id)} className="rounded-xl border border-red-200 p-2.5 text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 disabled:opacity-50" title="Eliminar">
                {deleting === doc.id ? <span className="h-4 w-4 block animate-spin rounded-full border-2 border-red-300 border-t-red-600" /> : <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6M9 6V4h6v2" /></svg>}
              </button>
            </div>
          )}
        </div>

        {/* Archivos */}
        <div className={`border-t divide-y ${esImportante ? 'border-red-100 divide-red-100/60 bg-gradient-to-b from-red-50/30 to-transparent' : 'border-amber-100/80 divide-amber-100/60 bg-gradient-to-b from-amber-50/30 to-transparent'}`}>
          {/* Archivo principal */}
          <div className="flex items-center gap-3 px-5 py-3 hover:bg-white/60 transition-colors">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-border shadow-sm">
              <FileIcon url={doc.url} />
            </div>
            <span className="flex-1 truncate text-sm font-medium text-foreground">{doc.nombre}</span>
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">Principal</span>
            <div className="flex shrink-0 gap-1.5">
              <a href={doc.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white/80 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 transition-all active:scale-95">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                Ver
              </a>
              <a href={doc.url} download target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-200 hover:from-amber-600 hover:to-amber-700 transition-all active:scale-95">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Descargar
              </a>
              <button
                type="button"
                disabled={removingMainFor === doc.id}
                onClick={() => handleRemoveMainFile(doc)}
                className="rounded-lg border border-red-200 p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 transition-all"
                title={archivosExtra.length > 0
                  ? 'Quitar este archivo (el siguiente pasa a principal)'
                  : 'Eliminar este archivo (borrará el documento)'}
              >
                {removingMainFor === doc.id
                  ? <span className="h-3.5 w-3.5 block animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
                  : <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
              </button>
            </div>
          </div>

          {/* Archivos adicionales */}
          {archivosExtra.map((arch, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-white/60 transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-border shadow-sm">
                <FileIcon url={arch.url} />
              </div>
              <span className="flex-1 truncate text-sm font-medium text-foreground">{arch.nombre}</span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">Archivo {i + 2}</span>
              <div className="flex shrink-0 gap-1.5">
                <a href={arch.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white/80 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 transition-all active:scale-95">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  Ver
                </a>
                <a href={arch.url} download target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-200 hover:from-amber-600 hover:to-amber-700 transition-all active:scale-95">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Descargar
                </a>
                <button
                  type="button"
                  disabled={removingFileIdx?.docId === doc.id && removingFileIdx?.idx === i}
                  onClick={() => handleRemoveExtraFile(doc, i)}
                  className="rounded-lg border border-red-200 p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 transition-all"
                  title="Quitar este archivo"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>
          ))}

          {/* Añadir archivo */}
          <div className="px-5 py-3">
            <button
              type="button"
              disabled={isAddingHere && uploadingExtra}
              onClick={() => {
                setAddingFileTo(doc.id);
                setTimeout(() => extraFileRef.current?.click(), 50);
              }}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-all hover:border-primary hover:text-primary hover:bg-primary/5 disabled:opacity-50"
            >
              {isAddingHere && uploadingExtra ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />Subiendo...</>
              ) : (
                <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Añadir otro archivo</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white" style={{ background: 'linear-gradient(135deg, #a0705a 0%, #b8856d 40%, #c49a82 100%)' }}>
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/6 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm shadow-inner">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Biblioteca compartida</h2>
            </div>
            <p className="mt-2 max-w-lg text-sm text-white/75 leading-relaxed">
              Documentos que la asociación comparte con todos los alcaldes. Cada entrada puede tener <strong className="text-white/90">varios archivos adjuntos</strong>. Aparecen con la insignia LPMBE.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setShowForm(!showForm); if (showForm) { setPendingFile(null); setError(null); } }}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition-all hover:bg-white/25 hover:ring-white/40 active:scale-95 shadow-sm"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            {showForm ? 'Cancelar' : 'Subir documento'}
          </button>
        </div>
        {/* Mini stats */}
        {docs.length > 0 && (
          <div className="relative mt-5 flex flex-wrap gap-4">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-2 ring-1 ring-white/15">
              <span className="text-lg font-bold">{docs.length}</span>
              <span className="ml-1.5 text-xs text-white/70">documentos</span>
            </div>
            {docsImportantes.length > 0 && (
              <div className="rounded-xl bg-red-500/30 backdrop-blur-sm px-4 py-2 ring-1 ring-red-300/30">
                <span className="text-lg font-bold">{docsImportantes.length}</span>
                <span className="ml-1.5 text-xs text-white/70">importantes</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input oculto para archivos adicionales */}
      <input ref={extraFileRef} type="file" accept={ALL_ACCEPT} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f && addingFileTo !== null) { const doc = docs.find((d) => d.id === addingFileTo); if (doc) handleAddExtraFile(doc, f); } }} />

      {/* Formulario nuevo documento */}
      {showForm && (
        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-b from-amber-50/40 to-white p-6 shadow-lg shadow-amber-100/30 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <h3 className="text-lg font-bold text-foreground">Nuevo documento</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nombre *</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Guía de embellecimiento de fachadas"
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-primary/20 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo *</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoDoc)}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm shadow-sm">
                {TIPOS_DISPONIBLES.map((t) => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
              </select>
            </div>
            {tipo === 'ORDENANZA' && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Temática *</label>
                <select value={tema} onChange={(e) => setTema(e.target.value as TemaOrdenanza)}
                  className="w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm shadow-sm">
                  {(Object.keys(TEMA_ORDENANZA_LABELS) as TemaOrdenanza[]).map((t) => (
                    <option key={t} value={t}>{TEMA_ORDENANZA_LABELS[t]}</option>
                  ))}
                </select>
              </div>
            )}
            {tipo === 'CARTEL' && (
              <div className="sm:col-span-2 rounded-xl border border-green-200 bg-green-50 px-5 py-3">
                <p className="text-sm text-green-800"><strong>Carteles de carretera y señalización.</strong> Se aceptan formatos de diseño (AI, EPS, PSD, InDesign) además de PDF e imagen.</p>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descripción</label>
              <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                placeholder={tipo === 'CARTEL' ? 'Ej: Cartel entrada al pueblo — medidas 120×80 cm' : 'Breve descripción del contenido'}
                rows={3} className="w-full resize-y rounded-xl border border-border px-4 py-2.5 text-sm shadow-sm" />
            </div>
            <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${destacado ? 'bg-red-500' : 'bg-gray-300'}`}
                  onClick={() => setDestacado(!destacado)}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${destacado ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm font-semibold text-foreground">Marcar como Importante</span>
              </label>
              <p className="mt-1 ml-14 text-xs text-muted-foreground">Aparecerá destacado en rojo con aviso para todos los alcaldes.</p>
              {destacado && (
                <div className="mt-3 ml-14">
                  <select value={duracionDestacado} onChange={(e) => setDuracionDestacado(e.target.value)}
                    className="w-48 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 shadow-sm">
                    <option value="1w">1 semana</option>
                    <option value="2w">2 semanas</option>
                    <option value="1m">1 mes</option>
                    <option value="3m">3 meses</option>
                    <option value="indefinido">Sin fecha límite</option>
                  </select>
                </div>
              )}
            </div>
          </div>
          {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center pt-2 border-t border-border/50">
            <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-white px-5 py-2.5 text-sm font-semibold hover:bg-muted hover:border-primary/30 disabled:opacity-50 transition-all">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              Seleccionar archivo
            </button>
            <button type="button" disabled={uploading || !pendingFile} onClick={() => void submitNewAssociationDoc()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:from-primary/90 hover:to-primary/80 disabled:pointer-events-none disabled:opacity-50 shadow-sm transition-all active:scale-95">
              {uploading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Guardando…</> : 'Guardar documento'}
            </button>
            {pendingFile && (
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200">
                <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="truncate text-sm font-medium text-emerald-700">{pendingFile.name}</span>
                <button type="button" disabled={uploading} onClick={() => { setPendingFile(null); setError(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="shrink-0 ml-auto text-xs font-semibold text-red-600 hover:text-red-700">Quitar</button>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground sm:ml-auto">PDF, imagen, Word, Excel, ZIP, AI, EPS, PSD, TIFF…</p>
          </div>
          <input ref={fileRef} type="file" accept={ALL_ACCEPT} className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPendingFile(f); setError(null); } e.target.value = ''; }} />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-4 border-stone-200" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-stone-500 animate-spin" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Cargando documentos…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && docs.length === 0 && !showForm && (
        <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white p-16 text-center ring-1 ring-slate-100">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 shadow-inner">
            <svg className="h-7 w-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-semibold text-foreground">Sin documentos todavía</p>
          <p className="mt-1.5 text-sm text-muted-foreground">Pulsa "Subir documento" para añadir el primero.</p>
        </div>
      )}

      {/* Documentos importantes */}
      {!loading && docsImportantes.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500 shadow-sm shadow-red-200">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
            </div>
            <h3 className="text-lg font-bold text-red-700">Importantes</h3>
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">{docsImportantes.length}</span>
          </div>
          <div className="flex flex-col gap-3">
            {docsImportantes.map(renderDocCard)}
          </div>
        </section>
      )}

      {/* Documentos normales */}
      {!loading && docsNormales.length > 0 && (
        <section>
          {docsImportantes.length > 0 && (
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-sm shadow-amber-200">
                <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">Biblioteca</h3>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">{docsNormales.length}</span>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {docsNormales.map(renderDocCard)}
          </div>
        </section>
      )}
    </div>
  );
}
