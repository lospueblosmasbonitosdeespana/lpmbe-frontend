'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ScanLine,
  LogIn,
  Loader2,
} from 'lucide-react';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import { Headline, Title, Caption } from '@/app/components/ui/typography';

type ScanResult = {
  ok: boolean;
  duplicated?: boolean;
  modo?: string;
  recursoId?: number;
  recursoNombre?: string | null;
  puebloId?: number | null;
  puebloNombre?: string | null;
  puebloSlug?: string | null;
  esNegocio?: boolean;
  descuentoPorcentaje?: number | null;
  puntosOtorgados?: number;
  motivoNoSuma?: string | null;
};

export default function ScanLandingPage() {
  const t = useTranslations('club');
  const params = useSearchParams();
  const router = useRouter();

  const code = params.get('c') ?? params.get('qr') ?? params.get('codigo') ?? '';
  const tokenParam = params.get('t') ?? params.get('token') ?? '';

  const [state, setState] = useState<'idle' | 'auth-check' | 'submitting' | 'done' | 'error' | 'unauth' | 'no-code'>(
    'auth-check',
  );
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitScan = useCallback(async () => {
    if (!code && !tokenParam) {
      setState('no-code');
      return;
    }
    setState('submitting');
    setError(null);
    try {
      const res = await fetch('/api/club/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigoQr: code || undefined,
          qrToken: tokenParam || undefined,
          origen: 'WEB_LANDING',
          meta: { source: 'club-scan-page' },
        }),
      });
      if (res.status === 401) {
        const next = encodeURIComponent(`/club/scan?${params.toString()}`);
        router.replace(`/entrar?next=${next}`);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        setError(t('scanErrorNotMember'));
        setState('error');
        return;
      }
      if (res.status === 404) {
        setError(t('scanErrorNotFound'));
        setState('error');
        return;
      }
      if (!res.ok) {
        setError(data?.error ?? data?.message ?? t('scanErrorGeneric'));
        setState('error');
        return;
      }
      setResult(data as ScanResult);
      setState('done');
    } catch (e: any) {
      setError(e?.message ?? t('scanErrorGeneric'));
      setState('error');
    }
  }, [code, tokenParam, params, router, t]);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (cancelled) return;
        if (res.status === 401 || !res.ok) {
          setState('unauth');
          return;
        }
        await submitScan();
      } catch {
        if (!cancelled) setState('unauth');
      }
    }
    if (!code && !tokenParam) {
      setState('no-code');
      return;
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [code, tokenParam, submitScan]);

  const loginUrl = `/entrar?next=${encodeURIComponent(`/club/scan?${params.toString()}`)}`;

  return (
    <Section spacing="lg" background="default">
      <Container>
        <div className="mx-auto max-w-xl">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ScanLine size={24} aria-hidden />
          </div>
          <Headline as="h1" className="mb-2">
            {t('scanTitle')}
          </Headline>
          <Caption className="mb-6 block">{t('scanDesc')}</Caption>

          {state === 'auth-check' && (
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              <Loader2 size={16} className="inline animate-spin mr-2" aria-hidden />
              {t('checkingMembership')}
            </div>
          )}

          {state === 'submitting' && (
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              <Loader2 size={16} className="inline animate-spin mr-2" aria-hidden />
              {t('scanRegistering')}
            </div>
          )}

          {state === 'unauth' && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-800/50 dark:bg-amber-950/30">
              <Title size="lg" className="mb-2">{t('loginRequiredTitle')}</Title>
              <Caption className="mb-4 block">{t('loginRequiredDesc')}</Caption>
              <Link
                href={loginUrl}
                className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <LogIn size={16} aria-hidden />
                {t('loginToContinue')}
              </Link>
              <Link
                href="/club"
                className="ml-2 inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/30"
              >
                {t('discoverClub')}
              </Link>
            </div>
          )}

          {state === 'done' && result && (
            <div
              className={`rounded-2xl border p-6 ${
                result.puntosOtorgados && result.puntosOtorgados > 0
                  ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/30'
                  : 'border-amber-300 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={28}
                  className={
                    result.puntosOtorgados && result.puntosOtorgados > 0
                      ? 'text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5'
                      : 'text-amber-700 dark:text-amber-300 shrink-0 mt-0.5'
                  }
                  aria-hidden
                />
                <div className="flex-1">
                  <Title size="lg" className="mb-1">
                    {result.recursoNombre ?? t('scanSuccessGeneric')}
                  </Title>
                  {result.puebloNombre && (
                    <Caption className="block">{result.puebloNombre}</Caption>
                  )}
                  {result.puntosOtorgados && result.puntosOtorgados > 0 ? (
                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-200/60 px-3 py-1.5 text-base font-bold text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100">
                      <Sparkles size={16} aria-hidden />
                      {t('scanPointsAwarded', { n: result.puntosOtorgados })}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-amber-900 dark:text-amber-100">
                      {result.motivoNoSuma === 'COOLDOWN'
                        ? t('scanCooldown')
                        : result.motivoNoSuma === 'TOPE_PERIODO'
                          ? t('scanLimitReached')
                          : result.motivoNoSuma === 'YA_OTORGADO'
                            ? t('scanAlreadyAwarded')
                            : t('scanNoPoints')}
                    </p>
                  )}
                  {result.descuentoPorcentaje && result.descuentoPorcentaje > 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t('scanShowDiscount', { n: result.descuentoPorcentaje })}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/mi-cuenta/club"
                  className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  {t('goToMyClub')}
                </Link>
                {result.puebloSlug && (
                  <Link
                    href={`/pueblos/${result.puebloSlug}`}
                    className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/30"
                  >
                    {t('exploreVillage')}
                  </Link>
                )}
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
              <div className="flex items-start gap-3">
                <AlertCircle size={22} className="text-destructive shrink-0 mt-0.5" aria-hidden />
                <div>
                  <Title size="lg" className="mb-1">
                    {t('scanErrorTitle')}
                  </Title>
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </div>
              <Link
                href="/mi-cuenta/club"
                className="mt-4 inline-block rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/30"
              >
                {t('goToMyClub')}
              </Link>
            </div>
          )}

          {state === 'no-code' && (
            <div className="rounded-xl border border-border bg-card p-6">
              <Title size="lg" className="mb-2">{t('scanNoCodeTitle')}</Title>
              <Caption className="block">{t('scanNoCodeDesc')}</Caption>
              <Link
                href="/mi-cuenta/club"
                className="mt-4 inline-block rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                {t('goToMyClub')}
              </Link>
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}
