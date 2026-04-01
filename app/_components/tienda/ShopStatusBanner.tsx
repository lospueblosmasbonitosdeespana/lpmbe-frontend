'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';

type ShopStatus = {
  tiendaEstado: 'ABIERTA' | 'ENVIO_DIFERIDO' | 'CERRADA';
  tiendaMensaje: string | null;
  tiendaMensajeI18n: Record<string, string> | null;
  tiendaReapertura: string | null;
};

function resolveMsg(status: ShopStatus, locale: string): string | null {
  if (!status.tiendaMensaje) return null;
  if (locale !== 'es' && status.tiendaMensajeI18n?.[locale]) {
    return status.tiendaMensajeI18n[locale];
  }
  return status.tiendaMensaje;
}

export function useShopStatus() {
  const [status, setStatus] = useState<ShopStatus | null>(null);

  useEffect(() => {
    fetch('/api/shop-status', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setStatus(d))
      .catch(() => {});
  }, []);

  return status;
}

export function ShopStatusBanner() {
  const status = useShopStatus();
  const locale = useLocale();
  const [dismissed, setDismissed] = useState(false);

  if (!status || status.tiendaEstado === 'ABIERTA' || dismissed) return null;

  const isClosed = status.tiendaEstado === 'CERRADA';
  const msg = resolveMsg(status, locale);
  const fechaStr = status.tiendaReapertura
    ? new Date(status.tiendaReapertura).toLocaleDateString(locale === 'ca' ? 'ca' : locale, { weekday: 'long', day: 'numeric', month: 'long' })
    : null;

  return (
    <div className={`sticky top-0 z-40 mb-4 ${isClosed ? 'bg-red-600' : 'bg-amber-500'} shadow-lg`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl shrink-0">{isClosed ? '🔒' : '📦'}</span>
            <div className="min-w-0">
              <p className="font-bold text-sm text-white">
                {isClosed ? 'Tienda temporalmente cerrada' : 'Aviso: envío diferido'}
              </p>
              <p className="text-xs text-white/90 truncate">
                {msg || (isClosed ? 'Las compras están deshabilitadas temporalmente.' : 'Los envíos se realizarán con retraso.')}
                {fechaStr && (
                  <span className="font-semibold">
                    {' — '}{isClosed ? `Reapertura: ${fechaStr}` : `Envíos a partir del ${fechaStr}`}
                  </span>
                )}
              </p>
            </div>
          </div>
          {!isClosed && (
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="shrink-0 rounded-full p-1 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              aria-label="Cerrar aviso"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ShopClosedOverlay() {
  const status = useShopStatus();
  const locale = useLocale();
  if (!status || status.tiendaEstado !== 'CERRADA') return null;

  const msg = resolveMsg(status, locale);
  const fechaStr = status.tiendaReapertura
    ? new Date(status.tiendaReapertura).toLocaleDateString(locale === 'ca' ? 'ca' : locale, { weekday: 'long', day: 'numeric', month: 'long' })
    : null;

  return (
    <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-red-800">Tienda temporalmente cerrada</h3>
      {msg && <p className="mt-2 text-red-700">{msg}</p>}
      {fechaStr && <p className="mt-2 font-semibold text-red-800">Reapertura estimada: {fechaStr}</p>}
      <p className="mt-4 text-sm text-red-600">Puedes seguir viendo nuestros productos, pero las compras están deshabilitadas temporalmente.</p>
    </div>
  );
}
