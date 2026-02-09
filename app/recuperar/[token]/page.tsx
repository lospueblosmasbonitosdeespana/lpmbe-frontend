'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || 'Error al restablecer la contraseña');
        return;
      }

      setSuccess(true);
      // Redirigir al login después de 3 segundos
      setTimeout(() => router.push('/entrar'), 3000);
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="mx-auto max-w-md p-6">
        <h1 className="text-2xl font-semibold">Contraseña actualizada</h1>
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">
            Tu contraseña ha sido cambiada correctamente. Redirigiendo al inicio de sesión...
          </p>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          <Link className="hover:underline text-primary" href="/entrar">
            Ir a iniciar sesión
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Nueva contraseña</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <p className="text-sm text-gray-600">
          Introduce tu nueva contraseña.
        </p>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Nueva contraseña</label>
          <input
            className="w-full rounded-md border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Confirmar contraseña</label>
          <input
            className="w-full rounded-md border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="Repite la contraseña"
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
          {loading ? 'Guardando...' : 'Restablecer contraseña'}
        </button>

        <p className="text-sm text-gray-600">
          <Link className="hover:underline text-primary" href="/entrar">
            Volver a entrar
          </Link>
        </p>
      </form>
    </main>
  );
}
