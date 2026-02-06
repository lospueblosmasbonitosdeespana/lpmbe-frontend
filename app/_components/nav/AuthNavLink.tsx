'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { shouldShowGestion, getGestionHref } from '@/lib/auth-nav';

type Me = {
  sub: number;
  email: string;
  rol: 'USUARIO' | 'ALCALDE' | 'ADMIN' | 'CLIENTE';
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

  if (!me) {
    return (
      <Link href="/entrar" className="text-sm font-medium hover:underline">
        Entrar
      </Link>
    );
  }

  // Logueado: Mi cuenta siempre, Gestión solo para ADMIN/ALCALDE/CLIENTE
  const showGestion = shouldShowGestion(me.rol);
  const gestionHref = getGestionHref(me.rol);

  return (
    <span className="flex items-center gap-4">
      <Link href="/mi-cuenta" className="text-sm font-medium hover:underline">
        Mi cuenta
      </Link>
      {showGestion && (
        <Link href={gestionHref} className="text-sm font-medium hover:underline">
          Gestión
        </Link>
      )}
    </span>
  );
}

