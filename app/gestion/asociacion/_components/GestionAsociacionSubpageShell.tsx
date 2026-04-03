'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

const HERO_BG =
  'linear-gradient(135deg, #a0705a 0%, #b8856d 40%, #c49a82 100%)';

const BACK_HREF = '/gestion/asociacion';

/** Mismo patrón que contenidos globales: volver, hero terracota, pie. */
export function GestionAsociacionSubpageShell({
  title,
  subtitle,
  heroIcon,
  children,
  maxWidthClass = 'max-w-5xl',
  heroBadges,
  heroAction,
  showFooter = true,
}: {
  title: string;
  subtitle: ReactNode;
  heroIcon?: ReactNode;
  children: ReactNode;
  maxWidthClass?: string;
  heroBadges?: ReactNode;
  heroAction?: ReactNode;
  showFooter?: boolean;
}) {
  const icon =
    heroIcon ?? (
      <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    );

  return (
    <main className={`mx-auto ${maxWidthClass} px-4 py-8 sm:px-6`}>
      <Link
        href={BACK_HREF}
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:border-primary/25 hover:bg-muted/50 hover:text-foreground"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a gestión de la asociación
      </Link>

      <div
        className="relative mb-8 overflow-hidden rounded-2xl p-6 text-white sm:p-8"
        style={{ background: HERO_BG }}
      >
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/8 blur-3xl" aria-hidden />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/6 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-inner backdrop-blur-sm">
              {icon}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
              <div className="mt-0.5 text-sm text-white/80">{subtitle}</div>
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
            href={BACK_HREF}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a gestión de la asociación
          </Link>
        </div>
      ) : null}
    </main>
  );
}
