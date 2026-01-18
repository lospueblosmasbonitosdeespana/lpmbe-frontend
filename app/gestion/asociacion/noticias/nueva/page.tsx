'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NuevaNoticiaGlobalPage() {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const t = titulo.trim();
    if (!t) return setError('Título requerido');

    setLoading(true);
    try {
      // 1. Subir foto si existe
      let coverUrl: string | null = null;

      if (file) {
        // Control de tamaño (max 25MB)
        if (file.size > 25 * 1024 * 1024) {
          setError('La imagen pesa demasiado (máx 25MB). Prueba con JPG o reduce tamaño.');
          setLoading(false);
          return;
        }

        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'noticias-global');

        const up = await fetch('/api/media/upload', { method: 'POST', body: fd });
        if (!up.ok) {
          const msg = await up.text();
          setError(`Error subiendo foto: ${msg}`);
          setLoading(false);
          return;
        }
        const upJson = await up.json();
        coverUrl = upJson?.url ?? upJson?.publicUrl ?? null;
      }

      // 2. Crear noticia
      const payload: any = { titulo: t, contenido };
      if (coverUrl) payload.coverUrl = coverUrl;

      const res = await fetch('/api/gestion/asociacion/noticias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
          <label className="block text-sm">Contenido</label>
          <textarea
            className="w-full rounded-md border px-3 py-2"
            rows={10}
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mt-6">Foto (portada)</label>
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





