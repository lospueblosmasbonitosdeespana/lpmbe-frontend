'use client';

import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Google Sign-In Button usando credential flow (Google Identity Services).
 * Obtiene directamente el id_token (credential) y lo envía al backend.
 */
export default function GoogleSignInButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  async function handleSuccess(credentialResponse: CredentialResponse) {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      setError('Google no devolvió credenciales');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message ?? `Error ${res.status}`);
        return;
      }

      router.refresh();
      router.push('/cuenta');
    } catch (err) {
      console.error('[GoogleSignIn]', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  function handleError() {
    setError('Error al iniciar sesión con Google');
  }

  // No renderizar si falta client ID
  if (!clientId) {
    return null;
  }

  return (
    <div className="mt-4">
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap={false}
          text="continue_with"
          shape="rectangular"
          width="100%"
          locale="es"
        />
      </div>
      {loading && (
        <p className="mt-2 text-center text-sm text-gray-600">Conectando…</p>
      )}
      {error && (
        <p className="mt-2 text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
