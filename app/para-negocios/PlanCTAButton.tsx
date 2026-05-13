'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Variant = 'primary' | 'amber';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  amber: 'bg-amber-500 text-white hover:bg-amber-600',
};

interface Props {
  plan: 'PREMIUM';
  variant?: Variant;
}

const PLAN_LABELS = {
  PREMIUM: 'Premium',
} as const;

type MeState =
  | { status: 'loading' }
  | { status: 'anon' }
  | { status: 'user'; rol: string };

export default function PlanCTAButton({ plan, variant = 'primary' }: Props) {
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<MeState>({ status: 'loading' });
  const router = useRouter();
  const className = `block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors ${VARIANTS[variant]}`;

  useEffect(() => {
    let alive = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive) return;
        if (data && data.rol) {
          setMe({ status: 'user', rol: data.rol });
        } else {
          setMe({ status: 'anon' });
        }
      })
      .catch(() => {
        if (alive) setMe({ status: 'anon' });
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (me.status === 'user' && me.rol === 'ADMIN') {
      router.push('/gestion/asociacion');
      return;
    }
    if (me.status === 'user' && me.rol === 'COLABORADOR') {
      router.push(`/gestion/colaborador?upgrade=${plan}`);
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={className}
        disabled={me.status === 'loading'}
      >
        Quiero el plan {PLAN_LABELS[plan]}
      </button>

      {open && (
        <ChooseFlowModal
          plan={plan}
          isLoggedIn={me.status === 'user'}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function ChooseFlowModal({
  plan,
  isLoggedIn,
  onClose,
}: {
  plan: 'PREMIUM';
  isLoggedIn: boolean;
  onClose: () => void;
}) {
  const planLabel = PLAN_LABELS[plan];
  // Si está logueado, lleva a colaborador. Si no, login con redirección al panel.
  const hrefSiTengo = isLoggedIn
    ? `/gestion/colaborador?upgrade=${plan}`
    : `/entrar?next=${encodeURIComponent(`/gestion/colaborador?upgrade=${plan}`)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Plan {planLabel}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              ¿Tu negocio ya está dado de alta en uno de los pueblos de la red?
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

        <div className="grid sm:grid-cols-2 gap-3 p-5">
          {/* Opción 1: ya tiene negocio en la red */}
          <Link
            href={hrefSiTengo}
            className="flex flex-col items-start rounded-xl border-2 border-primary bg-primary/5 p-4 hover:bg-primary/10 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <h3 className="text-sm font-bold text-foreground">
                Sí, ya está en la red
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoggedIn
                ? 'Te llevamos a tu panel para que actives el plan al instante.'
                : 'Inicia sesión y actívalo desde tu panel en 2 minutos.'}
            </p>
            <span className="mt-3 text-xs font-semibold text-primary">
              {isLoggedIn ? 'Ir a mi panel →' : 'Iniciar sesión →'}
            </span>
          </Link>

          {/* Opción 2: no tiene aún negocio en la red */}
          <Link
            href={`/contacto?asunto=plan_${plan.toLowerCase()}`}
            className="flex flex-col items-start rounded-xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <h3 className="text-sm font-bold text-foreground">
                Aún no está en la red
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Habla con nosotros: te explicamos cómo dar de alta tu negocio en
              uno de los pueblos LPMBE.
            </p>
            <span className="mt-3 text-xs font-semibold text-muted-foreground">
              Contactar →
            </span>
          </Link>
        </div>

        <p className="border-t border-border bg-muted/20 px-5 py-3 text-center text-[11px] text-muted-foreground">
          Pago seguro con Stripe · Cancela cuando quieras · Sin compromiso
        </p>
      </div>
    </div>
  );
}
