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

  const originalTotal = toNumber(checkoutData.originalTotal);
  const finalTotal = toNumber(checkoutData.finalTotal);
  const hasDiscounts = checkoutData.discounts.promotions.length > 0 || checkoutData.discounts.coupon;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-bold mb-4">Resumen del pedido</h2>

      {/* Subtotal */}
      <div className="space-y-2 border-b border-gray-200 pb-4 mb-4">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatEUR(originalTotal)} €</span>
        </div>
      </div>

      {/* Descuentos: SOLO mostrar si hay descuentos reales */}
      {hasDiscounts && (
        <div className="space-y-2 border-b border-gray-200 pb-4 mb-4">
          <p className="text-sm font-semibold text-gray-700">Descuentos aplicados:</p>
          
          {/* Promociones automáticas */}
          {checkoutData.discounts.promotions.map((promo, idx) => {
            const promoName = promo.promotionName?.trim() || 'Promoción automática';
            return (
              <div key={idx} className="flex justify-between text-sm text-green-700">
                <span className="flex items-center gap-1">
                  <span className="text-lg">✓</span>
                  {promoName}
                </span>
                <span className="font-medium">−{formatEUR(toNumber(promo.amount))} €</span>
              </div>
            );
          })}

          {/* Cupón manual */}
          {checkoutData.discounts.coupon && (
            <div className="flex justify-between text-sm text-blue-700">
              <span className="flex items-center gap-1">
                <span className="text-lg">🎟️</span>
                Cupón: {checkoutData.discounts.coupon.couponCode}
              </span>
              <span className="font-medium">−{formatEUR(toNumber(checkoutData.discounts.coupon.amount))} €</span>
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
              disabled={applying || !!checkoutData.discounts.coupon}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={applying || !couponCode.trim() || !!checkoutData.discounts.coupon}
              className="rounded bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applying ? 'Aplicando...' : 'Aplicar'}
            </button>
          </div>
          {couponError && (
            <p className="mt-1 text-xs text-red-600">{couponError}</p>
          )}
          {checkoutData.discounts.coupon && (
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
