'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type EditarEventoClientProps = {
  id: string;
};

export default function EditarEventoClient({ id }: EditarEventoClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/gestion/asociacion/notificaciones/${id}`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          setError('No se pudo cargar el evento');
          return;
        }

        const data = await res.json();
        setTitulo(data.titulo ?? '');
        setContenido(data.contenido ?? '');
        setCoverUrl(data.coverUrl ?? null);

        // Parsear fechas ISO a YYYY-MM-DD
        if (data.fecha_inicio) {
          const d = new Date(data.fecha_inicio);
          setFechaInicio(d.toISOString().split('T')[0]);
        }
        if (data.fecha_fin) {
          const d = new Date(data.fecha_fin);
          setFechaFin(d.toISOString().split('T')[0]);
        }
      } catch (e: any) {
        setError(e?.message ?? 'Error al cargar');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const t = titulo.trim();
    if (!t) return setError('Título requerido');

    setSaving(true);
    try {
      // 1. Si hay nueva foto, subirla
      let newCoverUrl = coverUrl;

      if (file) {
        try {
          const { uploadImageToR2 } = await import("@/src/lib/uploadHelper");
          const { url, warning } = await uploadImageToR2(file, 'eventos-global', '/api/media/upload');
          if (warning) console.warn("[EditarEvento]", warning);
          newCoverUrl = url;
        } catch (e: any) {
          setError(`Error subiendo foto: ${e?.message || 'Error desconocido'}`);
          setSaving(false);
          return;
        }
      }

      // 2. Actualizar evento
      const payload: any = {
        titulo: t,
        contenido,
        fecha_inicio: fechaInicio ? new Date(fechaInicio + 'T00:00:00.000Z').toISOString() : null,
        fecha_fin: fechaFin ? new Date(fechaFin + 'T00:00:00.000Z').toISOString() : null,
      };
      if (newCoverUrl) payload.coverUrl = newCoverUrl;

      const res = await fetch(`/api/gestion/asociacion/notificaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'No se pudo actualizar');
        return;
      }

      router.replace('/gestion/asociacion/eventos');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p>Cargando…</p>
      </main>
    );
  }

  if (error && !titulo) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Editar evento</h1>

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

        {coverUrl && coverUrl.trim() && !file && (
          <div>
            <label className="block text-sm font-medium mb-2">Foto actual</label>
            <img
              src={coverUrl.trim()}
              alt="Portada actual"
              className="h-32 w-auto rounded object-cover"
            />
          </div>
        )}

        <div>
          <label className="block font-medium mt-6">
            {coverUrl ? 'Cambiar foto (portada)' : 'Foto (portada)'}
          </label>
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
