'use client';

import { useState } from 'react';
import {
  PLAN_PRICES_MONTHLY,
  PLAN_PRICES_YEARLY,
  type PlanNegocio,
} from '@/lib/plan-features';

type Cadencia = 'MES' | 'ANUAL';

interface PlanCard {
  plan: 'RECOMENDADO' | 'PREMIUM';
  label: string;
  highlight: boolean;
  bullets: string[];
}

const CARDS: PlanCard[] = [
  {
    plan: 'RECOMENDADO',
    label: 'Recomendado',
    highlight: true,
    bullets: [
      'Galería de fotos completa',
      'WhatsApp y horarios públicos',
      'Badge "Club LPMBE"',
      'Traducción a 7 idiomas',
      'Estadísticas básicas',
      '1 story/mes en el highlight del Club',
    ],
  },
  {
    plan: 'PREMIUM',
    label: 'Premium',
    highlight: false,
    bullets: [
      'Todo lo del plan Recomendado +',
      'Landing personalizada del negocio',
      'Posición destacada en listados',
      'IA del Club te recomienda primero',
      'Mención editorial mensual',
      'Badge dorado y placa física',
      'Estadísticas avanzadas',
    ],
  },
];

export default function MejorarPlanModal({
  negocioId,
  negocioNombre,
  currentPlan,
  onClose,
}: {
  negocioId: number;
  negocioNombre: string;
  currentPlan: PlanNegocio;
  onClose: () => void;
}) {
  const [cadencia, setCadencia] = useState<Cadencia>('ANUAL');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async (plan: 'RECOMENDADO' | 'PREMIUM') => {
    setLoading(plan);
    setError(null);
    try {
      const successUrl = `${window.location.origin}${window.location.pathname}?plan=ok`;
      const cancelUrl = `${window.location.origin}${window.location.pathname}?plan=cancel`;
      const res = await fetch(`/api/club/negocios/${negocioId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, cadencia, successUrl, cancelUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.sessionUrl) {
        setError(data?.message || 'No se pudo iniciar el pago');
        setLoading(null);
        return;
      }
      window.location.href = data.sessionUrl;
    } catch (err) {
      setError('Error de red al iniciar el pago');
      setLoading(null);
    }
  };

  const priceFor = (plan: 'RECOMENDADO' | 'PREMIUM'): number | null => {
    return cadencia === 'MES' ? PLAN_PRICES_MONTHLY[plan] : PLAN_PRICES_YEARLY[plan];
  };

  const sufijo = cadencia === 'MES' ? '/mes' : '/año';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Mejora el plan de {negocioNombre}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Plan actual: <strong>{currentPlan}</strong>. Cancela cuando quieras.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Toggle cadencia */}
          <div className="mb-6 flex justify-center">
            <div className="inline-flex rounded-full border border-border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setCadencia('MES')}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  cadencia === 'MES' ? 'bg-foreground text-background' : 'text-muted-foreground'
                }`}
              >
                Mensual
              </button>
              <button
                type="button"
                onClick={() => setCadencia('ANUAL')}
                className={`relative rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  cadencia === 'ANUAL' ? 'bg-foreground text-background' : 'text-muted-foreground'
                }`}
              >
                Anual
                <span className="absolute -top-2 -right-2 rounded-full bg-green-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  -2 meses
                </span>
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {CARDS.map((card) => {
              const precio = priceFor(card.plan);
              const isCurrent = currentPlan === card.plan;
              return (
                <div
                  key={card.plan}
                  className={`flex flex-col rounded-2xl border-2 p-5 ${
                    card.highlight && !isCurrent
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-base font-bold text-foreground">{card.label}</h3>
                    {card.highlight && !isCurrent && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                        Más popular
                      </span>
                    )}
                    {isCurrent && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
                        Tu plan
                      </span>
                    )}
                  </div>
                  <div className="mb-3">
                    <span className="text-2xl font-bold text-foreground">
                      {precio != null ? `${precio} €` : '—'}
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">{sufijo}</span>
                  </div>
                  <ul className="flex-1 space-y-1.5 text-xs">
                    {card.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <svg className="h-3.5 w-3.5 shrink-0 text-green-600 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="text-foreground">{b}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => startCheckout(card.plan)}
                    disabled={isCurrent || !!loading}
                    className={`mt-4 w-full rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                      card.highlight
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-amber-500 text-white hover:bg-amber-600'
                    }`}
                  >
                    {isCurrent
                      ? 'Plan actual'
                      : loading === card.plan
                        ? 'Redirigiendo a Stripe…'
                        : `Suscribirme — ${precio} €${sufijo}`}
                  </button>
                </div>
              );
            })}
          </div>

          {error && (
            <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              {error}
            </p>
          )}

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Pago seguro vía Stripe · Cancela cuando quieras desde tu panel · Sin compromiso
          </p>
        </div>
      </div>
    </div>
  );
}
