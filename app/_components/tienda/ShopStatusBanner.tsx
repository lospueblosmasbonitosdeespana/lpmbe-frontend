'use client';

import { useEffect, useState } from 'react';

type ShopStatus = {
  tiendaEstado: 'ABIERTA' | 'ENVIO_DIFERIDO' | 'CERRADA';
  tiendaMensaje: string | null;
  tiendaReapertura: string | null;
};

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

  if (!status || status.tiendaEstado === 'ABIERTA') return null;

  const isClosed = status.tiendaEstado === 'CERRADA';
  const fechaStr = status.tiendaReapertura
    ? new Date(status.tiendaReapertura).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
    : null;

  return (
    <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 ${isClosed ? '' : ''}`}>
      <div className={`rounded-2xl px-5 py-4 ${isClosed ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">{isClosed ? '🔒' : '📦'}</span>
          <div className="flex-1">
            <p className={`font-semibold text-sm ${isClosed ? 'text-red-800' : 'text-amber-800'}`}>
              {isClosed ? 'Tienda temporalmente cerrada' : 'Aviso sobre envíos'}
            </p>
            {status.tiendaMensaje && (
              <p className={`mt-1 text-sm ${isClosed ? 'text-red-700' : 'text-amber-700'}`}>{status.tiendaMensaje}</p>
            )}
            {fechaStr && (
              <p className={`mt-1 text-sm font-medium ${isClosed ? 'text-red-800' : 'text-amber-800'}`}>
                {isClosed ? `Reapertura estimada: ${fechaStr}` : `Envíos a partir del ${fechaStr}`}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ShopClosedOverlay() {
  const status = useShopStatus();
  if (!status || status.tiendaEstado !== 'CERRADA') return null;

  const fechaStr = status.tiendaReapertura
    ? new Date(status.tiendaReapertura).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
    : null;

  return (
    <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-red-800">Tienda temporalmente cerrada</h3>
      {status.tiendaMensaje && <p className="mt-2 text-red-700">{status.tiendaMensaje}</p>}
      {fechaStr && <p className="mt-2 font-semibold text-red-800">Reapertura estimada: {fechaStr}</p>}
      <p className="mt-4 text-sm text-red-600">Puedes seguir viendo nuestros productos, pero las compras están deshabilitadas temporalmente.</p>
    </div>
  );
}
