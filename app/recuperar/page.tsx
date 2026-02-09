'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function RecuperarPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || 'Error al procesar la solicitud');
        return;
      }

      setSent(true);
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Recuperar contraseña</h1>

      {!sent ? (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <p className="text-sm text-gray-600">
            Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Email</label>
            <input
              className="w-full rounded-md border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="tu@email.com"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            className="w-full rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar instrucciones'}
          </button>

          <p className="text-sm text-gray-600">
            <Link className="hover:underline text-primary" href="/entrar">
              Volver a entrar
            </Link>
          </p>
        </form>
      ) : (
        <div className="mt-6 space-y-3">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-800">
              Si existe una cuenta con <strong>{email}</strong>, hemos enviado un email con instrucciones para restablecer tu contraseña.
            </p>
            <p className="mt-2 text-xs text-green-700">
              Revisa también la carpeta de spam o correo no deseado.
            </p>
          </div>
          <p className="text-sm text-gray-600">
            <Link className="hover:underline text-primary" href="/entrar">
              Volver a entrar
            </Link>
          </p>
        </div>
      )}
    </main>
  );
}
