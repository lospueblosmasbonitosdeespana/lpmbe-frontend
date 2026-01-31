// app/entrar/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import AppleSignInButton from '@/app/components/auth/AppleSignInButton';

function EntrarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!mounted) return;
        if (res.ok) {
          router.replace('/cuenta');
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'No se pudo iniciar sesión');
        return;
      }

      // Respetar redirect si existe
      const redirect = searchParams.get('redirect');
      router.push(redirect || '/cuenta');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Entrar</h1>

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

        <div className="space-y-2">
          <label className="block text-sm">Password</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button className="w-full rounded-md border px-3 py-2" type="submit" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>

        <AppleSignInButton />

        <p className="text-sm text-gray-600">
          <a className="hover:underline" href="/recuperar">
            ¿Has olvidado la contraseña?
          </a>
        </p>

        <p className="text-sm text-gray-600">
          ¿No tienes cuenta?{' '}
          <a className="hover:underline" href="/registro">
            Crear cuenta
          </a>
        </p>
      </form>
    </main>
  );
}

export default function EntrarPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto max-w-md p-6">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <div className="mt-6 text-center text-gray-600">Cargando...</div>
      </main>
    }>
      <EntrarForm />
    </Suspense>
  );
}
