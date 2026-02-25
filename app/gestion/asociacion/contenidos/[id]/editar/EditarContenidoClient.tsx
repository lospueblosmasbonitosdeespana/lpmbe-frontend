'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import CoverPicker from '@/app/_components/media/CoverPicker';
import TipTapEditor from '@/app/_components/editor/TipTapEditor';
import SafeHtml from '@/app/_components/ui/SafeHtml';
import { toDatetimeLocal, datetimeLocalToIsoUtc } from '@/app/_lib/dates';

type EditorMode = 'edit' | 'html' | 'preview';

type EditarContenidoClientProps = {
  id: string;
};

export default function EditarContenidoClient({ id }: EditarContenidoClientProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState('NOTICIA');
  const [titulo, setTitulo] = useState('');
  const [resumen, setResumen] = useState('');
  const [contenidoMd, setContenidoMd] = useState('');
  const [estado, setEstado] = useState('BORRADOR');
  const [publishedAt, setPublishedAt] = useState('');
  const [fechaInicioLocal, setFechaInicioLocal] = useState('');
  const [fechaFinLocal, setFechaFinLocal] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/gestion/asociacion/contenidos/${id}`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          setError('No se pudo cargar el contenido');
          return;
        }

        const data = await res.json();
        setTipo(data.tipo ?? 'NOTICIA');
        setTitulo(data.titulo ?? '');
        setResumen(data.resumen ?? '');
        setContenidoMd(data.contenidoMd ?? '');
        setEstado(data.estado ?? 'BORRADOR');
        setCoverUrl(data.coverUrl ?? null);

        if (data.publishedAt) {
          setPublishedAt(toDatetimeLocal(data.publishedAt));
        }
        
        if (data.fechaInicio) {
          setFechaInicioLocal(toDatetimeLocal(data.fechaInicio));
        }
        if (data.fechaFin) {
          setFechaFinLocal(toDatetimeLocal(data.fechaFin));
        }
      } catch (e: any) {
        setError(e?.message ?? 'Error al cargar');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleUploadEditorImage(file: File): Promise<string> {
    setUploading(true);
    try {
      const { uploadImageToR2 } = await import("@/src/lib/uploadHelper");
      const { url } = await uploadImageToR2(file, 'contenidos', '/api/media/upload');
      return url;
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!titulo.trim()) return setError('Título requerido');

    if (estado === 'PROGRAMADA' && !publishedAt) {
      return setError('Selecciona fecha y hora de publicación');
    }

    // Validar fecha futura para PROGRAMADA
    if (estado === 'PROGRAMADA' && publishedAt) {
      const selectedDate = new Date(publishedAt);
      if (selectedDate < new Date()) {
        return setError('La fecha y hora de publicación debe ser futura');
      }
    }

    // Validar fechas del evento
    if (tipo === 'EVENTO') {
      if (!fechaInicioLocal) {
        return setError('Selecciona inicio del evento');
      }
      if (fechaFinLocal) {
        const inicio = new Date(fechaInicioLocal);
        const fin = new Date(fechaFinLocal);
        if (fin < inicio) {
          return setError('El fin debe ser posterior al inicio');
        }
      }
    }

    setSaving(true);
    try {
      // 1. Subir nueva cover si existe
      let newCoverUrl = coverUrl;

      if (coverFile) {
        try {
          const { uploadImageToR2 } = await import("@/src/lib/uploadHelper");
          const { url } = await uploadImageToR2(coverFile, 'contenidos', '/api/media/upload');
          newCoverUrl = url;
        } catch (e: any) {
          setError(`Error subiendo portada: ${e?.message || 'Error desconocido'}`);
          setSaving(false);
          return;
        }
      }

      // 2. Actualizar contenido
      const payload: any = {
        tipo,
        titulo: titulo.trim(),
        resumen: resumen.trim() || null,
        contenidoMd,
        estado,
      };
      if (newCoverUrl) payload.coverUrl = newCoverUrl;
      if (estado === 'PROGRAMADA' && publishedAt) {
        payload.publishedAt = datetimeLocalToIsoUtc(publishedAt);
      }
      // Añadir fechas del evento
      if (tipo === 'EVENTO' && fechaInicioLocal) {
        payload.fechaInicio = datetimeLocalToIsoUtc(fechaInicioLocal);
        if (fechaFinLocal) {
          payload.fechaFin = datetimeLocalToIsoUtc(fechaFinLocal);
        }
      }

      const res = await fetch(`/api/gestion/asociacion/contenidos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'No se pudo actualizar');
        return;
      }

      router.replace('/gestion/asociacion/contenidos');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p>Cargando…</p>
      </main>
    );
  }

  if (error && !titulo) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Editar contenido</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Tipo</label>
          <select
            className="w-full rounded-md border px-3 py-2"
            value={tipo}
            onChange={(e) => {
              const newTipo = e.target.value;
              setTipo(newTipo);
              // Reset fechas del evento si deja de ser EVENTO
              if (newTipo !== 'EVENTO') {
                setFechaInicioLocal('');
                setFechaFinLocal('');
              }
            }}
          >
            <option value="NOTICIA">Noticia</option>
            <option value="EVENTO">Evento</option>
            <option value="ARTICULO">Artículo</option>
            <option value="PAGINA">Página</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Título</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Subtítulo o entradilla (opcional)</label>
          <p className="text-xs text-gray-500">Frase corta que aparece destacada debajo del título. No sustituye al contenido principal.</p>
          <textarea
            className="w-full rounded-md border px-3 py-2"
            rows={2}
            value={resumen}
            onChange={(e) => setResumen(e.target.value)}
            placeholder="Ej: La asociación celebró su XIII Asamblea en Santillana del Mar."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Estado</label>
          <select
            className="w-full rounded-md border px-3 py-2"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="BORRADOR">Borrador</option>
            <option value="PROGRAMADA">Programada</option>
            <option value="PUBLICADA">Publicada</option>
          </select>
        </div>

        {estado === 'PROGRAMADA' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Fecha y hora de publicación
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              required
            />
            <p className="text-xs text-gray-600">
              Se publicará automáticamente a esa hora. Puedes cambiarlo cuando quieras.
            </p>
          </div>
        )}

        {tipo === 'EVENTO' && (
          <div className="space-y-4 rounded-md border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-900">
              Fechas del evento
            </p>
            <p className="text-xs text-blue-700">
              Estas fechas son del evento (no de la publicación).
            </p>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Inicio del evento
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-md border px-3 py-2"
                value={fechaInicioLocal}
                onChange={(e) => setFechaInicioLocal(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Fin del evento (opcional)
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-md border px-3 py-2"
                value={fechaFinLocal}
                onChange={(e) => setFechaFinLocal(e.target.value)}
              />
            </div>
          </div>
        )}

        {coverUrl && coverUrl.trim() && !coverFile && (
          <div>
            <label className="block text-sm font-medium mb-2">Foto actual</label>
            <img
              src={coverUrl.trim()}
              alt="Portada actual"
              className="h-32 w-auto rounded object-cover"
            />
          </div>
        )}

        <CoverPicker
          currentCoverUrl={coverUrl}
          onFileSelected={(file) => setCoverFile(file)}
        />

        {/* SISTEMA DE 3 MODOS: Editor TipTap, HTML directo, Vista previa */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Contenido</label>

          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setEditorMode('edit')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                editorMode === 'edit' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Editor
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('html')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                editorMode === 'html' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              HTML
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('preview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                editorMode === 'preview' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Vista previa
            </button>
            {uploading && <span className="text-sm text-gray-500 self-center">Subiendo imagen…</span>}
          </div>

          {editorMode === 'edit' && (
            <TipTapEditor
              content={contenidoMd}
              onChange={(html) => setContenidoMd(html)}
              onUploadImage={handleUploadEditorImage}
              placeholder="Escribe el contenido..."
              minHeight="400px"
            />
          )}

          {editorMode === 'html' && (
            <div className="space-y-2">
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                Modo HTML: edita o pega código HTML directamente.
              </p>
              <textarea
                value={contenidoMd}
                onChange={(e) => setContenidoMd(e.target.value)}
                rows={20}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm"
                placeholder="<h2>Título</h2>\n<p>Párrafo...</p>"
              />
            </div>
          )}

          {editorMode === 'preview' && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 min-h-[400px]">
              {contenidoMd ? (
                <SafeHtml html={contenidoMd} />
              ) : (
                <p className="text-gray-400 text-center py-12">Escribe contenido para ver la vista previa</p>
              )}
            </div>
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
