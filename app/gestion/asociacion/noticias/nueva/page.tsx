'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import TipTapEditor from '@/app/_components/editor/TipTapEditor';
import SafeHtml from '@/app/_components/ui/SafeHtml';
import ContentBlockBuilder from '@/app/_components/content-builder/ContentBlockBuilder';

type EditorMode = 'builder' | 'edit' | 'html' | 'preview';

export default function NuevaNoticiaGlobalPage() {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('builder');

  async function onCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const { uploadImageToR2 } = await import('@/src/lib/uploadHelper');
      const { url } = await uploadImageToR2(file, 'noticias-global', '/api/media/upload');
      setCoverUrl(url);
    } catch {
      setError('Error al subir la imagen de portada');
    } finally {
      setUploadingCover(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const t = titulo.trim();
    if (!t) return setError('Título requerido');

    setLoading(true);
    try {
      const res = await fetch('/api/gestion/asociacion/noticias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: t, contenido, coverUrl: coverUrl || null }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'No se pudo crear');
        return;
      }

      router.replace('/gestion/asociacion/noticias');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Nueva noticia global</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label className="block text-sm">Título</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Imagen de portada</label>
          <input
            type="file"
            accept="image/*"
            onChange={onCoverChange}
            disabled={uploadingCover}
            className="block text-sm text-gray-600 file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-gray-200"
          />
          {uploadingCover && <p className="text-xs text-gray-500">Subiendo imagen…</p>}
          {coverUrl && (
            <div className="mt-2 flex items-center gap-3">
              <img src={coverUrl} alt="Portada" className="h-20 w-32 rounded-md object-cover border" />
              <button type="button" onClick={() => setCoverUrl('')} className="text-xs text-red-600 hover:underline">
                Quitar imagen
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Contenido</label>
          <div className="flex flex-wrap gap-2 mb-3">
            <button type="button" onClick={() => setEditorMode('builder')}
              className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 text-left transition-all ${editorMode === 'builder' ? 'border-primary bg-primary text-primary-foreground shadow-md' : 'border-border bg-background hover:border-primary/50 hover:bg-muted/40'}`}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
              </svg>
              <span>
                <span className="block text-sm font-bold leading-tight">Constructor visual</span>
                <span className={`block text-xs leading-tight ${editorMode === 'builder' ? 'opacity-80' : 'text-muted-foreground'}`}>Bloques arrastrables estilo MDirector</span>
              </span>
            </button>
            <button type="button" onClick={() => setEditorMode('edit')}
              className={`px-3 py-1.5 rounded text-sm font-medium ${editorMode === 'edit' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Editor TipTap
            </button>
            <button type="button" onClick={() => setEditorMode('html')}
              className={`px-3 py-1.5 rounded text-sm font-medium ${editorMode === 'html' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              HTML
            </button>
            <button type="button" onClick={() => setEditorMode('preview')}
              className={`px-3 py-1.5 rounded text-sm font-medium ${editorMode === 'preview' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Vista previa
            </button>
            {uploading && <span className="text-sm text-gray-500 self-center">Subiendo…</span>}
          </div>
          <p className="text-xs text-blue-700 bg-blue-50 rounded-md px-3 py-1.5">
            Al guardar, el contenido se traduce automáticamente a 7 idiomas con DeepL para SEO multilingüe.
          </p>
          {editorMode === 'builder' && (
            <ContentBlockBuilder
              draftKey="lpmbe-noticia-global-draft"
              initialHtml={contenido}
              onChange={(html) => setContenido(html)}
            />
          )}
          {editorMode === 'edit' && (
            <TipTapEditor content={contenido} onChange={setContenido}
              onUploadImage={async (f) => { setUploading(true); try { const { uploadImageToR2 } = await import('@/src/lib/uploadHelper'); const { url } = await uploadImageToR2(f, 'noticias-global', '/api/media/upload'); return url; } finally { setUploading(false); } }}
              placeholder="Escribe el contenido..." minHeight="300px" />
          )}
          {editorMode === 'html' && (
            <textarea className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm"
              rows={15} value={contenido} onChange={(e) => setContenido(e.target.value)}
              placeholder="<p>Contenido HTML...</p>" />
          )}
          {editorMode === 'preview' && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 min-h-[200px]">
              {contenido ? <SafeHtml html={contenido} /> : <p className="text-gray-400 text-center py-8">Sin contenido</p>}
            </div>
          )}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button className="rounded-md border px-3 py-2" disabled={loading} type="submit">
          {loading ? 'Creando…' : 'Crear'}
        </button>
      </form>

      <div className="mt-6 text-sm">
        <a className="hover:underline" href="/gestion/asociacion/noticias">
          ← Volver
        </a>
      </div>
    </main>
  );
}





