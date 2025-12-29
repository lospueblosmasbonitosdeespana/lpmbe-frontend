'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Me = {
  sub: number;
  email: string;
  rol: 'USUARIO' | 'ALCALDE' | 'ADMIN';
  nombre?: string | null;
};

export default function AuthNavLink() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!mounted) return;

        if (!res.ok) {
          setMe(null);
          return;
        }

        const data = (await res.json()) as Me;
        setMe(data);
      } catch {
        if (mounted) setMe(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Link href="/entrar" className="text-sm font-medium opacity-70 hover:underline">
        Entrar
      </Link>
    );
  }

  if (me) {
    return (
      <Link href="/cuenta" className="text-sm font-medium hover:underline">
        Cuenta
      </Link>
    );
  }

  return (
    <Link href="/entrar" className="text-sm font-medium hover:underline">
      Entrar
    </Link>
  );
}

