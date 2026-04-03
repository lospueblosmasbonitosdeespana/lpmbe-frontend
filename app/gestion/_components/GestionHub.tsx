import Link from 'next/link';

export function GestionHubBackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mb-6 inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:border-primary/20 hover:bg-muted/40 hover:text-foreground"
    >
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {children}
    </Link>
  );
}

/** Hero discreto: tonos piedra/ámbar muy suaves, sin el gradiente intenso de subpáginas de edición. */
export function GestionHubHero({
  title,
  subtitle,
}: {
  title: string;
  subtitle: React.ReactNode;
}) {
  return (
    <div className="relative mb-10 overflow-hidden rounded-2xl border border-stone-200/70 bg-gradient-to-br from-stone-50 via-background to-amber-50/20 px-6 py-7 shadow-sm sm:px-8 sm:py-8 dark:border-stone-800/80 dark:from-stone-950/40 dark:to-background">
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-100/25 blur-3xl dark:bg-amber-950/20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-stone-200/30 blur-3xl dark:bg-stone-800/25"
        aria-hidden
      />
      <div className="relative">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        <div className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  );
}

export function GestionHubSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10 sm:mb-12">
      <header className="mb-4 border-l-2 border-stone-400/55 pl-4 dark:border-stone-500">
        <h2 className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground/90">{subtitle}</p> : null}
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

export function GestionHubCard({
  href,
  title,
  description,
  icon,
  disabled,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="flex min-h-[168px] flex-col rounded-2xl border border-dashed border-border/80 bg-muted/30 p-5 opacity-55">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-border/50">
          {icon}
        </div>
        <h3 className="font-semibold leading-snug text-foreground">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group flex min-h-[168px] flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-sm ring-0 transition-all duration-200 hover:border-stone-300/90 hover:bg-stone-50/40 hover:shadow-md hover:ring-1 hover:ring-stone-200/60 dark:hover:border-stone-600 dark:hover:bg-stone-950/30 dark:hover:ring-stone-800"
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted/80 text-foreground/85 ring-1 ring-border/55 transition-all duration-200 group-hover:bg-background group-hover:text-primary group-hover:ring-primary/25">
        {icon}
      </div>
      <h3 className="font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">{title}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary/90 transition-colors group-hover:text-primary">
        Acceder
        <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </span>
    </Link>
  );
}

export function GestionHubFooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div className="mt-10 border-t border-border/60 pt-6">
      <Link
        href={href}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {children}
      </Link>
    </div>
  );
}
