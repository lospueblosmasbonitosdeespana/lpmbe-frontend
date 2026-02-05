'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type SelloImages = {
  selloSealBadgeUrl: string | null;
  selloEvaluationImageUrl: string | null;
  selloTeamImageUrl: string | null;
};

const IMAGES = [
  { key: 'selloSealBadgeUrl' as const, label: 'Badge del sello (circular)', desc: 'Imagen circular del distintivo en el hero' },
  { key: 'selloEvaluationImageUrl' as const, label: 'Imagen proceso de evaluación', desc: 'Foto del comité de evaluación' },
  { key: 'selloTeamImageUrl' as const, label: 'Imagen equipo asociación', desc: 'Foto del equipo en la sección Quiénes somos' },
];

export default function ElSelloImagenesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [images, setImages] = useState<SelloImages>({
    selloSealBadgeUrl: null,
    selloEvaluationImageUrl: null,
    selloTeamImageUrl: null,
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetch('/api/admin/site-settings', { cache: 'no-store' });
      if (res.status === 401) {
        window.location.href = '/entrar';
        return;
      }
      if (!res.ok) throw new Error('Error cargando');
      const data = await res.json();
      setImages({
        selloSealBadgeUrl: data.selloSealBadgeUrl ?? null,
        selloEvaluationImageUrl: data.selloEvaluationImageUrl ?? null,
        selloTeamImageUrl: data.selloTeamImageUrl ?? null,
      });
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(key: keyof SelloImages, file: File) {
    setUploading(key);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'sello-cms');
      const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Error subiendo imagen');
      const data = await res.json();
      const url = data.url || data.publicUrl;
      setImages((p) => ({ ...p, [key]: url }));
    } catch (e: unknown) {
      alert((e as Error)?.message ?? 'Error subiendo');
    } finally {
      setUploading(null);
    }
  }

  async function handleRemove(key: keyof SelloImages) {
    setImages((p) => ({ ...p, [key]: null }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(images),
      });
      if (!res.ok) throw new Error('Error guardando');
      alert('Guardado correctamente');
      router.refresh();
    } catch (e: unknown) {
      alert((e as Error)?.message ?? 'Error guardando');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-gray-600">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/gestion/asociacion/el-sello" className="text-sm text-gray-600 hover:underline mb-2 block">
            ← Volver a El Sello (CMS)
          </Link>
          <h1 className="text-2xl font-semibold">Imágenes del Sello</h1>
          <p className="mt-1 text-sm text-gray-600">
            Sube las fotos de la página El Sello. Si no subes ninguna, se usarán las imágenes por defecto.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {IMAGES.map(({ key, label, desc }) => (
          <div key={key} className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-medium mb-1">{label}</h2>
            <p className="text-sm text-gray-600 mb-4">{desc}</p>
            {images[key] && (
              <div className="mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[key]!}
                  alt={label}
                  className="max-h-48 w-auto rounded border object-contain"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(key)}
                  className="mt-2 text-sm text-red-600 hover:underline"
                >
                  Quitar imagen
                </button>
              </div>
            )}
            <label className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50">
              {uploading === key ? 'Subiendo...' : images[key] ? 'Cambiar imagen' : 'Subir imagen'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(key, f);
                }}
                disabled={!!uploading}
              />
            </label>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </main>
  );
}
