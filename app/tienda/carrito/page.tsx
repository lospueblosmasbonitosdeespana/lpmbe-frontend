'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/src/store/cart';
import { formatEUR, toNumber } from '@/src/lib/money';

export default function CarritoPage() {
  const router = useRouter();
  const { items, removeItem, setQuantity, clear, getTotal, getItemCount } = useCartStore();

  const total = getTotal();
  const itemCount = getItemCount();

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Carrito</h1>
        
        <div className="rounded-lg bg-gray-50 p-12 text-center">
          <p className="text-gray-600 mb-4">Tu carrito está vacío</p>
          <Link
            href="/tienda"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Ir a la tienda
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Carrito ({itemCount} artículos)</h1>
        <button
          onClick={clear}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Vaciar carrito
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Lista de items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const safeSrc =
              item.product.imagenUrl && item.product.imagenUrl.trim()
                ? item.product.imagenUrl.trim()
                : null;

            return (
              <div
                key={item.product.id}
                className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4"
              >
                {/* Imagen */}
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                  {safeSrc ? (
                    <img
                      src={safeSrc}
                      alt={item.product.nombre}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-xs text-gray-400">Sin imagen</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col">
                  <h3 className="font-semibold">{item.product.nombre}</h3>
                  {item.product.categoria && (
                    <p className="text-xs text-gray-500 mt-1">
                      {item.product.categoria}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-3">
                    {/* Cantidad */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity(item.product.id, item.quantity - 1)}
                        className="h-8 w-8 rounded border border-gray-300 hover:bg-gray-50"
                      >
                        −
                      </button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <button
                        onClick={() => setQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="h-8 w-8 rounded border border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>

                    {/* Precio */}
                    <div className="text-right">
                      <p className="font-bold">
                        {formatEUR(toNumber(item.product.precio) * item.quantity)} €
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatEUR(item.product.precio)} € / ud
                      </p>
                    </div>
                  </div>

                  {/* Stock warning */}
                  {item.quantity > item.product.stock && (
                    <p className="mt-2 text-xs text-red-600">
                      Stock insuficiente (disponibles: {item.product.stock})
                    </p>
                  )}
                </div>

                {/* Eliminar */}
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="text-gray-400 hover:text-red-600"
                  title="Eliminar"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        {/* Resumen */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-gray-200 bg-white p-6 sticky top-6">
            <h2 className="text-xl font-bold mb-4">Resumen</h2>

            <div className="space-y-2 border-b border-gray-200 pb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatEUR(total)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Envío</span>
                <span className="text-gray-500">A calcular</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold mt-4 mb-6">
              <span>Total</span>
              <span>{formatEUR(total)} €</span>
            </div>

            <button
              onClick={() => router.push('/tienda/checkout')}
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Proceder al pago
            </button>

            <Link
              href="/tienda"
              className="mt-3 block text-center text-sm text-gray-600 hover:text-gray-900"
            >
              ← Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
