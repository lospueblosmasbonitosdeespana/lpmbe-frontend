'use client';

import { useState, useEffect } from 'react';
import type { ProductImage } from '@/src/types/tienda';
import {
  listProductImages,
  createProductImage,
  updateProductImage,
  deleteProductImage,
  reorderProductImages,
} from '@/src/lib/tiendaApi';

type Props = {
  productId: number;
};

export default function ProductGalleryManager({ productId }: Props) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingAltId, setEditingAltId] = useState<number | null>(null);
  const [editingAltValue, setEditingAltValue] = useState('');

  async function loadImages() {
    try {
      setLoading(true);
      setError(null);
      const data = await listProductImages(productId);
      setImages(data);
    } catch (e: any) {
      const status = e?.status || 0;
      
      if (status === 404) {
        setError('Ruta API no registrada (proxy). Reinicia el servidor.');
      } else if (status === 401) {
        setError('No autenticado. Inicia sesión de nuevo.');
      } else if (status === 403) {
        setError('Sin permisos para acceder a esta galería.');
      } else {
        setError(e?.message ?? 'Error cargando galería');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadImages();
  }, [productId]);

  async function handleUploadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      if (file.size > 25 * 1024 * 1024) {
        setError('La imagen pesa demasiado (máx 25MB)');
        return;
      }

      setUploading(true);
      setError(null);

      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'productos'); // ✅ Igual que el uploader principal

        const uploadRes = await fetch('/api/media/upload', {
          method: 'POST',
          body: fd,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || 'Error subiendo imagen');
        }

        const data = await uploadRes.json();
        const url = data?.url ?? data?.publicUrl;

        if (!url) throw new Error('No se recibió URL de la imagen');

        await createProductImage(productId, { url });
        await loadImages();
      } catch (e: any) {
        setError(e?.message ?? 'Error subiendo imagen');
      } finally {
        setUploading(false);
      }
    };

    input.click();
  }

  async function handleDelete(imageId: number) {
    if (!confirm('¿Eliminar esta imagen de la galería?')) return;

    try {
      setError(null);
      await deleteProductImage(productId, imageId);
      await loadImages();
    } catch (e: any) {
      setError(e?.message ?? 'Error eliminando imagen');
    }
  }

  function startEditAlt(image: ProductImage) {
    setEditingAltId(image.id);
    setEditingAltValue(image.alt || '');
  }

  function cancelEditAlt() {
    setEditingAltId(null);
    setEditingAltValue('');
  }

  async function saveAlt(imageId: number) {
    try {
      setError(null);
      await updateProductImage(productId, imageId, { alt: editingAltValue.trim() });
      await loadImages();
      cancelEditAlt();
    } catch (e: any) {
      setError(e?.message ?? 'Error guardando alt');
    }
  }

  async function moveUp(index: number) {
    if (index === 0) return;
    
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    
    setImages(newImages);
    
    try {
      const ids = newImages.map(img => img.id);
      await reorderProductImages(productId, ids);
    } catch (e: any) {
      setError(e?.message ?? 'Error reordenando');
      await loadImages(); // Revertir en caso de error
    }
  }

  async function moveDown(index: number) {
    if (index === images.length - 1) return;
    
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    
    setImages(newImages);
    
    try {
      const ids = newImages.map(img => img.id);
      await reorderProductImages(productId, ids);
    } catch (e: any) {
      setError(e?.message ?? 'Error reordenando');
      await loadImages(); // Revertir en caso de error
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando galería...</div>;
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Galería (opcional)
      </label>

      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {images.length === 0 && (
          <p className="text-sm text-gray-500">Sin imágenes en la galería</p>
        )}

        {images.map((img, index) => (
          <div
            key={img.id}
            className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
          >
            <img
              src={img.url}
              alt={img.alt || ''}
              className="h-20 w-20 flex-shrink-0 rounded border border-gray-300 object-cover"
            />

            <div className="flex-1 space-y-2">
              {editingAltId === img.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingAltValue}
                    onChange={(e) => setEditingAltValue(e.target.value)}
                    placeholder="Texto alternativo"
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                  <button
                    onClick={() => saveAlt(img.id)}
                    className="rounded bg-black px-3 py-1 text-xs text-white hover:bg-gray-800"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={cancelEditAlt}
                    className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-700">{img.alt || '(sin alt)'}</p>
                  <button
                    onClick={() => startEditAlt(img)}
                    className="text-xs text-gray-500 underline hover:no-underline"
                  >
                    Editar alt
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Mover arriba"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === images.length - 1}
                  className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Mover abajo"
                >
                  ↓
                </button>
                <button
                  onClick={() => handleDelete(img.id)}
                  className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleUploadImage}
          disabled={uploading}
          className="w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-100 disabled:opacity-50"
        >
          {uploading ? 'Subiendo...' : '+ Añadir imagen a la galería'}
        </button>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        La primera imagen de la galería se mostrará como principal en la ficha pública.
      </p>
    </div>
  );
}
