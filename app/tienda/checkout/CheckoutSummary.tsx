'use client';

import { useState } from 'react';
import type { CheckoutResponse } from '@/src/types/tienda';
import { formatEUR, toNumber } from '@/src/lib/money';

type Props = {
  checkoutData: CheckoutResponse | null;
  onApplyCoupon: (code: string) => Promise<void>;
  applying: boolean;
};

export default function CheckoutSummary({ checkoutData, onApplyCoupon, applying }: Props) {
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Introduce un código de cupón');
      return;
    }

    setCouponError(null);
    try {
      await onApplyCoupon(couponCode.trim().toUpperCase());
      setCouponCode('');
    } catch (e: any) {
      setCouponError(e?.message ?? 'Error aplicando cupón');
    }
  };

  if (!checkoutData) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-bold mb-4">Resumen del pedido</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-3"></div>
            <p className="text-sm text-gray-500">Calculando precios...</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Normalización defensiva de discounts
  const promotions = Array.isArray(checkoutData.discounts?.promotions) 
    ? checkoutData.discounts.promotions 
    : [];
  const coupon = checkoutData.discounts?.coupon ?? null;

  const originalTotal = toNumber(checkoutData.originalTotal);
  const finalTotal = toNumber(checkoutData.finalTotal);
  const shippingCost = toNumber(checkoutData.shippingCost ?? 0);
  const subtotalBeforeShipping = finalTotal - shippingCost;
  const hasDiscounts = promotions.length > 0 || coupon !== null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-bold mb-4">Resumen del pedido</h2>

      {/* ✅ NUEVO: Desglose de items calculados por backend */}
      {checkoutData.items && checkoutData.items.length > 0 && (
        <div className="space-y-3 border-b border-gray-200 pb-4 mb-4">
          <p className="text-sm font-semibold text-gray-700">Productos:</p>
          {checkoutData.items.map((item) => {
            const unitOriginal = toNumber(item.unitOriginalPrice);
            const unitFinal = toNumber(item.unitFinalPrice);
            const lineOriginal = toNumber(item.lineOriginalTotal);
            const lineFinal = toNumber(item.lineFinalTotal);
            const hasItemDiscount = unitFinal < unitOriginal;
            const itemSavings = lineOriginal - lineFinal;

            return (
              <div key={item.productId} className="text-sm">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.nombre}</div>
                    <div className="text-xs text-gray-500">Cantidad: {item.cantidad}</div>
                  </div>
                  <div className="text-right">
                    {hasItemDiscount ? (
                      <div>
                        <div className="font-semibold text-green-600">
                          {formatEUR(lineFinal)} €
                        </div>
                        <div className="text-xs text-gray-400 line-through">
                          {formatEUR(lineOriginal)} €
                        </div>
                      </div>
                    ) : (
                      <div className="font-semibold">{formatEUR(lineFinal)} €</div>
                    )}
                  </div>
                </div>

                {/* Detalle de precio unitario y descuento */}
                {hasItemDiscount && (
                  <div className="ml-2 text-xs text-gray-600 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Precio unitario:</span>
                      <span>
                        <span className="text-green-600 font-medium">{formatEUR(unitFinal)} €</span>
                        {' '}
                        <span className="line-through text-gray-400">{formatEUR(unitOriginal)} €</span>
                      </span>
                    </div>
                    {item.discount && (
                      <div className="flex justify-between text-green-700">
                        <span>✓ {item.discount.label || 'Descuento'}:</span>
                        <span>
                          −{item.discount.percent}%
                          {item.discount.source && (
                            <span className="ml-1 text-gray-500">
                              ({item.discount.source === 'PRODUCT' ? 'Producto' : 'Global'})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {itemSavings > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Ahorro:</span>
                        <span className="font-medium">−{formatEUR(itemSavings)} €</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Subtotal y envío */}
      <div className="space-y-2 border-b border-gray-200 pb-4 mb-4">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          {originalTotal !== subtotalBeforeShipping ? (
            <div>
              <span className="text-gray-400 line-through mr-2">{formatEUR(originalTotal)} €</span>
              <span className="font-semibold text-green-600">{formatEUR(subtotalBeforeShipping)} €</span>
            </div>
          ) : (
            <span>{formatEUR(subtotalBeforeShipping)} €</span>
          )}
        </div>
        <div className="flex justify-between text-sm">
          <span>
            Envio
            {checkoutData.shipping?.zone && (
              <span className="ml-1 text-xs text-gray-400">({checkoutData.shipping.zone})</span>
            )}
          </span>
          <span>
            {shippingCost === 0 ? (
              <span className="text-green-600 font-medium">Gratis</span>
            ) : (
              formatEUR(shippingCost) + ' \u20AC'
            )}
          </span>
        </div>
        {checkoutData.shipping && checkoutData.shipping.totalWeight > 0 && (
          <div className="flex justify-between text-xs text-gray-400">
            <span>Peso total</span>
            <span>{checkoutData.shipping.totalWeight.toFixed(2)} kg</span>
          </div>
        )}
      </div>

      {/* Descuentos: SOLO mostrar si hay descuentos reales */}
      {hasDiscounts && (
        <div className="space-y-2 border-b border-gray-200 pb-4 mb-4">
          <p className="text-sm font-semibold text-gray-700">Descuentos aplicados:</p>
          
          {/* Promociones automáticas */}
          {promotions.map((promo) => {
            const promoName = promo.promotionName?.trim() || 'Promoción automática';
            return (
              <div key={promo.promotionId} className="flex justify-between text-sm text-green-700">
                <span className="flex items-center gap-1">
                  <span className="text-lg">✓</span>
                  {promoName}
                </span>
                <span className="font-medium">−{formatEUR(toNumber(promo.amount))} €</span>
              </div>
            );
          })}

          {/* Cupón manual */}
          {coupon && (
            <div className="flex justify-between text-sm text-blue-700">
              <span className="flex items-center gap-1">
                <span className="text-lg">🎟️</span>
                Cupón: {coupon.couponCode}
              </span>
              <span className="font-medium">−{formatEUR(toNumber(coupon.amount))} €</span>
            </div>
          )}
        </div>
      )}

      {/* Campo de cupón */}
      {checkoutData.couponsAllowed ? (
        <div className="border-b border-gray-200 pb-4 mb-4">
          <label className="block text-sm font-medium mb-2">Código de cupón</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setCouponError(null);
              }}
              placeholder="CODIGO"
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
              disabled={applying || coupon !== null}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={applying || !couponCode.trim() || coupon !== null}
              className="rounded bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applying ? 'Aplicando...' : 'Aplicar'}
            </button>
          </div>
          {couponError && (
            <p className="mt-1 text-xs text-red-600">{couponError}</p>
          )}
          {coupon && (
            <p className="mt-1 text-xs text-green-600">✓ Cupón aplicado correctamente</p>
          )}
        </div>
      ) : (
        <div className="border-b border-gray-200 pb-4 mb-4">
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
            <p className="text-xs text-yellow-800">
              Los cupones no se pueden usar con las promociones actuales
            </p>
          </div>
        </div>
      )}

      {/* Total final */}
      <div className="flex justify-between text-lg font-bold mb-4">
        <span>Total</span>
        <span className={hasDiscounts ? 'text-green-600' : ''}>
          {formatEUR(finalTotal)} €
        </span>
      </div>

      {hasDiscounts && (
        <p className="text-xs text-gray-600 mb-4">
          Ahorro total: {formatEUR(originalTotal - finalTotal)} €
        </p>
      )}

      {/* Stripe warning */}
      {!checkoutData.stripeConfigured && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 mb-4">
          <p className="text-sm font-semibold text-yellow-800 mb-1">
            Pagos temporalmente desactivados
          </p>
          <p className="text-xs text-yellow-700">
            No se pueden procesar pagos en este momento.
          </p>
        </div>
      )}
    </div>
  );
}
