'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, lazy, useState } from 'react';
import ActividadDashboard from './ActividadDashboard';

const PueblosDashboard = lazy(() => import('./PueblosDashboard'));
const WebDashboard = lazy(() => import('./WebDashboard'));

const TABS = [
  { key: 'usuarios' as const, label: 'Usuarios' },
  { key: 'pueblos' as const, label: 'Pueblos' },
  { key: 'web' as const, label: 'Web' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

function Spinner() {
  return (
    <div className="flex items-center gap-2 py-20 text-muted-foreground">
      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
      </svg>
      Cargando…
    </div>
  );
}

export default function DatosTabs({ defaultTab }: { defaultTab: TabKey }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [active, setActive] = useState<TabKey>(defaultTab);

  const switchTab = (t: TabKey) => {
    setActive(t);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', t);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              active === t.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === 'usuarios' && <ActividadDashboard />}
      {active === 'pueblos' && (
        <Suspense fallback={<Spinner />}>
          <PueblosDashboard />
        </Suspense>
      )}
      {active === 'web' && (
        <Suspense fallback={<Spinner />}>
          <WebDashboard />
        </Suspense>
      )}
    </div>
  );
}
