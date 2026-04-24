'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, use } from 'react';

const PRESETS = [
  { label: '3 días', days: 3 },
  { label: '7 días', days: 7 },
  { label: '10 días', days: 10, recomendado: true },
  { label: '15 días', days: 15 },
  { label: '30 días', days: 30 },
  { label: 'Sin caducidad', days: 0 },
];

export default function NuevaAlertaPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fechaCaducidadPreview = useMemo(() => {
    if (expiresInDays === 0) return null;
    const d = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [expiresInDays]);

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
        credentials: 'include',
        body: JSON.stringify({
          puebloSlug: slug,
          titulo: t,
          contenido,
          expiresInDays,
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
      <p className="mt-1 text-sm text-muted-foreground">
        Pueblo: <strong>{slug}</strong>
      </p>
      <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
        Las alertas llegan a <strong>todos los visitantes</strong> de la web y la app, estén o no
        suscritos. Úsalas sólo para avisos importantes y no habituales.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Título</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Obras en la carretera de acceso"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Contenido</label>
          <textarea
            className="w-full rounded-md border px-3 py-2"
            rows={8}
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            placeholder="Explica la incidencia, fechas aproximadas y qué debe hacer el visitante (desvío, alternativa, etc.)."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">
            ¿Cuánto tiempo debe estar visible la alerta?
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const active = expiresInDays === p.days;
              return (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => setExpiresInDays(p.days)}
                  className={[
                    'rounded-full border px-4 py-1.5 text-sm transition-all',
                    active
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {p.label}
                  {p.recomendado ? ' · recomendado' : ''}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {fechaCaducidadPreview
              ? `Desaparecerá automáticamente el ${fechaCaducidadPreview}.`
              : 'Permanecerá visible hasta que la elimines manualmente.'}
          </p>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex gap-2">
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Creando…' : 'Publicar alerta'}
          </button>
          <button
            type="button"
            className="rounded-md border px-4 py-2 text-sm"
            onClick={() => router.back()}
          >
            Cancelar
          </button>
        </div>
      </form>
    </main>
  );
}
