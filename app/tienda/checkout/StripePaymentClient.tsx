'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe } from '@/src/lib/stripe/client';

interface StripePaymentClientProps {
  clientSecret: string;
  orderId: number;
}

function PaymentForm({ orderId }: { orderId: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${typeof window !== 'undefined' ? window.location.origin : ''}/tienda/pedido/${orderId}`,
        },
      });

      if (submitError) {
        setError(submitError.message ?? 'Error en el pago');
      } else {
        router.push(`/tienda/pedido/${orderId}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error procesando el pago');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: { type: 'tabs', defaultCollapsed: false },
          paymentMethodOrder: ['card', 'paypal', 'apple_pay', 'google_pay'],
        }}
      />
      <p className="text-xs text-gray-500 mt-2">
        Selecciona Tarjeta o PayPal y pulsa Pagar. Con PayPal serás redirigido.
      </p>
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-800 text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? 'Procesando...' : 'Pagar'}
      </button>
    </form>
  );
}

export default function StripePaymentClient({ clientSecret, orderId }: StripePaymentClientProps) {
  const stripePromise = getStripe();

  if (!stripePromise) {
    return (
      <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-yellow-800">
        Stripe no está configurado. Configura NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
      </div>
    );
  }

  const options = {
    clientSecret,
    locale: 'es' as const,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm orderId={orderId} />
    </Elements>
  );
}
