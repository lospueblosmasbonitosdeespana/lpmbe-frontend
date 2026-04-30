'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Coins, Gift, Sparkles } from 'lucide-react';

type Saldo = {
  ganados: number;
  gastados: number;
  disponibles: number;
  canjesActivos: number;
  isMember: boolean;
};

/**
 * Cabecera del wallet del Club.
 *
 * Muestra el saldo disponible (puntos canjeables del socio) y un acceso al
 * catálogo de recompensas y a sus canjes. Usa el ledger inmutable detrás:
 * los puntos `ganados` nunca se borran y `disponibles = ganados − gastados`.
 *
 * Si el usuario aún no es socio se sigue mostrando con `disponibles=0` y un
 * mensaje invitando a hacerse socio (la API ya rellena `isMember` con la
 * suscripción real, no solo la sesión).
 */
export function WalletHeader({
  className = '',
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [saldo, setSaldo] = useState<Saldo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/club/wallet', { cache: 'no-store' });
        if (!r.ok) return;
        const data = await r.json();
        if (alive) setSaldo(data);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading || !saldo) {
    return (
      <div
        className={`flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-rose-50 px-4 py-3 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-rose-950/30 ${className}`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200/60 dark:bg-amber-900/40">
          <Coins size={18} className="text-amber-700 dark:text-amber-300" aria-hidden />
        </div>
        <div className="flex-1">
          <div className="h-3 w-24 animate-pulse rounded bg-amber-200/70 dark:bg-amber-900/40" />
          <div className="mt-1 h-2 w-32 animate-pulse rounded bg-amber-200/50 dark:bg-amber-900/30" />
        </div>
      </div>
    );
  }

  const formatNum = (n: number) =>
    new Intl.NumberFormat('es-ES').format(Math.max(0, n));

  if (compact) {
    return (
      <Link
        href="/mi-cuenta/club/recompensas"
        className={`group inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-950 ${className}`}
      >
        <Sparkles size={14} aria-hidden />
        <span>{formatNum(saldo.disponibles)} pts</span>
      </Link>
    );
  }

  return (
    <div
      className={`grid gap-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-4 shadow-sm dark:border-amber-900/40 dark:from-amber-950/30 dark:via-zinc-900 dark:to-rose-950/30 sm:grid-cols-[1fr_auto] ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-200/70 dark:bg-amber-900/40">
          <Coins size={22} className="text-amber-700 dark:text-amber-300" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-amber-800/80 dark:text-amber-200/70">
            Mi wallet del Club
          </p>
          <p className="mt-0.5 text-2xl font-bold text-amber-900 dark:text-amber-100">
            {formatNum(saldo.disponibles)}{' '}
            <span className="text-base font-medium text-amber-800/80 dark:text-amber-200/70">
              pts disponibles
            </span>
          </p>
          <p className="mt-1 text-xs text-amber-900/70 dark:text-amber-100/70">
            {formatNum(saldo.ganados)} ganados · {formatNum(saldo.gastados)} gastados
            {saldo.canjesActivos > 0 && ` · ${saldo.canjesActivos} cupones activos`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        <Link
          href="/mi-cuenta/club/recompensas"
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
        >
          <Gift size={14} aria-hidden />
          Canjear premios
        </Link>
        {saldo.canjesActivos > 0 && (
          <Link
            href="/mi-cuenta/club/mis-canjes"
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-600 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-50 dark:bg-zinc-900 dark:text-amber-100 dark:hover:bg-amber-950/40"
          >
            Mis cupones
          </Link>
        )}
      </div>
    </div>
  );
}
