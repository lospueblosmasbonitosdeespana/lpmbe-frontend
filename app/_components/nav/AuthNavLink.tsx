'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { shouldShowGestion, getGestionHref } from '@/lib/auth-nav';

type Me = {
  sub: number;
  email: string;
  rol: 'USUARIO' | 'ALCALDE' | 'ADMIN' | 'CLIENTE' | 'COLABORADOR';
  nombre?: string | null;
};

export default function AuthNavLink() {
  const t = useTranslations('nav');
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
        {t('login')}
      </Link>
    );
  }

  if (!me) {
    return (
      <Link href="/entrar" className="text-sm font-medium hover:underline">
        {t('login')}
      </Link>
    );
  }

  // Logueado: Mi cuenta siempre, Gestión para ADMIN/ALCALDE/CLIENTE/COLABORADOR
  const showGestion = shouldShowGestion(me.rol);
  const gestionHref = getGestionHref(me.rol);

  return (
    <span className="flex items-center gap-4">
      <Link href="/mi-cuenta" className="text-sm font-medium hover:underline">
        {t('myAccount')}
      </Link>
      {showGestion && (
        <Link href={gestionHref} className="text-sm font-medium hover:underline">
          {t('management')}
        </Link>
      )}
    </span>
  );
}

