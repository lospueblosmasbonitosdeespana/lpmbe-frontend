'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import TipTapEditor from '@/app/_components/editor/TipTapEditor';
import SafeHtml from '@/app/_components/ui/SafeHtml';

type EditorMode = 'edit' | 'html' | 'preview';

type EditarNoticiaClientProps = {
  id: string;
};

export default function EditarNoticiaClient({ id }: EditarNoticiaClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/gestion/asociacion/notificaciones/${id}`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          setError('No se pudo cargar la noticia');
          return;
        }

        const data = await res.json();
        setTitulo(data.titulo ?? '');
        setContenido(data.contenido ?? '');
        setCoverUrl(data.coverUrl ?? null);
      } catch (e: any) {
        setError(e?.message ?? 'Error al cargar');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const t = titulo.trim();
    if (!t) return setError('Título requerido');

    setSaving(true);
    try {
      // 1. Si hay nueva foto, subirla
      let newCoverUrl = coverUrl;

      if (file) {
        try {
          const { uploadImageToR2 } = await import("@/src/lib/uploadHelper");
          const { url, warning } = await uploadImageToR2(file, 'noticias-global', '/api/media/upload');
          if (warning) console.warn("[EditarNoticia]", warning);
          newCoverUrl = url;
        } catch (e: any) {
          setError(`Error subiendo foto: ${e?.message || 'Error desconocido'}`);
          setSaving(false);
          return;
        }
      }

      // 2. Actualizar noticia
      const payload: any = { titulo: t, contenido };
      if (newCoverUrl) payload.coverUrl = newCoverUrl;

      const res = await fetch(`/api/gestion/asociacion/notificaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'No se pudo actualizar');
        return;
      }

      router.replace('/gestion/asociacion/noticias');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p>Cargando…</p>
      </main>
    );
  }

  if (error && !titulo) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Editar noticia</h1>

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
          <label className="block text-sm font-medium">Contenido</label>
          <div className="flex gap-2 mb-3">
            <button type="button" onClick={() => setEditorMode('edit')}
              className={`px-3 py-1.5 rounded text-sm font-medium ${editorMode === 'edit' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Editor
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

        {coverUrl && coverUrl.trim() && !file && (
          <div>
            <label className="block text-sm font-medium mb-2">Foto actual</label>
            <img
              src={coverUrl.trim()}
              alt="Portada actual"
              className="h-32 w-auto rounded object-cover"
            />
          </div>
        )}

        <div>
          <label className="block font-medium mt-6">
            {coverUrl ? 'Cambiar foto (portada)' : 'Foto (portada)'}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-2 block w-full text-sm"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Archivo seleccionado: <span className="font-medium">{file.name}</span>
            </p>
          )}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border px-4 py-2"
          >
            Cancelar
          </button>
        </div>
      </form>
    </main>
  );
}
