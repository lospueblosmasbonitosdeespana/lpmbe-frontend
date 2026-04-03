'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { CAMPANA_NAVIDAD, CAMPANA_NOCHE_ROMANTICA } from '../../_components/gestion-campana-themes';

const HERO_DEFAULT =
  'linear-gradient(135deg, #a0705a 0%, #b8856d 40%, #c49a82 100%)';

export type GestionPuebloSubpageTheme = 'default' | 'nocheRomantica' | 'navidad';

const THEME_STYLES: Record<
  GestionPuebloSubpageTheme,
  { gradient: string; blobA: string; blobB: string }
> = {
  default: {
    gradient: HERO_DEFAULT,
    blobA: 'bg-white/8',
    blobB: 'bg-white/6',
  },
  nocheRomantica: {
    gradient: CAMPANA_NOCHE_ROMANTICA.heroGradient,
    blobA: CAMPANA_NOCHE_ROMANTICA.blobA,
    blobB: CAMPANA_NOCHE_ROMANTICA.blobB,
  },
  navidad: {
    gradient: CAMPANA_NAVIDAD.heroGradient,
    blobA: CAMPANA_NAVIDAD.blobA,
    blobB: CAMPANA_NAVIDAD.blobB,
  },
};

export function GestionPuebloSubpageShell({
  slug,
  title,
  subtitle,
  heroIcon,
  children,
  maxWidthClass = 'max-w-4xl',
  heroBadges,
  heroAction,
  showFooter = true,
  theme = 'default',
}: {
  slug: string;
  title: string;
  subtitle: ReactNode;
  heroIcon?: ReactNode;
  children: ReactNode;
  maxWidthClass?: string;
  heroBadges?: ReactNode;
  heroAction?: ReactNode;
  showFooter?: boolean;
  /** `nocheRomantica` y `navidad` usan gradientes propios (no terracota). */
  theme?: GestionPuebloSubpageTheme;
}) {
  const t = THEME_STYLES[theme] ?? THEME_STYLES.default;
  const icon =
    heroIcon ?? (
      <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M4 19h16M4 15l4-6 4 4 4-8 4 10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );

  const backTint =
    theme === 'nocheRomantica'
      ? 'hover:border-pink-300/50 hover:bg-pink-50/40'
      : theme === 'navidad'
        ? 'hover:border-emerald-300/50 hover:bg-emerald-50/40'
        : 'hover:border-primary/25 hover:bg-muted/50';

  return (
    <main className={`mx-auto ${maxWidthClass} px-4 py-8 sm:px-6`}>
      <Link
        href={`/gestion/pueblos/${slug}`}
        className={`mb-6 inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all ${backTint} hover:text-foreground`}
      >
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a gestión del pueblo
      </Link>

      <div
        className="relative mb-8 overflow-hidden rounded-2xl p-6 text-white shadow-lg sm:p-8"
        style={{ background: t.gradient }}
      >
        <div className={`pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full blur-3xl ${t.blobA}`} aria-hidden />
        <div className={`pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full blur-3xl ${t.blobB}`} aria-hidden />
        <div className="pointer-events-none absolute right-1/4 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-white/5 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-inner ring-1 ring-white/25 backdrop-blur-sm">
              {icon}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight drop-shadow-sm sm:text-2xl">{title}</h1>
              <div className="mt-0.5 text-sm text-white/90">{subtitle}</div>
            </div>
          </div>
          {heroAction ? <div className="shrink-0">{heroAction}</div> : null}
        </div>
        {heroBadges ? <div className="relative mt-5 flex flex-wrap gap-3">{heroBadges}</div> : null}
      </div>

      {children}

      {showFooter ? (
        <div className="mt-10 border-t border-border/60 pt-6">
          <Link
            href={`/gestion/pueblos/${slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a gestión del pueblo
          </Link>
        </div>
      ) : null}
    </main>
  );
}
