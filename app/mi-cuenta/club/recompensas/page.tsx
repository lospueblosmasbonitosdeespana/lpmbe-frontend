'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ChevronLeft,
  Gift,
  Coins,
  Sparkles,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import { Title, Caption } from '@/app/components/ui/typography';
import { WalletHeader } from '@/app/_components/club/WalletHeader';

type Recompensa = {
  id: number;
  nombre: string;
  descripcion: string;
  puntosCoste: number;
  tipo: string;
  categoria: string | null;
  imagen: string | null;
  stock: number | null;
  maxPorUsuario: number | null;
  validezDias: number | null;
  instrucciones: string | null;
  puedeCanjear: boolean;
  canjesUsuarioActual: number;
  stockDisponible: number | null;
  topeAlcanzado: boolean;
  puntosFaltan: number;
};

type CatalogoResponse = {
  saldo: {
    ganados: number;
    gastados: number;
    disponibles: number;
    canjesActivos: number;
  };
  items: Recompensa[];
};

type CanjeOk = {
  id: number;
  codigo: string;
  puntosUsados: number;
  expiresAt: string | null;
  recompensa: { nombre: string; instrucciones: string | null };
};

function buildTipoLabel(t: (key: string) => string): Record<string, string> {
  return {
    TIENDA: t('tipoTienda'),
    EXPERIENCIA: t('tipoExperiencia'),
    GUIA_DIGITAL: t('tipoGuiaDigital'),
    PRODUCTO_FISICO: t('tipoProducto'),
    DONACION: t('tipoDonacion'),
    OTRO: t('tipoOtro'),
    GENERAL: t('tipoGeneral'),
  };
}

