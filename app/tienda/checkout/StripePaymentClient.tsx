'use client';

import { useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

type Props = {
  clientSecret: string;
  orderId: number;
};

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function InnerForm({ orderId }: { orderId: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!stripe || !elements) return;

    setSubmitting(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Stripe puede redirigir si hay 3DS. Después vuelve aquí:
          return_url: `${window.location.origin}/tienda/checkout/return?orderId=${orderId}`,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        setError(result.error.message || 'Pago no completado');
        return;
      }

      // Si no hubo redirect, pago confirmado en el cliente.
      window.location.href = `/tienda/pedido/${orderId}`;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
        {submitting ? 'Procesando pago…' : 'Pagar ahora'}
      </button>
      <p className="text-xs text-gray-500">
        El estado final del pedido se confirma por webhook. Si hay 3D Secure, Stripe puede pedir verificación adicional.
      </p>
    </form>
  );
}

export default function StripePaymentClient({ clientSecret, orderId }: Props) {
  const options = useMemo(
    () => ({
      clientSecret,
      appearance: { theme: 'stripe' as const },
    }),
    [clientSecret],
  );

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        Falta NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY en frontend/.env.local
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <InnerForm orderId={orderId} />
    </Elements>
  );
}
