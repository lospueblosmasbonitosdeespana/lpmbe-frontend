'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AppleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Apple redirect flow: id_token (y opcionalmente code, state) vienen en el hash
    const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    const params = new URLSearchParams(hash);
    const idToken = params.get('id_token');

    if (!idToken) {
      setError('Apple no devolvió id_token. Vuelve a intentar desde la página de entrar.');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const apiRes = await fetch('/api/auth/apple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });

        const data = await apiRes.json().catch(() => ({}));

        if (!apiRes.ok) {
          const msg = data?.message ?? `Error ${apiRes.status}`;
          setError(typeof msg === 'string' ? msg : 'Error al iniciar sesión con Apple');
          setLoading(false);
          return;
        }

        const redirectTo = searchParams.get('redirect') || '/cuenta';
        router.replace(redirectTo);
      } catch (err) {
        console.error('[Apple callback]', err);
        setError('Error de conexión. Vuelve a intentar.');
        setLoading(false);
      }
    })();
  }, [router, searchParams]);

  if (loading && !error) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <p className="text-gray-600">Iniciando sesión…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <p className="mb-4 text-red-600" role="alert">
          {error}
        </p>
        <a
          href="/entrar"
          className="text-primary-600 underline hover:no-underline"
        >
          Volver a entrar
        </a>
      </main>
    );
  }

  return null;
}
