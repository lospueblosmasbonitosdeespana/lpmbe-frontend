'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import TipTapEditor from '@/app/_components/editor/TipTapEditor';
import SafeHtml from '@/app/_components/ui/SafeHtml';

type EditorMode = 'edit' | 'html' | 'preview';

export default function NuevoEventoPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || '';
  const router = useRouter();

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const t = titulo.trim();
    if (!t) {
      setError('Título requerido');
      return;
    }

    setLoading(true);
    try {
      let imagen: string | null = null;

      if (file) {
        try {
          const { uploadImageToR2 } = await import("@/src/lib/uploadHelper");
          const { url, warning } = await uploadImageToR2(file, 'eventos-pueblo', '/api/media/upload');
          if (warning) console.warn("[Eventos pueblo]", warning);
          imagen = url;
        } catch (e: any) {
          setError(`Error subiendo foto: ${e?.message || 'Error desconocido'}`);
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/api/gestion/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          puebloSlug: slug,
          titulo: t,
          descripcion: descripcion.trim() || '',
          fecha_inicio: fechaInicio || null,
          fecha_fin: fechaFin || null,
          ...(imagen && { imagen }),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'No se pudo crear el evento');
        return;
      }

      router.replace(`/gestion/pueblos/${slug}/eventos`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Nuevo evento</h1>
      <p className="mt-1 text-sm text-gray-600">
        Pueblo: <strong>{slug}</strong>
      </p>

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
          <label className="block text-sm font-medium">Descripción</label>
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
            <TipTapEditor content={descripcion} onChange={setDescripcion}
              onUploadImage={async (f) => { setUploading(true); try { const { uploadImageToR2 } = await import('@/src/lib/uploadHelper'); const { url } = await uploadImageToR2(f, 'eventos-pueblo', '/api/media/upload'); return url; } finally { setUploading(false); } }}
              placeholder="Describe el evento..." minHeight="250px" />
          )}
          {editorMode === 'html' && (
            <textarea className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm"
              rows={10} value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
              placeholder="<p>Descripción HTML...</p>" />
          )}
          {editorMode === 'preview' && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 min-h-[150px]">
              {descripcion ? <SafeHtml html={descripcion} /> : <p className="text-gray-400 text-center py-8">Sin descripción</p>}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm">Imagen (opcional)</label>
          <input
            type="file"
            accept="image/*"
            className="w-full rounded-md border px-3 py-2"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm">Fecha inicio</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm">Fecha fin</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button className="rounded-md border px-3 py-2" disabled={loading} type="submit">
          {loading ? 'Creando…' : 'Crear'}
        </button>
      </form>
    </main>
  );
}





