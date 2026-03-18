'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function NewsletterBajaPage() {
  const params = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando tu baja...');

  useEffect(() => {
    const token = params.get('token') || '';
    if (!token) {
      setStatus('error');
      setMessage('Enlace inválido. Falta token de baja.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/newsletter/unsubscribe-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setStatus('error');
          setMessage(data?.message || 'No se pudo procesar la baja.');
          return;
        }
        setStatus('ok');
        setMessage('Tu email se ha dado de baja de la newsletter correctamente.');
      } catch {
        if (cancelled) return;
        setStatus('error');
        setMessage('No se pudo procesar la baja en este momento.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params]);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Baja de newsletter</h1>
      <p
        className={`mt-4 rounded-md border p-4 text-sm ${
          status === 'ok'
            ? 'border-green-200 bg-green-50 text-green-700'
            : status === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-gray-200 bg-gray-50 text-gray-700'
        }`}
      >
        {message}
      </p>
    </main>
  );
}
