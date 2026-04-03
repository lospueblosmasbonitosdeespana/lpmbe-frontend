import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type GestionEntradaVariant = 'map' | 'docs' | 'asociacion' | 'recurso';

const VARIANT = {
  map: {
    card: 'hover:border-emerald-300/70 hover:shadow-emerald-500/5',
    iconWell:
      'bg-emerald-100 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-950/50 dark:text-emerald-200 dark:group-hover:bg-emerald-600 dark:group-hover:text-white',
    titleHover: 'group-hover:text-emerald-800 dark:group-hover:text-emerald-200',
    cta: 'text-emerald-700 group-hover:text-emerald-800 dark:text-emerald-400 dark:group-hover:text-emerald-300',
    accent: 'bg-gradient-to-br from-emerald-500/15 via-transparent to-sky-500/10',
  },
  docs: {
    card: 'hover:border-sky-300/70 hover:shadow-sky-500/5',
    iconWell:
      'bg-sky-100 text-sky-800 group-hover:bg-sky-600 group-hover:text-white dark:bg-sky-950/50 dark:text-sky-200 dark:group-hover:bg-sky-600 dark:group-hover:text-white',
    titleHover: 'group-hover:text-sky-900 dark:group-hover:text-sky-200',
    cta: 'text-sky-700 group-hover:text-sky-800 dark:text-sky-400 dark:group-hover:text-sky-300',
    accent: 'bg-gradient-to-br from-sky-500/12 via-transparent to-indigo-500/10',
  },
  asociacion: {
    card: 'hover:border-violet-300/70 hover:shadow-violet-500/5',
    iconWell:
      'bg-violet-100 text-violet-800 group-hover:bg-violet-600 group-hover:text-white dark:bg-violet-950/50 dark:text-violet-200 dark:group-hover:bg-violet-600 dark:group-hover:text-white',
    titleHover: 'group-hover:text-violet-900 dark:group-hover:text-violet-200',
    cta: 'text-violet-700 group-hover:text-violet-800 dark:text-violet-400 dark:group-hover:text-violet-300',
    accent: 'bg-gradient-to-br from-violet-500/12 via-transparent to-fuchsia-500/10',
  },
  recurso: {
    card: 'hover:border-amber-300/70 hover:shadow-amber-500/5',
    iconWell:
      'bg-amber-100 text-amber-900 group-hover:bg-amber-600 group-hover:text-white dark:bg-amber-950/40 dark:text-amber-200 dark:group-hover:bg-amber-600 dark:group-hover:text-white',
    titleHover: 'group-hover:text-amber-950 dark:group-hover:text-amber-100',
    cta: 'text-amber-800 group-hover:text-amber-900 dark:text-amber-400 dark:group-hover:text-amber-300',
    accent: 'bg-gradient-to-br from-amber-500/15 via-transparent to-orange-500/10',
  },
} as const;

export function GestionEntradaCard({
  href,
  title,
  description,
  icon,
  variant,
}: {
  href: string;
  title: string;
  description?: string;
  icon: ReactNode;
  variant: GestionEntradaVariant;
}) {
  const v = VARIANT[variant];

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
        v.card,
      )}
    >
      <div
        className={cn('pointer-events-none absolute inset-0 opacity-80 dark:opacity-60', v.accent)}
        aria-hidden
      />
      <div className="relative">
        <div
          className={cn(
            'mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
            v.iconWell,
          )}
        >
          {icon}
        </div>
        <h3 className={cn('font-semibold text-foreground transition-colors', v.titleHover)}>{title}</h3>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>}
        <span className={cn('mt-4 inline-flex items-center gap-1 text-sm font-medium', v.cta)}>
          Acceder
          <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

export function GestionEntradaSection({
  eyebrow,
  children,
  tone,
  className,
}: {
  eyebrow: string;
  children: ReactNode;
  tone: 'pueblos' | 'asociacion' | 'recurso';
  className?: string;
}) {
  const bar =
    tone === 'asociacion'
      ? 'from-violet-500 to-fuchsia-500'
      : tone === 'recurso'
        ? 'from-amber-500 to-orange-500'
        : 'from-emerald-500 to-sky-500';

  return (
    <section className={cn('mt-8 sm:mt-10', className)}>
      <div className="mb-4 flex items-center gap-3">
        <span className={cn('h-1 w-10 shrink-0 rounded-full bg-gradient-to-r', bar)} aria-hidden />
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}
