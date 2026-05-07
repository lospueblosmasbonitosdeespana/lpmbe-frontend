'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { GranEventoAviso } from '@/lib/grandes-eventos';
import { pickI18n } from '@/lib/grandes-eventos';
import { getApiUrl } from '@/lib/api';

const POLL_INTERVAL_MS = 60_000;

/**
 * Banner sticky de avisos urgentes durante el evento.
 * - Hace polling cada 60s al endpoint público /public/grandes-eventos/:slug/avisos.
 * - Muestra una tarjeta destacada por aviso con texto i18n + botón WhatsApp.
 * - El usuario puede descartar avisos individualmente (recordando en localStorage).
 * - Importancia define el color: info (azul), warning (ámbar), critical (rojo).
 */
export default function GranEventoBannerAvisos({
  slug,
  eventoTitulo,
}: {
  slug: string;
  eventoTitulo: string;
}) {
  const locale = useLocale();
  const t = useTranslations('granEvento.aviso');
  const [avisos, setAvisos] = useState<GranEventoAviso[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = window.localStorage.getItem(`gran-evento-avisos-dismissed:${slug}`);
      return raw ? new Set(JSON.parse(raw) as number[]) : new Set();
    } catch {
      return new Set();
    }
  });

  const fetchAvisos = useCallback(async () => {
    try {
      const res = await fetch(`${getApiUrl()}/public/grandes-eventos/${encodeURIComponent(slug)}/avisos`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = (await res.json()) as GranEventoAviso[];
      setAvisos(data);
    } catch {
      // Silenciamos errores: el banner es complementario.
    }
  }, [slug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- polling pattern: efecto inicializa estado vía fetch.
    fetchAvisos();
    const id = setInterval(fetchAvisos, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchAvisos]);

  const dismiss = (id: number) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        window.localStorage.setItem(
          `gran-evento-avisos-dismissed:${slug}`,
          JSON.stringify(Array.from(next)),
        );
      } catch {
        // ignore
      }
      return next;
    });
  };

  const visibleAvisos = avisos.filter((a) => !dismissed.has(a.id));
  if (visibleAvisos.length === 0) return null;

  return (
    <div className="sticky top-0 z-40 w-full">
      <div className="space-y-2 px-3 py-3 sm:px-6">
        {visibleAvisos.map((aviso) => {
          const texto = pickI18n(aviso.texto_es, aviso.texto_i18n, locale);
          const colors = importanciaStyles(aviso.importancia);
          const whatsappText = `${eventoTitulo}\n\n${texto}`;
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

          return (
            <div
              key={aviso.id}
              className={`flex flex-col gap-3 overflow-hidden rounded-2xl border-2 ${colors.border} ${colors.bg} p-4 shadow-2xl ring-1 ring-black/5 backdrop-blur-md sm:flex-row sm:items-start sm:p-5`}
              role="alert"
              aria-live={aviso.importancia === 'critical' ? 'assertive' : 'polite'}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors.iconBg}`}>
                <span className={`block h-6 w-6 ${colors.iconColor}`} aria-hidden>
                  {iconForImportancia(aviso.importancia)}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className={`mb-1 text-[11px] font-bold uppercase tracking-[0.18em] ${colors.label}`}>
                  {t(`label.${aviso.importancia}`)}
                </p>
                <p className={`whitespace-pre-line text-[15px] font-medium leading-relaxed ${colors.text} sm:text-base`}>
                  {texto}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#1DA851] hover:shadow-lg"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    {t('shareWhatsApp')}
                  </a>
                  <button
                    onClick={() => dismiss(aviso.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white/80 px-3 py-2 text-xs font-medium text-stone-600 transition hover:border-stone-400 hover:text-stone-900"
                  >
                    {t('dismiss')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function importanciaStyles(importancia: 'info' | 'warning' | 'critical') {
  switch (importancia) {
    case 'critical':
      return {
        bg: 'bg-red-50/95',
        border: 'border-red-300',
        iconBg: 'bg-red-200/70',
        iconColor: 'text-red-700',
        text: 'text-red-900',
        label: 'text-red-700',
      };
    case 'warning':
      return {
        bg: 'bg-amber-50/95',
        border: 'border-amber-300',
        iconBg: 'bg-amber-200/70',
        iconColor: 'text-amber-700',
        text: 'text-amber-900',
        label: 'text-amber-700',
      };
    case 'info':
    default:
      return {
        bg: 'bg-sky-50/95',
        border: 'border-sky-300',
        iconBg: 'bg-sky-200/70',
        iconColor: 'text-sky-700',
        text: 'text-sky-900',
        label: 'text-sky-700',
      };
  }
}

function iconForImportancia(importancia: 'info' | 'warning' | 'critical') {
  if (importancia === 'critical') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
    );
  }
  if (importancia === 'warning') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
  );
}
