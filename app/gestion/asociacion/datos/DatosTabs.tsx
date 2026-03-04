'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, lazy, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import ActividadDashboard from './ActividadDashboard';

const PueblosDashboard = lazy(() => import('./PueblosDashboard'));
const WebDashboard = lazy(() => import('./WebDashboard'));
const AppDashboard = dynamic(() => import('./AppDashboard'), { ssr: false });
const InternoDashboard = lazy(() => import('./InternoDashboard'));
const PuntosPueblosClient = lazy(() => import('./puntos-pueblos/PuntosPueblosClient'));

const TABS = [
  { key: 'usuarios' as const, labelKey: 'tabUsuarios' as const },
  { key: 'app' as const, labelKey: 'tabApp' as const },
  { key: 'interno' as const, labelKey: 'tabInterno' as const },
  { key: 'pueblos' as const, labelKey: 'tabPueblos' as const },
  { key: 'web' as const, labelKey: 'tabWeb' as const },
  { key: 'puntos' as const, labelKey: 'tabPuntosPueblos' as const },
] as const;

type TabKey = (typeof TABS)[number]['key'];

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-20 text-muted-foreground">
      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
      </svg>
      {label}
    </div>
  );
}

export default function DatosTabs({ defaultTab }: { defaultTab: TabKey }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [active, setActive] = useState<TabKey>(defaultTab);
  const t = useTranslations('gestion');

  const switchTab = (tab: TabKey) => {
    setActive(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            className={`flex-1 rounded-md px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
              active === tab.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {active === 'usuarios' && <ActividadDashboard />}
      {active === 'pueblos' && (
        <Suspense fallback={<Spinner label={t('loading')} />}>
          <PueblosDashboard />
        </Suspense>
      )}
      {active === 'web' && (
        <Suspense fallback={<Spinner label={t('loading')} />}>
          <WebDashboard />
        </Suspense>
      )}
      {active === 'app' && (
        <Suspense fallback={<Spinner label={t('loading')} />}>
          <AppDashboard />
        </Suspense>
      )}
      {active === 'interno' && (
        <Suspense fallback={<Spinner label={t('loading')} />}>
          <InternoDashboard />
        </Suspense>
      )}
      {active === 'puntos' && (
        <Suspense fallback={<Spinner label={t('loading')} />}>
          <PuntosPueblosClient />
        </Suspense>
      )}
    </div>
  );
}
