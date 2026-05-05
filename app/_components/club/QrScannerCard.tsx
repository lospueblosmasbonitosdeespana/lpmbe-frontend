'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Camera, X, ScanLine, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Title, Caption } from '@/app/components/ui/typography';

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

/**
 * Extrae el código QR a enviar al backend desde lo que el lector haya leído.
 * Acepta:
 *  - Códigos planos tipo "QR_64_A3F2B1"
 *  - Tokens dinámicos "LPBME:QR:..." o "LPBME:USER:..."
 *  - URLs como https://lospueblosmasbonitosdeespana.org/club/scan?c=QR_64_A3F2B1
 */
function normalizeScannedValue(raw: string): { codigoQr?: string; qrToken?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return {};

  if (trimmed.startsWith('LPBME:')) {
    return { qrToken: trimmed };
  }

  // Try to parse as URL with ?c= or ?qr= or ?codigo=
  try {
    const url = new URL(trimmed);
    const c = url.searchParams.get('c') ?? url.searchParams.get('qr') ?? url.searchParams.get('codigo');
    if (c) return { codigoQr: c };
  } catch {
    // not a URL
  }

  // Plain code (typically "QR_<puebloId>_<random>")
  return { codigoQr: trimmed };
}

export function QrScannerCard({
  className,
  onSuccess,
}: {
  className?: string;
  onSuccess?: (result: ScanResult) => void;
}) {
  const t = useTranslations('club');
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const scannerRef = useRef<any>(null);
  const elementId = 'lpmbe-qr-scanner';

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // ignore
      }
      try {
        await scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const submitCode = useCallback(
    async (raw: string) => {
      setError(null);
      const { codigoQr, qrToken } = normalizeScannedValue(raw);
      if (!codigoQr && !qrToken) {
        setError(t('scanErrorEmpty'));
        return;
      }

      setSubmitting(true);
      try {
        const res = await fetch('/api/club/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codigoQr,
            qrToken,
            origen: 'WEB_SCANNER',
            meta: { source: 'qr-scanner-card' },
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          window.location.href = '/entrar';
          return;
        }
        if (res.status === 403) {
          setError(t('scanErrorNotMember'));
          return;
        }
        if (res.status === 404) {
          setError(t('scanErrorNotFound'));
          return;
        }
        if (!res.ok) {
          setError(data?.error ?? data?.message ?? t('scanErrorGeneric'));
          return;
        }
        setResult(data as ScanResult);
        setManualCode('');
        onSuccess?.(data as ScanResult);
      } catch (e: any) {
        setError(e?.message ?? t('scanErrorGeneric'));
      } finally {
        setSubmitting(false);
      }
    },
    [onSuccess, t],
  );

  const startScanner = useCallback(async () => {
    setError(null);
    setResult(null);
    setScanning(true);

    try {
      const mod = await import('html5-qrcode');
      const Html5Qrcode = mod.Html5Qrcode;
      const scanner = new Html5Qrcode(elementId, { verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1,
        },
        async (decodedText: string) => {
          await stopScanner();
          await submitCode(decodedText);
        },
        () => {
          // ignore frame parse errors
        },
      );
    } catch (e: any) {
      setScanning(false);
      const msg = e?.message ?? '';
      if (/permiss|denied|NotAllowed/i.test(msg)) {
        setError(t('scanErrorCameraPermission'));
      } else if (/NotFound|NotReadable/i.test(msg)) {
        setError(t('scanErrorNoCamera'));
      } else {
        setError(t('scanErrorCameraGeneric'));
      }
    }
  }, [stopScanner, submitCode, t]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    submitCode(manualCode.trim());
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setManualCode('');
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <ScanLine size={18} className="text-primary" aria-hidden />
        <Title size="lg">{t('scanTitle')}</Title>
      </div>
      <Caption className="block mb-4">{t('scanDesc')}</Caption>

      {result && (
        <div
          className={`mb-4 rounded-xl border p-4 ${
            result.puntosOtorgados && result.puntosOtorgados > 0
              ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/30'
              : 'border-amber-300 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30'
          }`}
        >
          <div className="flex items-start gap-3">
            <CheckCircle2
              size={22}
              className={
                result.puntosOtorgados && result.puntosOtorgados > 0
                  ? 'text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5'
                  : 'text-amber-700 dark:text-amber-300 shrink-0 mt-0.5'
              }
              aria-hidden
            />
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                {result.recursoNombre ?? t('scanSuccessGeneric')}
              </p>
              {result.puebloNombre && (
                <p className="text-xs text-muted-foreground mt-0.5">{result.puebloNombre}</p>
              )}
              {result.puntosOtorgados && result.puntosOtorgados > 0 ? (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-200/60 px-3 py-1 text-sm font-bold text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100">
                  <Sparkles size={14} aria-hidden />
                  {t('scanPointsAwarded', { n: result.puntosOtorgados })}
                </p>
              ) : (
                <p className="mt-2 text-sm text-amber-900 dark:text-amber-100">
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
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('scanShowDiscount', { n: result.descuentoPorcentaje })}
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted/30"
            >
              {t('scanAnother')}
            </button>
          </div>
        </div>
      )}

      {!result && (
        <>
          {scanning ? (
            <div className="space-y-3">
              <div
                id={elementId}
                className="overflow-hidden rounded-xl border-2 border-primary/40 bg-black"
                style={{ minHeight: '260px' }}
              />
              <button
                type="button"
                onClick={stopScanner}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted/30"
              >
                <X size={14} aria-hidden />
                {t('scanCancel')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startScanner}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
            >
              <Camera size={16} aria-hidden />
              {t('scanOpenCamera')}
            </button>
          )}

          <div className="mt-5 border-t border-border pt-4">
            <Caption className="block mb-2">{t('scanManualHint')}</Caption>
            <form onSubmit={handleManualSubmit} className="flex flex-wrap gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                disabled={submitting}
                placeholder={t('scanManualPlaceholder')}
                className="flex-1 min-w-[220px] rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={submitting || !manualCode.trim()}
                className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? t('scanRegistering') : t('scanRegister')}
              </button>
            </form>
          </div>
        </>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
