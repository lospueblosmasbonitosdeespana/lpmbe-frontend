'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/src/store/cart';
import { formatEUR } from '@/src/lib/money';
import type { Product } from '@/src/types/tienda';

type ProductDetailClientProps = {
  product: Product;
};

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Determinar imágenes: usar galería si existe, sino imagenUrl
  const hasGallery = product.images && product.images.length > 0;
  const galleryImages = hasGallery ? product.images! : [];
  const fallbackImage = product.imagenUrl && product.imagenUrl.trim() ? product.imagenUrl.trim() : null;
  
  // Estado de imagen activa (inicia con la primera de la galería o fallback)
  const [selectedImage, setSelectedImage] = useState<string | null>(
    hasGallery ? galleryImages[0].url : fallbackImage
  );

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const canAdd = product.activo && product.stock > 0 && quantity <= product.stock;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm text-gray-600 hover:text-gray-900"
      >
        ← Volver a la tienda
      </button>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        {/* Imagen + Galería */}
        <div>
          <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.nombre}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-gray-400">Sin imagen</span>
              </div>
            )}
          </div>

          {/* Thumbnails de la galería */}
          {hasGallery && galleryImages.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {galleryImages.map((img, index) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.url)}
                  className={`flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImage === img.url
                      ? 'border-blue-600 ring-2 ring-blue-600 ring-offset-2'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.alt || `Imagen ${index + 1}`}
                    className="h-20 w-20 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información */}
        <div>
          {product.destacado && (
            <span className="mb-3 inline-block rounded bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              Destacado
            </span>
          )}

          <h1 className="text-3xl font-bold">{product.nombre}</h1>

          {product.categoria && (
            <p className="mt-2 text-sm text-gray-500">{product.categoria}</p>
          )}

          <div className="mt-6">
            <span className="text-4xl font-bold">{formatEUR(product.precio)} €</span>
          </div>

          {/* Stock */}
          <div className="mt-4">
            {product.stock <= 0 ? (
              <span className="text-red-600 font-medium">Agotado</span>
            ) : product.stock < 10 ? (
              <span className="text-orange-600">
                Últimas {product.stock} unidades
              </span>
            ) : (
              <span className="text-green-600">En stock ({product.stock} disponibles)</span>
            )}
          </div>

          {/* Descripción */}
          {product.descripcion && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-2">Descripción</h2>
              <p className="text-gray-700 whitespace-pre-line">
                {product.descripcion}
              </p>
            </div>
          )}

          {/* Cantidad + Añadir al carrito */}
          {product.activo && product.stock > 0 && (
            <div className="mt-8 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cantidad
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-10 w-10 rounded border border-gray-300 hover:bg-gray-50"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setQuantity(Math.max(1, Math.min(product.stock, val)));
                    }}
                    className="h-10 w-20 rounded border border-gray-300 text-center"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="h-10 w-10 rounded border border-gray-300 hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!canAdd}
                className={`w-full rounded-lg py-3 px-6 font-semibold transition-colors ${
                  canAdd
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {added ? '✓ Añadido al carrito' : 'Añadir al carrito'}
              </button>

              <button
                onClick={() => router.push('/tienda/carrito')}
                className="w-full rounded-lg border border-gray-300 py-3 px-6 font-semibold hover:bg-gray-50"
              >
                Ver carrito
              </button>
            </div>
          )}

          {!product.activo && (
            <div className="mt-8 rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-gray-600">Producto no disponible</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
