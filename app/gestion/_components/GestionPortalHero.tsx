import type { ReactNode } from 'react';

export type GestionPortalRoleTone = 'alcalde' | 'admin' | 'editor' | 'colaborador';

const ROLE_BADGE: Record<GestionPortalRoleTone, { label: string; className: string }> = {
  alcalde: {
    label: 'Alcalde',
    className:
      'border-emerald-200/80 bg-emerald-100/90 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-100',
  },
  admin: {
    label: 'Administración',
    className:
      'border-violet-200/80 bg-violet-100/90 text-violet-900 dark:border-violet-800/60 dark:bg-violet-950/50 dark:text-violet-100',
  },
  editor: {
    label: 'Editor',
    className:
      'border-sky-200/80 bg-sky-100/90 text-sky-900 dark:border-sky-800/60 dark:bg-sky-950/50 dark:text-sky-100',
  },
  colaborador: {
    label: 'Colaborador',
    className:
      'border-amber-200/80 bg-amber-100/90 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100',
  },
};

export function GestionPortalHero({
  title,
  subtitle,
  roleTone,
  children,
}: {
  title: string;
  subtitle: string;
  roleTone: GestionPortalRoleTone;
  children?: ReactNode;
}) {
  const badge = ROLE_BADGE[roleTone];

  return (
    <div className="relative mb-10 overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-emerald-50/90 via-white to-violet-50/80 px-6 py-8 shadow-sm dark:from-emerald-950/25 dark:via-background dark:to-violet-950/20 sm:px-8 sm:py-9">
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-amber-200/35 blur-3xl dark:bg-amber-500/10"
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{subtitle}</p>
        </div>
        {children ? <div className="shrink-0 sm:pt-1">{children}</div> : null}
      </div>
    </div>
  );
}
