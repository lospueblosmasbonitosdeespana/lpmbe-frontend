'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getStripe, isStripeEnabled } from '@/src/lib/stripe';

type IntentStatus =
  | 'loading'
  | 'succeeded'
  | 'processing'
  | 'requires_payment_method'
  | 'requires_action'
  | 'error';

export default function CheckoutReturnClient() {
  const searchParams = useSearchParams();
  const clientSecret = searchParams.get('payment_intent_client_secret');
  const orderId = searchParams.get('orderId');
  const [status, setStatus] = useState<IntentStatus>('loading');
  const [message, setMessage] = useState<string>('Comprobando el estado del pago…');

  useEffect(() => {
    async function loadStatus() {
      if (!clientSecret) {
        setStatus('error');
        setMessage('No se encontró el identificador del pago.');
        return;
      }

      const stripePromise = getStripe();
      if (!isStripeEnabled() || !stripePromise) {
        setStatus('error');
        setMessage('Stripe no está configurado en este entorno.');
        return;
      }

      const stripe = await stripePromise;
      if (!stripe) {
        setStatus('error');
        setMessage('Stripe no pudo inicializarse.');
        return;
      }

      const { paymentIntent, error } = await stripe.retrievePaymentIntent(clientSecret);
      if (error || !paymentIntent) {
        setStatus('error');
        setMessage(error?.message ?? 'No se pudo obtener el estado del pago.');
        return;
      }

      setStatus(paymentIntent.status as IntentStatus);
      switch (paymentIntent.status) {
        case 'succeeded':
          setMessage('Pago completado correctamente.');
          break;
        case 'processing':
          setMessage('Tu pago se está procesando. Actualizaremos el pedido en unos segundos.');
          break;
        case 'requires_payment_method':
          setMessage('Tu método de pago fue rechazado. Intenta con otro método.');
          break;
        case 'requires_action':
          setMessage('Necesitamos que completes un paso adicional (3D Secure) para confirmar el pago.');
          break;
        default:
          setMessage('Estado del pago: ' + paymentIntent.status);
      }
    }

    loadStatus();
  }, [clientSecret]);

  const statusLabel = useMemo(() => {
    switch (status) {
      case 'succeeded':
        return 'Pago confirmado';
      case 'processing':
        return 'Pago en proceso';
      case 'requires_payment_method':
        return 'Pago rechazado';
      case 'requires_action':
        return 'Acción adicional requerida';
      case 'error':
        return 'Error en el pago';
      default:
        return 'Comprobando pago…';
    }
  }, [status]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-6 py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">{statusLabel}</h1>
      <p className="text-gray-700 mb-8">{message}</p>

      {orderId && (
        <Link
          href={`/tienda/pedido/${orderId}`}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Ver mi pedido
        </Link>
      )}

      <Link href="/tienda" className="mt-4 text-sm text-blue-600 hover:text-blue-800">
        Volver a la tienda
      </Link>
    </main>
  );
}
