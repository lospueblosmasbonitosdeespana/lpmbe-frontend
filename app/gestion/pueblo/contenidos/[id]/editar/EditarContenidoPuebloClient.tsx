'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import CoverPicker from '@/app/_components/media/CoverPicker';
import MarkdownEditor from '@/app/_components/editor/MarkdownEditor';
import ImageManager from '@/app/_components/editor/ImageManager';
import { toDatetimeLocal, datetimeLocalToIsoUtc } from '@/app/_lib/dates';

type EditarContenidoPuebloClientProps = {
  id: string;
};

type UploadedImage = {
  url: string;
  name: string;
};

export default function EditarContenidoPuebloClient({ id }: EditarContenidoPuebloClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const puebloId = searchParams.get('puebloId');
  const puebloNombre = searchParams.get('puebloNombre');

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState('NOTICIA');
  const [categoria, setCategoria] = useState('');
  const [titulo, setTitulo] = useState('');
  const [resumen, setResumen] = useState('');
  const [contenidoMd, setContenidoMd] = useState('');
  const [estado, setEstado] = useState('BORRADOR');
  const [publishedAt, setPublishedAt] = useState('');
  const [fechaInicioLocal, setFechaInicioLocal] = useState('');
  const [fechaFinLocal, setFechaFinLocal] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    (async () => {
      try {
        // FIX: Llamar al proxy correcto de PUEBLO
        const res = await fetch(`/api/gestion/pueblo/contenidos/${id}`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          setError('No se pudo cargar el contenido');
          return;
        }

        const data = await res.json();
        setTipo(data.tipo ?? 'NOTICIA');
        setCategoria(data.categoria ?? '');
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

  async function handleUploadImages() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;

    fileInput.onchange = async (e: any) => {
      const files = Array.from(e.target.files || []) as File[];
      if (files.length === 0) return;

      const oversized = files.find(f => f.size > 25 * 1024 * 1024);
      if (oversized) {
        alert(`La imagen "${oversized.name}" pesa demasiado (máx 25MB).`);
        return;
      }

      setUploading(true);
      try {
        const fd = new FormData();
        files.forEach(file => fd.append('files', file));
        fd.append('folder', 'contenidos');

        const res = await fetch('/api/media/upload-multiple', { method: 'POST', body: fd });
        if (!res.ok) {
          const msg = await res.text();
          alert(`Error subiendo imágenes: ${msg}`);
          return;
        }

        const json = await res.json();
        const images = json?.images ?? [];

        const newImages = images.map((img: any, idx: number) => ({
          url: img.url,
          name: files[idx]?.name || `imagen-${idx + 1}`,
        }));

        setUploadedImages((prev) => [...prev, ...newImages]);
      } catch (e: any) {
        alert(e?.message ?? 'Error subiendo imágenes');
      } finally {
        setUploading(false);
      }
    };

    fileInput.click();
  }

  async function handleDelete() {
    if (!confirm('¿Borrar esta página temática?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/gestion/pueblo/contenidos/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.message ?? 'Error al borrar');
        return;
      }

      alert('Página borrada correctamente');
      router.push(`/gestion/pueblo/contenidos?puebloId=${puebloId}&puebloNombre=${puebloNombre}`);
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? 'Error');
    } finally {
      setDeleting(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!titulo.trim()) return setError('Título requerido');

    setSaving(true);
    try {
      // 1. Subir cover si existe
      let newCoverUrl: string | null = coverUrl;

      if (coverFile) {
        if (coverFile.size > 25 * 1024 * 1024) {
          setError('La imagen de portada pesa demasiado (máx 25MB)');
          setSaving(false);
          return;
        }

        const fd = new FormData();
        fd.append('file', coverFile);
        fd.append('folder', 'contenidos');

        const up = await fetch('/api/media/upload', { method: 'POST', body: fd });
        if (!up.ok) {
          const msg = await up.text();
          setError(`Error subiendo portada: ${msg}`);
          setSaving(false);
          return;
        }
        const upJson = await up.json();
        newCoverUrl = upJson?.url ?? upJson?.publicUrl ?? null;
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

      const res = await fetch(`/api/gestion/pueblo/contenidos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'No se pudo actualizar');
        return;
      }

      alert('Contenido actualizado correctamente');
      router.push(`/gestion/pueblo/contenidos?puebloId=${puebloId}&puebloNombre=${puebloNombre}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-gray-600">Cargando...</p>
      </main>
    );
  }

  if (error && !tipo) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          ← Volver
        </button>
      </main>
    );
  }

  const isPaginaTematica = String(id ?? '').startsWith('page-');

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">
        Editar contenido · {puebloNombre || 'Pueblo'}
      </h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {!isPaginaTematica && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Tipo</label>
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2 bg-gray-50"
              value={tipo}
              disabled
            />
          </div>
        )}

        {isPaginaTematica && (
          <div className="rounded-md border border-purple-200 bg-purple-50 p-4">
            <p className="text-sm font-medium text-purple-900">
              Página temática: {categoria}
            </p>
            <p className="text-xs text-purple-700 mt-1">
              Esta es una página temática del pueblo.
            </p>
          </div>
        )}

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
          <label className="block text-sm font-medium">Resumen (opcional)</label>
          <textarea
            className="w-full rounded-md border px-3 py-2"
            rows={3}
            value={resumen}
            onChange={(e) => setResumen(e.target.value)}
            placeholder="Descripción corta del contenido"
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
            {!isPaginaTematica && <option value="PROGRAMADA">Programada</option>}
            <option value="PUBLICADA">Publicada</option>
          </select>
        </div>

        {estado === 'PROGRAMADA' && !isPaginaTematica && (
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
          </div>
        )}

        {tipo === 'EVENTO' && !isPaginaTematica && (
          <div className="space-y-4 rounded-md border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-900">
              Fechas del evento
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

        <div className="space-y-2">
          <label className="block text-sm font-medium">Foto de portada</label>
          <CoverPicker onFileSelected={(file) => setCoverFile(file)} />
          
          {/* Preview de portada existente */}
          {coverUrl && coverUrl.trim() && (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl.trim()}
                alt="Portada actual"
                className="max-w-[240px] rounded border"
              />
              <button
                type="button"
                onClick={() => setCoverUrl(null)}
                className="mt-2 text-sm text-red-600 hover:underline"
              >
                Quitar portada
              </button>
            </div>
          )}
        </div>

        <MarkdownEditor
          value={contenidoMd}
          onChange={setContenidoMd}
          uploading={uploading}
          onUploadImages={handleUploadImages}
          textareaRef={textareaRef}
        />

        <ImageManager
          images={uploadedImages}
          defaultAlt={titulo || 'Imagen'}
          onInsertAtCursor={(md) => {
            if (textareaRef.current) {
              const textarea = textareaRef.current;
              const start = textarea.selectionStart;
              const before = contenidoMd.substring(0, start);
              const after = contenidoMd.substring(textarea.selectionEnd);
              setContenidoMd(before + md + after);
              setTimeout(() => {
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = start + md.length;
              }, 0);
            } else {
              setContenidoMd(contenidoMd + md);
            }
          }}
          onAppendToEnd={(md) => setContenidoMd(contenidoMd + md)}
          onClear={() => setUploadedImages([])}
        />

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

          {/* Botón BORRAR para páginas temáticas */}
          {isPaginaTematica && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="ml-auto rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Borrando…' : 'Borrar página temática'}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
