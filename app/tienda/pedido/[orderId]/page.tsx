'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

type PedidoResumen = {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
};

const SUCCESS_ORDER_STATUSES: OrderStatus[] = [
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
];

export default function PedidoConfirmacionPage() {
  const params = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const orderId = params?.orderId ?? '';
  const redirectStatus = searchParams.get('redirect_status');
  const [order, setOrder] = useState<PedidoResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPaid = useMemo(() => {
    if (!order) return false;
    return (
      SUCCESS_ORDER_STATUSES.includes(order.status) ||
      order.paymentStatus?.toUpperCase() === 'PAID'
    );
  }, [order]);

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 10;

    const loadOrder = async () => {
      try {
        const res = await fetch(`/api/usuarios/me/pedidos/${orderId}`, {
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.message || `Error ${res.status}`);
        }

        if (cancelled) return;
        setOrder(data);
        setError(null);
        setLoading(false);

        const paymentStatus = String(data?.paymentStatus || '').toUpperCase();
        const orderStatus = String(data?.status || '').toUpperCase();
        const paymentResolved =
          SUCCESS_ORDER_STATUSES.includes(orderStatus as OrderStatus) ||
          paymentStatus === 'PAID' ||
          paymentStatus === 'FAILED' ||
          paymentStatus === 'CANCELED';

        attempts += 1;
        if (!paymentResolved && attempts < maxAttempts) {
          setTimeout(loadOrder, 3000);
        }
      } catch (e: any) {
        if (cancelled) return;
        setLoading(false);
        setError(e?.message ?? 'No se pudo comprobar el estado del pago');
      }
    };

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div
        className={`rounded-lg border p-8 text-center ${
          isPaid
            ? 'border-green-200 bg-green-50'
            : error
            ? 'border-red-200 bg-red-50'
            : 'border-yellow-200 bg-yellow-50'
        }`}
      >
        <div className="mb-4 text-6xl">{isPaid ? '✓' : error ? '!' : '…'}</div>
        <h1 className="mb-3 text-3xl font-bold">
          {isPaid
            ? '¡Pago confirmado!'
            : error
            ? 'No hemos podido verificar el pago'
            : 'Estamos verificando tu pago'}
        </h1>

        <p className="mb-2 text-gray-700">
          Pedido #{order?.orderNumber ?? orderId}
        </p>

        {loading && <p className="text-sm text-gray-600">Comprobando estado con Stripe...</p>}
        {!loading && !isPaid && !error && (
          <p className="text-sm text-gray-700">
            Tu pago sigue en proceso. Si has usado PayPal, puede tardar unos segundos en
            confirmarse.
          </p>
        )}
        {error && <p className="text-sm text-red-700">{error}</p>}
        {!isPaid && redirectStatus === 'failed' && (
          <p className="mt-2 text-sm text-red-700">
            Stripe indica que el pago no se completó. Puedes volver a intentarlo.
          </p>
        )}

        <div className="mt-6 space-x-4">
          <Link
            href="/tienda"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Volver a la tienda
          </Link>
          <Link
            href="/mi-cuenta/pedidos"
            className="inline-block rounded-lg border border-gray-300 px-6 py-3 font-semibold hover:bg-gray-50"
          >
            Ver mis pedidos
          </Link>
        </div>
      </div>
    </main>
  );
}
