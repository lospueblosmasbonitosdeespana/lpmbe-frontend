'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function RecuperarPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Recuperar contraseña</h1>

      {!sent ? (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm">Email</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <button className="w-full rounded-md border px-3 py-2" type="submit">
            Enviar instrucciones
          </button>

          <p className="text-sm text-gray-600">
            <Link className="hover:underline" href="/entrar">
              Volver a entrar
            </Link>
          </p>
        </form>
      ) : (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-gray-700">
            Si existe una cuenta con <strong>{email}</strong>, te enviaremos instrucciones.
          </p>
          <p className="text-sm text-gray-600">
            <Link className="hover:underline" href="/entrar">
              Volver a entrar
            </Link>
          </p>
        </div>
      )}
    </main>
  );
}

