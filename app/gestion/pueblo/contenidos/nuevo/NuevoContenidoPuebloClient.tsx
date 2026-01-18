'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

type NuevoContenidoPuebloClientProps = {
  puebloId: number;
  puebloNombre: string;
};

export default function NuevoContenidoPuebloClient({ puebloId, puebloNombre }: NuevoContenidoPuebloClientProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [tipo, setTipo] = useState('NOTICIA');
  const [titulo, setTitulo] = useState('');
  const [resumen, setResumen] = useState('');
  const [contenidoMd, setContenidoMd] = useState('');
  const [estado, setEstado] = useState('BORRADOR');
  const [scheduledAt, setScheduledAt] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInsertImage() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 25 * 1024 * 1024) {
        alert('La imagen pesa demasiado (máx 25MB)');
        return;
      }

      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'contenidos');

        const res = await fetch('/api/media/upload', { method: 'POST', body: fd });
        if (!res.ok) {
          const msg = await res.text();
          alert(`Error subiendo imagen: ${msg}`);
          return;
        }

        const json = await res.json();
        const url = json?.url ?? json?.publicUrl ?? '';

        if (url && textareaRef.current) {
          const textarea = textareaRef.current;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const text = textarea.value;

          const before = text.substring(0, start);
          const after = text.substring(end);
          const insert = `\n\n![imagen](${url})\n\n`;

          const newText = before + insert + after;
          setContenidoMd(newText);

          setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + insert.length;
          }, 0);
        }
      } catch (e: any) {
        alert(e?.message ?? 'Error subiendo imagen');
      } finally {
        setUploading(false);
      }
    };

    fileInput.click();
  }

  function handleInsertGallery() {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const before = text.substring(0, start);
    const after = text.substring(end);
    
    const insert = `\n\n<!-- Galería: sube varias imágenes -->\n\n![imagen 1](URL_1)\n\n![imagen 2](URL_2)\n\n![imagen 3](URL_3)\n\n`;

    const newText = before + insert + after;
    setContenidoMd(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + insert.length;
    }, 0);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!titulo.trim()) return setError('Título requerido');

    setSaving(true);
    try {
      // 1. Subir cover si existe
      let coverUrl: string | null = null;

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
        coverUrl = upJson?.url ?? upJson?.publicUrl ?? null;
      }

      // 2. Crear contenido con puebloId
      const payload: any = {
        tipo,
        titulo: titulo.trim(),
        resumen: resumen.trim() || null,
        contenidoMd,
        estado,
        puebloId, // INYECTADO AUTOMÁTICAMENTE
      };
      if (coverUrl) payload.coverUrl = coverUrl;
      if (estado === 'PROGRAMADA' && scheduledAt) {
        payload.scheduledAt = new Date(scheduledAt + 'T00:00:00.000Z').toISOString();
      }

      const res = await fetch('/api/gestion/pueblo/contenidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'No se pudo crear');
        return;
      }

      router.replace('/gestion/pueblo/contenidos');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Nuevo contenido · {puebloNombre}</h1>

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

        <div>
          <label className="block font-medium mt-6">Foto de portada</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            className="mt-2 block w-full text-sm"
          />
          {coverFile && (
            <p className="mt-2 text-sm text-gray-600">
              Archivo seleccionado: <span className="font-medium">{coverFile.name}</span>
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Contenido (Markdown)</label>
          
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={handleInsertImage}
              disabled={uploading}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {uploading ? 'Subiendo...' : '📷 Insertar imagen'}
            </button>
            <button
              type="button"
              onClick={handleInsertGallery}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            >
              🖼️ Insertar galería
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
            Usa Markdown: **negrita**, - lista, [texto](url), ![alt](imagen-url)
          </p>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Crear contenido'}
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
