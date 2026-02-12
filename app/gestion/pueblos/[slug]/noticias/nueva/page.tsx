'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';

export default function NuevaNoticiaPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || '';
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          const { url, warning } = await uploadImageToR2(file, 'noticias-pueblo', '/api/media/upload');
          if (warning) console.warn("[Noticias pueblo]", warning);
          imagen = url;
        } catch (e: any) {
          setError(`Error subiendo foto: ${e?.message || 'Error desconocido'}`);
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/api/gestion/noticias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          puebloSlug: slug,
          titulo: t,
          contenido: contenido.trim() || '',
          ...(imagen && { imagen }),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'No se pudo crear la noticia');
        return;
      }

      router.replace(`/gestion/pueblos/${slug}/noticias`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Nueva noticia</h1>
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
          <label className="block text-sm">Contenido</label>
          <textarea
            className="w-full rounded-md border px-3 py-2"
            rows={8}
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            required
          />
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

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button className="rounded-md border px-3 py-2" disabled={loading} type="submit">
          {loading ? 'Creando…' : 'Crear'}
        </button>
      </form>
    </main>
  );
}

