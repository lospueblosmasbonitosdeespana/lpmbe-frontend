'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import CoverPicker from '@/app/_components/media/CoverPicker';

type EditarContenidoClientProps = {
  id: string;
};

export default function EditarContenidoClient({ id }: EditarContenidoClientProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState('NOTICIA');
  const [titulo, setTitulo] = useState('');
  const [resumen, setResumen] = useState('');
  const [contenidoMd, setContenidoMd] = useState('');
  const [estado, setEstado] = useState('BORRADOR');
  const [scheduledAt, setScheduledAt] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

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

        if (data.scheduledAt) {
          const d = new Date(data.scheduledAt);
          setScheduledAt(d.toISOString().split('T')[0]);
        }
      } catch (e: any) {
        setError(e?.message ?? 'Error al cargar');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleInsertImage() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true; // MÚLTIPLES ARCHIVOS

    fileInput.onchange = async (e: any) => {
      const files = Array.from(e.target.files || []) as File[];
      if (files.length === 0) return;

      // Control de tamaño por archivo
      const oversized = files.find(f => f.size > 25 * 1024 * 1024);
      if (oversized) {
        alert(`La imagen "${oversized.name}" pesa demasiado (máx 25MB). Todas deben ser menores a 25MB.`);
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

        if (images.length > 0 && textareaRef.current) {
          const textarea = textareaRef.current;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const text = textarea.value;

          const before = text.substring(0, start);
          const after = text.substring(end);
          
          // Construir bloque con todas las imágenes
          const imageLines = images.map((img: any) => `![imagen](${img.url})`).join('\n\n');
          const insert = `\n\n${imageLines}\n\n`;

          const newText = before + insert + after;
          setContenidoMd(newText);

          // Mover cursor después de la inserción
          setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + insert.length;
          }, 0);
        }
      } catch (e: any) {
        alert(e?.message ?? 'Error subiendo imágenes');
      } finally {
        setUploading(false);
      }
    };

    fileInput.click();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!titulo.trim()) return setError('Título requerido');

    setSaving(true);
    try {
      // 1. Subir nueva cover si existe
      let newCoverUrl = coverUrl;

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
      if (estado === 'PROGRAMADA' && scheduledAt) {
        payload.scheduledAt = new Date(scheduledAt + 'T00:00:00.000Z').toISOString();
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
            onChange={(e) => setTipo(e.target.value)}
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
            <option value="PROGRAMADA">Programada</option>
            <option value="PUBLICADA">Publicada</option>
          </select>
        </div>

        {estado === 'PROGRAMADA' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Fecha de publicación</label>
            <input
              type="date"
              className="w-full rounded-md border px-3 py-2"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
        )}

        {coverUrl && !coverFile && (
          <div>
            <label className="block text-sm font-medium mb-2">Foto actual</label>
            <img
              src={coverUrl}
              alt="Portada actual"
              className="h-32 w-auto rounded object-cover"
            />
          </div>
        )}

        <CoverPicker
          currentCoverUrl={coverUrl}
          onFileSelected={(file) => setCoverFile(file)}
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium">Contenido (Markdown)</label>
          
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={handleInsertImage}
              disabled={uploading}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {uploading ? 'Subiendo imágenes...' : '📷 Insertar imagen(es)'}
            </button>
          </div>

          <textarea
            ref={textareaRef}
            className="w-full rounded-md border px-3 py-2 font-mono text-sm"
            rows={20}
            value={contenidoMd}
            onChange={(e) => setContenidoMd(e.target.value)}
            placeholder="Escribe aquí el contenido en Markdown..."
          />
          <p className="text-xs text-gray-500">
            Usa Markdown: **negrita**, - lista, [texto](url), ![alt](imagen-url). Puedes seleccionar múltiples imágenes.
          </p>
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
