'use client';

import { useEffect, useMemo, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { getStripe, isStripeEnabled } from '@/src/lib/stripe';

type InnerFormProps = {
  orderId?: number;
};

function InnerForm({ orderId }: InnerFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!stripe || !elements) return;

    setSubmitting(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/return${
            orderId ? `?orderId=${orderId}` : ''
          }`,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        setError(result.error.message || 'No se pudo confirmar el pago.');
        return;
      }

      if (orderId) {
        window.location.href = `/tienda/pedido/${orderId}`;
      } else {
        window.location.href = '/tienda';
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full rounded-md bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {submitting ? 'Procesando pago…' : 'Confirmar pago'}
      </button>
      <p className="text-xs text-gray-500">
        El pedido se confirmará definitivamente cuando recibamos la notificación de Stripe (webhook).
      </p>
    </form>
  );
}

type StripeElementsFormProps = {
  clientSecret: string;
  orderId?: number;
};

export default function StripeElementsForm({ clientSecret, orderId }: StripeElementsFormProps) {
  const stripePromise = getStripe();

  const options = useMemo(
    () => ({
      clientSecret,
      appearance: { theme: 'stripe' as const },
    }),
    [clientSecret],
  );

  if (!isStripeEnabled() || !stripePromise) {
    return (
      <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm font-semibold text-yellow-800 mb-2">Pagos no disponibles</p>
        <p className="text-xs text-yellow-700">
          Falta la clave pública de Stripe. Contacta con el administrador antes de intentar pagar.
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <InnerForm orderId={orderId} />
    </Elements>
  );
}
