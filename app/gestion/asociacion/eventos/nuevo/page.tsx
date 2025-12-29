'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NuevoEventoGlobalPage() {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const t = titulo.trim();
    if (!t) return setError('Título requerido');

    setLoading(true);
    try {
      const res = await fetch('/api/gestion/asociacion/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: t,
          contenido,
          fecha_inicio: fechaInicio || null,
          fecha_fin: fechaFin || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'No se pudo crear');
        return;
      }

      router.replace('/gestion/asociacion/eventos');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Nuevo evento global</h1>

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
          <label className="block text-sm">Descripción</label>
          <textarea
            className="w-full rounded-md border px-3 py-2"
            rows={8}
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
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

      <div className="mt-6 text-sm">
        <a className="hover:underline" href="/gestion/asociacion/eventos">
          ← Volver
        </a>
      </div>
    </main>
  );
}

