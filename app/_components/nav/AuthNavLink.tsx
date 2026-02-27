'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { shouldShowGestion, getGestionHref } from '@/lib/auth-nav';

type Me = {
  id?: number;
  sub?: number;
  email: string;
  rol: 'USUARIO' | 'ALCALDE' | 'ADMIN' | 'EDITOR' | 'CLIENTE' | 'COLABORADOR';
  nombre?: string | null;
};

type AuthNavLinkProps = {
  /** En drawer (menú móvil) se muestra en bloque para tap fácil */
  variant?: 'default' | 'drawer';
};

export default function AuthNavLink({ variant = 'default' }: AuthNavLinkProps) {
  const t = useTranslations('nav');
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);

  const fetchMe = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/auth/me', {
        cache: 'no-store',
        credentials: 'include',
        signal,
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.rol) return data as Me;
      return null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    (async () => {
      let result = await fetchMe(controller.signal);

      // Reintentar una vez si falla (cold start de Railway)
      if (!result && mounted) {
        await new Promise(r => setTimeout(r, 1500));
        if (mounted) result = await fetchMe(controller.signal);
      }

      if (mounted) {
        setMe(result);
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [fetchMe]);

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

  const showGestion = shouldShowGestion(me.rol);
  const gestionHref = getGestionHref(me.rol);

  const linkClass = variant === 'drawer'
    ? 'block py-3 text-base font-medium text-foreground hover:text-primary border-b border-border'
    : 'text-sm font-medium hover:underline';

  return (
    <span className={variant === 'drawer' ? 'flex flex-col' : 'flex items-center gap-4'}>
      <Link href="/mi-cuenta" className={linkClass}>
        {t('myAccount')}
      </Link>
      {showGestion && (
        <Link href={gestionHref} className={linkClass}>
          {t('management')}
        </Link>
      )}
    </span>
  );
}

