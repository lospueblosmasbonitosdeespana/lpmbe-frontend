'use client';

import { useCallback, useEffect, useState } from 'react';
import { compressImage } from '@/src/lib/compressImage';

type NegocioImage = {
  id: number;
  recursoId: number;
  url: string;
  alt: string | null;
  orden: number;
};

const extractUploadedUrl = (payload: any): string | null => {
  const candidates = [
    payload?.url,
    payload?.publicUrl,
    payload?.imageUrl,
    payload?.data?.url,
    payload?.data?.publicUrl,
    payload?.result?.url,
    payload?.file?.url,
  ].filter(Boolean);
  return candidates.find((u: any) => typeof u === 'string' && u.startsWith('http')) ?? null;
};

export default function NegocioGallery({
  negocioId,
  negocioNombre,
}: {
  negocioId: number;
  negocioNombre: string;
}) {
  const [images, setImages] = useState<NegocioImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/club/negocios/${negocioId}/imagenes`);
      if (!res.ok) throw new Error('Error al cargar imágenes');
      const data = await res.json();
      setImages(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }, [negocioId]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      setUploading(true);
      setError(null);
      try {
        const compressed = await compressImage(file, {
          fileName: file.name.replace(/\.[^.]+$/, ''),
        });

        const fd = new FormData();
        fd.append('file', compressed);
        fd.append('folder', 'negocios');

        const uploadRes = await fetch('/api/admin/uploads', {
          method: 'POST',
          body: fd,
          credentials: 'include',
        });

        const uploadJson = await uploadRes.json().catch(() => null);
        if (!uploadRes.ok) {
          throw new Error(uploadJson?.error ?? uploadJson?.message ?? `Error ${uploadRes.status}`);
        }

        const uploadedUrl = extractUploadedUrl(uploadJson);
        if (!uploadedUrl) throw new Error('La subida no devolvió URL válida');

        const nextIndex = images.length + 1;
        const res = await fetch(`/api/club/negocios/${negocioId}/imagenes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: uploadedUrl,
            alt: `${negocioNombre} - Imagen ${nextIndex}`,
          }),
        });
        if (!res.ok) throw new Error('Error al registrar la imagen');

        await load();
      } catch (e: any) {
        setError(e?.message ?? 'Error subiendo imagen');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const handleDelete = async (imageId: number) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    try {
      const res = await fetch(`/api/club/negocios/imagenes/${imageId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    }
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    setImages(newImages);
    try {
      await fetch(`/api/club/negocios/${negocioId}/imagenes/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds: newImages.map((i) => i.id) }),
      });
    } catch {
      await load();
    }
  };

  const moveDown = async (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    setImages(newImages);
    try {
      await fetch(`/api/club/negocios/${negocioId}/imagenes/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds: newImages.map((i) => i.id) }),
      });
    } catch {
      await load();
    }
  };

  if (loading) {
    return <p className="text-xs text-gray-400 py-2">Cargando galería...</p>;
  }

  return (
    <div className="mt-3 space-y-3">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img, index) => (
            <div key={img.id} className="group relative rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
              <img
                src={img.url}
                alt={img.alt ?? ''}
                className="aspect-square w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-white disabled:opacity-30"
                  title="Mover izquierda"
                >
                  ←
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === images.length - 1}
                  className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-white disabled:opacity-30"
                  title="Mover derecha"
                >
                  →
                </button>
                <button
                  onClick={() => handleDelete(img.id)}
                  className="rounded bg-red-500/90 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
              {index === 0 && (
                <span className="absolute top-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={uploading}
        className="w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600 hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50 transition-colors"
      >
        {uploading ? 'Subiendo...' : `+ Añadir imagen${images.length >= 4 ? '' : ` (${images.length}/4 mínimo)`}`}
      </button>

      {images.length === 0 && (
        <p className="text-xs text-gray-400">
          Sube al menos 4 fotos del negocio para mostrar una galería completa.
        </p>
      )}
    </div>
  );
}
