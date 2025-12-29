'use client';

import { useRouter } from 'next/navigation';
import { useState, use } from 'react';

export default function NuevaAlertaPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const t = titulo.trim();
    if (!t) return setError('Título requerido');

    setLoading(true);
    try {
      const res = await fetch('/api/gestion/pueblos/alertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puebloSlug: slug,
          titulo: t,
          contenido,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'No se pudo crear');
        return;
      }

      router.replace(`/gestion/pueblos/${slug}/alertas`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Nueva alerta</h1>
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
            rows={10}
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
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





