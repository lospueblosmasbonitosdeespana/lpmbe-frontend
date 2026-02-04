import Link from 'next/link';
import { getProducts } from '@/src/lib/tiendaApi';
import { formatEUR } from '@/src/lib/money';
import type { Product } from '@/src/types/tienda';

export const dynamic = 'force-dynamic';

export default async function TiendaPage() {
  let products: Product[] = [];
  let error: string | null = null;

  try {
    products = await getProducts();
  } catch (e: any) {
    error = e?.message ?? 'Error cargando productos';
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Tienda</h1>
        <p className="mt-2 text-gray-600">
          Productos oficiales de Los Pueblos Más Bonitos de España
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      {!error && products.length === 0 && (
        <div className="rounded-lg bg-gray-50 p-8 text-center">
          <p className="text-gray-600">No hay productos disponibles</p>
        </div>
      )}

      {!error && products.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products
            .filter((p) => p.activo)
            .sort((a, b) => {
              if (a.destacado && !b.destacado) return -1;
              if (!a.destacado && b.destacado) return 1;
              return a.orden - b.orden;
            })
            .map((product) => {
              const safeSrc =
                product.imagenUrl && product.imagenUrl.trim()
                  ? product.imagenUrl.trim()
                  : null;

              return (
                <Link
                  key={product.id}
                  href={`/tienda/${product.slug}`}
                  className="group block overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg"
                >
                  {/* Imagen */}
                  <div className="aspect-square w-full overflow-hidden bg-gray-100">
                    {safeSrc ? (
                      <img
                        src={safeSrc}
                        alt={product.nombre}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-sm text-gray-400">Sin imagen</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    {product.destacado && (
                      <span className="mb-2 inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                        Destacado
                      </span>
                    )}
                    
                    <h3 className="text-lg font-semibold line-clamp-2">
                      {product.nombre}
                    </h3>
                    
                    {product.categoria && (
                      <p className="mt-1 text-xs text-gray-500">
                        {product.categoria}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xl font-bold">
                        {formatEUR(product.precio)} €
                      </span>
                      
                      {product.stock <= 0 ? (
                        <span className="text-sm text-red-600">Agotado</span>
                      ) : (
                        <span className="text-sm text-green-600">En stock</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      )}
    </main>
  );
}
