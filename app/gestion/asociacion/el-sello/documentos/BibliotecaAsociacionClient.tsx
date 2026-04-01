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

const TIPOS_DISPONIBLES: TipoDoc[] = ['PAPELERIA', 'ORDENANZA', 'OTRO'];

function FileIcon({ url }: { url: string }) {
  if (isImageUrl(url)) return <span>🖼️</span>;
  if (isPdfUrl(url)) return <span className="text-red-500">📄</span>;
  return <span>📎</span>;
}

export default function BibliotecaAsociacionClient() {
  const [docs, setDocs] = useState<DocumentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // form
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<TipoDoc>('OTRO');
  const [tema, setTema] = useState<TemaOrdenanza>('GENERAL_OTROS');
  const [showForm, setShowForm] = useState(false);

  async function fetchDocs() {
    setLoading(true); setError(null);
    try {
      // Docs de asociación: fuente=ASOCIACION y compartidos
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
    if (!confirm('¿Eliminar este documento de la biblioteca?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/documentos-pueblo/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error eliminando');
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (e) { alert(e instanceof Error ? e.message : 'Error'); }
    finally { setDeleting(null); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Biblioteca compartida — Asociación</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Documentos que la asociación sube para compartir con todos los alcaldes de la red. Aparecen en la página de documentos compartidos con la insignia "Asociación LPBME".
          </p>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)}
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          {showForm ? 'Cancelar' : '+ Subir documento'}
        </button>
      </div>

      {/* Formulario */}
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
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 overflow-hidden text-lg">
                {isImageUrl(doc.url) ? <img src={doc.url} alt={doc.nombre} className="h-full w-full object-contain" /> : <FileIcon url={doc.url} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{doc.nombre}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${TIPO_COLORS[doc.tipo]}`}>{TIPO_LABELS[doc.tipo]}</span>
                  {doc.temaOrdenanza && <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">{TEMA_ORDENANZA_LABELS[doc.temaOrdenanza]}</span>}
                  {doc.descripcion && <span className="text-[10px] text-muted-foreground truncate max-w-xs">{doc.descripcion}</span>}
                  <span className="text-[10px] text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString('es')}</span>
                </div>
              </div>
              <a href={doc.url} download target="_blank" rel="noopener noreferrer"
                className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted">Descargar</a>
              <button type="button" disabled={deleting === doc.id} onClick={() => handleDelete(doc.id)}
                className="shrink-0 rounded-md border border-red-200 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50">
                {deleting === doc.id ? '...' : '✕'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