export default function RecompensasPage() {
  const t = useTranslations('clubRecompensas');
  const TIPO_LABEL = useMemo(() => buildTipoLabel(t), [t]);
  const [data, setData] = useState<CatalogoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canjeando, setCanjeando] = useState<number | null>(null);
  const [canjeOk, setCanjeOk] = useState<CanjeOk | null>(null);
  const [canjeErr, setCanjeErr] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/club/recompensas', { cache: 'no-store' });
      if (r.status === 401) {
        window.location.href = '/entrar';
        return;
      }
      if (!r.ok) throw new Error(t('loadError'));
      const json = (await r.json()) as CatalogoResponse;
      setData(json);
    } catch (e: any) {
      setError(e?.message ?? t('errorUnknown'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCanjear(rec: Recompensa) {
    if (!rec.puedeCanjear) return;
    if (
      !window.confirm(
        t('confirmRedeem', { nombre: rec.nombre, puntos: rec.puntosCoste }),
      )
    ) {
      return;
    }
    setCanjeando(rec.id);
    setCanjeErr(null);
    setCanjeOk(null);
    try {
      const r = await fetch(`/api/club/recompensas/${rec.id}/canjear`, {
        method: 'POST',
        cache: 'no-store',
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(
          json?.message || json?.detail || t('redeemError'),
        );
      }
      setCanjeOk(json);
      reload();
    } catch (e: any) {
      setCanjeErr(e?.message ?? t('redeemErrorGeneric'));
    } finally {
      setCanjeando(null);
    }
  }

  const grupos = useMemo(() => {
    if (!data) return [] as Array<{ tipo: string; items: Recompensa[] }>;
    const map = new Map<string, Recompensa[]>();
    for (const r of data.items) {
      const key = r.tipo || 'OTRO';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return [...map.entries()].map(([tipo, items]) => ({ tipo, items }));
  }, [data]);

  return (
    <Section>
      <Container>
        <div className="mb-4">
          <Link
            href="/mi-cuenta/club"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={16} aria-hidden />
            {t('back')}
          </Link>
        </div>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <Title size="xl">{t('title')}</Title>
            <Caption>{t('subtitle')}</Caption>
          </div>
          <Sparkles className="hidden h-8 w-8 text-amber-500 sm:block" aria-hidden />
        </div>

        <WalletHeader className="mb-6" />

        {canjeOk && (
          <div className="mb-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} aria-hidden className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{t('redeemedTitle')}</p>
                <p className="mt-1 text-sm">
                  {t('redeemedBodyPrefix')}
                  <span className="font-mono font-semibold">{canjeOk.codigo}</span>
                  {t('redeemedBodyMid')}
                  <strong>{canjeOk.puntosUsados} {t('pointsUnit')}</strong>
                  {t('redeemedBodySuffix')}
                </p>
                {canjeOk.recompensa.instrucciones && (
                  <p className="mt-2 text-sm">{canjeOk.recompensa.instrucciones}</p>
                )}
                <Link
                  href="/mi-cuenta/club/mis-canjes"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold underline"
                >
                  {t('viewMyCoupons')}
                </Link>
              </div>
            </div>
          </div>
        )}

        {canjeErr && (
          <div className="mb-6 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} aria-hidden className="mt-0.5 shrink-0" />
              <p className="text-sm">{canjeErr}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            {t('loading')}
          </div>
        )}
        {error && !loading && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 p-6 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100">
            {error}
          </div>
        )}

        {!loading && !error && data && data.items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
            <Gift size={28} className="mx-auto mb-3 text-muted-foreground" aria-hidden />
            <Title size="lg" className="mb-1">{t('emptyTitle')}</Title>
            <Caption>{t('emptyText')}</Caption>
          </div>
        )}

        <div className="space-y-8">
          {grupos.map(({ tipo, items }) => (
            <section key={tipo}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {TIPO_LABEL[tipo] ?? tipo}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((r) => (
                  <RecompensaCard
                    key={r.id}
                    recompensa={r}
                    canjeando={canjeando === r.id}
                    onCanjear={() => handleCanjear(r)}
                    t={t}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function RecompensaCard({
  recompensa: r,
  canjeando,
  onCanjear,
  t,
}: {
  recompensa: Recompensa;
  canjeando: boolean;
  onCanjear: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const stockBajo =
    r.stockDisponible != null && r.stockDisponible > 0 && r.stockDisponible <= 5;
  const sinStock = r.stockDisponible != null && r.stockDisponible <= 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-amber-100 to-rose-100 dark:from-amber-900/30 dark:to-rose-900/30">
        {r.imagen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.imagen}
            alt={r.nombre}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Gift size={36} className="text-amber-600/60 dark:text-amber-400/60" aria-hidden />
          </div>
        )}
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-amber-900 shadow-sm dark:bg-zinc-900/95 dark:text-amber-100">
          <Coins size={12} aria-hidden /> {r.puntosCoste} {t('pointsUnit')}
        </span>
        {sinStock && (
          <span className="absolute left-2 top-2 rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
            {t('outOfStock')}
          </span>
        )}
        {!sinStock && stockBajo && (
          <span className="absolute left-2 top-2 rounded-full bg-amber-600 px-2 py-0.5 text-xs font-semibold text-white">
            {t('stockLeft', { n: r.stockDisponible ?? 0 })}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">{r.nombre}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{r.descripcion}</p>
        </div>

        <ul className="space-y-1 text-xs text-muted-foreground">
          {r.validezDias != null && (
            <li className="flex items-center gap-1.5">
              <Info size={12} aria-hidden /> {t('validFor', { n: r.validezDias })}
            </li>
          )}
          {r.maxPorUsuario != null && (
            <li className="flex items-center gap-1.5">
              <Info size={12} aria-hidden />{' '}
              {(r.maxPorUsuario === 1 ? t('maxOne', { n: r.maxPorUsuario }) : t('maxMany', { n: r.maxPorUsuario }))}
              {r.canjesUsuarioActual > 0 && t('alreadyHave', { n: r.canjesUsuarioActual })}
            </li>
          )}
        </ul>

        <div className="mt-auto pt-2">
          {r.puedeCanjear ? (
            <button
              type="button"
              onClick={onCanjear}
              disabled={canjeando}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 disabled:opacity-60"
            >
              {canjeando ? (
                t('redeeming')
              ) : (
                <>
                  <Gift size={14} aria-hidden /> {t('redeemFor', { puntos: r.puntosCoste })}
                </>
              )}
            </button>
          ) : r.topeAlcanzado ? (
            <button
              type="button"
              disabled
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-muted px-4 py-2 text-sm font-medium text-muted-foreground"
            >
              <CheckCircle2 size={14} aria-hidden /> {t('alreadyMaxed')}
            </button>
          ) : sinStock ? (
            <button
              type="button"
              disabled
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-muted px-4 py-2 text-sm font-medium text-muted-foreground"
            >
              {t('outOfStock')}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
            >
              <Lock size={14} aria-hidden /> {t('missingPoints', { n: r.puntosFaltan })}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
