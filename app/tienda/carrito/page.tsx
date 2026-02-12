'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/src/store/cart';
import { formatEUR, toNumber } from '@/src/lib/money';
import { getShippingConfig, type ShippingConfig } from '@/src/lib/tiendaApi';

export default function CarritoPage() {
  const router = useRouter();
  const { items, removeItem, setQuantity, clear, getItemCount } = useCartStore();
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig | null>(null);
  const [shippingEstimate, setShippingEstimate] = useState<{
    cost: number;
    isFree: boolean;
    zoneName: string | null;
    totalWeight: number;
  } | null>(null);

  // ✅ Calcular subtotal usando finalPrice si existe (precio efectivo)
  const subtotal = items.reduce((acc, item) => {
    const effectivePrice = item.product.finalPrice ?? item.product.precio;
    return acc + (toNumber(effectivePrice) * item.quantity);
  }, 0);

  const itemCount = getItemCount();

  // Coste de envío: estimación dinámica o fallback a config estática
  const shippingCost = shippingEstimate
    ? shippingEstimate.cost
    : shippingConfig
      ? subtotal >= shippingConfig.freeOver
        ? 0
        : shippingConfig.flatRate
      : null;
  const total = shippingCost !== null ? subtotal + shippingCost : subtotal;

  // Cargar config de envío
  useEffect(() => {
    getShippingConfig()
      .then(setShippingConfig)
      .catch(() => setShippingConfig(null));
  }, []);

  // Calcular envío dinámico (con CP peninsular por defecto para estimación)
  useEffect(() => {
    if (items.length === 0) {
      setShippingEstimate(null);
      return;
    }
    const calculate = async () => {
      try {
        const res = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((i) => ({
              productId: i.product.id,
              cantidad: i.quantity,
            })),
            postalCode: '28001', // CP peninsular por defecto para estimación
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setShippingEstimate(data);
        }
      } catch {
        // Fallback silencioso a config estática
      }
    };
    calculate();
  }, [items]);

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

            // ✅ Usar precio efectivo (finalPrice si existe, sino precio)
            const effectiveUnitPrice = item.product.finalPrice ?? item.product.precio;
            const originalPrice = item.product.precio;
            const hasDiscount = item.product.finalPrice && item.product.finalPrice < originalPrice;
            const lineTotal = toNumber(effectiveUnitPrice) * item.quantity;

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

                  {/* Badge de descuento si existe */}
                  {hasDiscount && item.product.discount && (
                    <div className="mt-1">
                      <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        {item.product.discount.label || 'Descuento'} −{item.product.discount.percent}%
                      </span>
                    </div>
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

                    {/* Precio con descuento si aplica */}
                    <div className="text-right">
                      <p className="font-bold">
                        {formatEUR(lineTotal)} €
                      </p>
                      {hasDiscount ? (
                        <p className="text-xs text-gray-500">
                          <span className="text-green-600 font-medium">{formatEUR(effectiveUnitPrice)} €</span>
                          {' '}
                          <span className="line-through text-gray-400">{formatEUR(originalPrice)} €</span>
                          {' / ud'}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          {formatEUR(effectiveUnitPrice)} € / ud
                        </p>
                      )}
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
                <span>{formatEUR(subtotal)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Envio {!shippingEstimate?.isFree && shippingEstimate ? '(estimado)' : ''}</span>
                <span>
                  {shippingCost === null ? (
                    <span className="text-gray-500">Calculando...</span>
                  ) : shippingCost === 0 ? (
                    <span className="text-green-600 font-medium">Gratis</span>
                  ) : (
                    formatEUR(shippingCost) + ' \u20AC'
                  )}
                </span>
              </div>
              {shippingEstimate && !shippingEstimate.isFree && (
                <p className="text-xs text-gray-400 mt-1">
                  Se calculara el coste exacto al elegir direccion de envio
                </p>
              )}
            </div>

            {/* ✅ Mostrar ahorro si hay descuentos */}
            {items.some(item => item.product.finalPrice && item.product.finalPrice < item.product.precio) && (
              <div className="mt-3 mb-3 rounded-md bg-green-50 border border-green-200 p-3">
                <p className="text-xs text-green-800 font-medium">
                  ✓ Descuentos aplicados
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Total con descuento: {formatEUR(subtotal)} €
                </p>
              </div>
            )}

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
