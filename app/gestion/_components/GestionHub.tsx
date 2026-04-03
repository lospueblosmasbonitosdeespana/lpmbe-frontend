import Link from 'next/link';

const HUB_SVG_ICON = 'h-[1.7rem] w-[1.7rem] shrink-0 sm:h-[1.85rem] sm:w-[1.85rem]';

/** Emoji grande para tarjetas de acceso (mismo criterio que campañas estacionales). */
export function GestionHubEmoji({ emoji, label }: { emoji: string; label?: string }) {
  return (
    <span className="text-[1.9rem] leading-none sm:text-[2.05rem]" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {emoji}
    </span>
  );
}

/** Triángulo de alerta rojo (misma lectura que en la web pública / Lucide AlertTriangle). */
export function GestionHubIconAlertTriangle({ className }: { className?: string }) {
  return (
    <svg className={className ?? HUB_SVG_ICON} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 2.4 21.8 19.8H2.2L12 2.4z"
        fill="#dc2626"
        stroke="#b91c1c"
        strokeWidth={0.85}
        strokeLinejoin="round"
      />
      <path d="M12 8.2v5.2M12 16.4h.02" stroke="white" strokeWidth={1.9} strokeLinecap="round" />
    </svg>
  );
}

/** Webcam / cámara redonda tipo periférico, no videocámara de cinta. */
export function GestionHubIconWebcamRound({ className }: { className?: string }) {
  return (
    <svg className={className ?? HUB_SVG_ICON} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="10" r="7.25" fill="#374151" stroke="#1f2937" strokeWidth={1.25} />
      <circle cx="12" cy="10" r="3.6" fill="#0f172a" opacity={0.88} />
      <circle cx="9.35" cy="7.85" r="1.05" fill="white" opacity={0.28} />
      <path d="M12 17.25v2.35" stroke="#4b5563" strokeWidth={2} strokeLinecap="round" />
      <path d="M8.25 20.5h7.5" stroke="#4b5563" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

/** Señal tipo parking (P en azul) + equipamientos del visitante / pueblo. */
export function GestionHubIconVisitorParking({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-8 w-8 shrink-0 sm:h-[2.1rem] sm:w-[2.1rem]'} viewBox="0 0 24 24" aria-hidden>
      <rect x="2.5" y="2.5" width="19" height="19" rx="3.2" fill="#1d4ed8" />
      <text
        x="12"
        y="16.85"
        textAnchor="middle"
        fill="white"
        fontSize="12.5"
        fontWeight={800}
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      >
        P
      </text>
    </svg>
  );
}

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

/** Hero con toque de color tenue (familia LPMBE) sin saturar. */
export function GestionHubHero({
  title,
  subtitle,
}: {
  title: string;
  subtitle: React.ReactNode;
}) {
  return (
    <div className="relative mb-10 overflow-hidden rounded-2xl border border-[#a0705a]/18 px-6 py-7 shadow-sm sm:px-8 sm:py-8 dark:border-[#c49a82]/25 [background:linear-gradient(135deg,rgba(160,112,90,0.1)_0%,rgba(196,154,130,0.07)_38%,rgba(255,251,248,0.95)_64%,rgba(254,243,230,0.5)_100%)] dark:[background:linear-gradient(135deg,rgba(120,80,60,0.2)_0%,var(--background)_55%)]">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-amber-200/25 blur-3xl dark:bg-amber-800/15"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-rose-100/30 blur-3xl dark:bg-rose-900/10"
        aria-hidden
      />
      <div className="relative">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        <div className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-foreground/80 sm:text-[0.95rem]">{subtitle}</div>
      </div>
    </div>
  );
}

const SECTION_TONE: Record<
  string,
  { bar: string; wrap: string }
> = {
  warm: {
    bar: 'border-l-amber-600/50',
    wrap: 'rounded-2xl border border-amber-200/35 bg-amber-50/25 py-4 pl-4 pr-3 dark:border-amber-900/40 dark:bg-amber-950/20 sm:pl-5 sm:pr-4',
  },
  coral: {
    bar: 'border-l-rose-500/45',
    wrap: 'rounded-2xl border border-rose-200/35 bg-rose-50/20 py-4 pl-4 pr-3 dark:border-rose-900/35 dark:bg-rose-950/15 sm:pl-5 sm:pr-4',
  },
  sky: {
    bar: 'border-l-sky-600/45',
    wrap: 'rounded-2xl border border-sky-200/35 bg-sky-50/25 py-4 pl-4 pr-3 dark:border-sky-900/40 dark:bg-sky-950/20 sm:pl-5 sm:pr-4',
  },
  emerald: {
    bar: 'border-l-emerald-600/45',
    wrap: 'rounded-2xl border border-emerald-200/35 bg-emerald-50/22 py-4 pl-4 pr-3 dark:border-emerald-900/35 dark:bg-emerald-950/18 sm:pl-5 sm:pr-4',
  },
  violet: {
    bar: 'border-l-violet-500/45',
    wrap: 'rounded-2xl border border-violet-200/35 bg-violet-50/22 py-4 pl-4 pr-3 dark:border-violet-900/35 dark:bg-violet-950/18 sm:pl-5 sm:pr-4',
  },
  festive: {
    bar: 'border-l-[#b45309]/50',
    wrap: 'rounded-2xl border border-amber-200/40 bg-gradient-to-br from-red-50/30 via-amber-50/25 to-emerald-50/25 py-4 pl-4 pr-3 dark:border-amber-800/40 dark:from-red-950/15 dark:via-amber-950/15 dark:to-emerald-950/12 sm:pl-5 sm:pr-4',
  },
  slate: {
    bar: 'border-l-slate-500/45',
    wrap: 'rounded-2xl border border-slate-200/40 bg-slate-50/35 py-4 pl-4 pr-3 dark:border-slate-700/50 dark:bg-slate-950/25 sm:pl-5 sm:pr-4',
  },
};

export type GestionHubSectionTone = keyof typeof SECTION_TONE;

export function GestionHubSection({
  title,
  subtitle,
  tone = 'warm',
  children,
}: {
  title: string;
  subtitle?: string;
  tone?: GestionHubSectionTone;
  children: React.ReactNode;
}) {
  const t = SECTION_TONE[tone] ?? SECTION_TONE.warm;
  return (
    <section className={`mb-8 sm:mb-10 ${t.wrap}`}>
      <header className={`mb-4 border-l-[3px] pl-3.5 ${t.bar}`}>
        <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-foreground/90 sm:text-sm">{title}</h2>
        {subtitle ? (
          <p className="mt-1.5 text-sm font-semibold leading-snug text-foreground/75 dark:text-foreground/80">{subtitle}</p>
        ) : null}
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

const CARD_ACCENT: Record<string, string> = {
  amber: 'bg-amber-100/75 text-amber-950 ring-amber-200/55 group-hover:bg-amber-100 dark:bg-amber-950/35 dark:text-amber-100 dark:ring-amber-800/40',
  rose: 'bg-rose-100/75 text-rose-950 ring-rose-200/50 group-hover:bg-rose-100 dark:bg-rose-950/35 dark:text-rose-100 dark:ring-rose-800/40',
  sky: 'bg-sky-100/75 text-sky-950 ring-sky-200/50 group-hover:bg-sky-100 dark:bg-sky-950/35 dark:text-sky-100 dark:ring-sky-800/40',
  emerald: 'bg-emerald-100/75 text-emerald-950 ring-emerald-200/50 group-hover:bg-emerald-100 dark:bg-emerald-950/35 dark:text-emerald-100 dark:ring-emerald-800/40',
  violet: 'bg-violet-100/75 text-violet-950 ring-violet-200/50 group-hover:bg-violet-100 dark:bg-violet-950/35 dark:text-violet-100 dark:ring-violet-800/40',
  orange: 'bg-orange-100/75 text-orange-950 ring-orange-200/50 group-hover:bg-orange-100 dark:bg-orange-950/35 dark:text-orange-100 dark:ring-orange-800/40',
  cyan: 'bg-cyan-100/75 text-cyan-950 ring-cyan-200/50 group-hover:bg-cyan-100 dark:bg-cyan-950/35 dark:text-cyan-100 dark:ring-cyan-800/40',
  lime: 'bg-lime-100/70 text-lime-950 ring-lime-200/50 group-hover:bg-lime-100 dark:bg-lime-950/30 dark:text-lime-100 dark:ring-lime-800/40',
  pink: 'bg-pink-100/75 text-pink-950 ring-pink-200/50 group-hover:bg-pink-100 dark:bg-pink-950/35 dark:text-pink-100 dark:ring-pink-800/40',
  yellow: 'bg-yellow-100/75 text-yellow-950 ring-yellow-200/50 group-hover:bg-yellow-100 dark:bg-yellow-950/30 dark:text-yellow-100 dark:ring-yellow-800/40',
  indigo: 'bg-indigo-100/75 text-indigo-950 ring-indigo-200/50 group-hover:bg-indigo-100 dark:bg-indigo-950/35 dark:text-indigo-100 dark:ring-indigo-800/40',
  fuchsia: 'bg-fuchsia-100/70 text-fuchsia-950 ring-fuchsia-200/50 group-hover:bg-fuchsia-100 dark:bg-fuchsia-950/35 dark:text-fuchsia-100 dark:ring-fuchsia-800/40',
  teal: 'bg-teal-100/75 text-teal-950 ring-teal-200/50 group-hover:bg-teal-100 dark:bg-teal-950/35 dark:text-teal-100 dark:ring-teal-800/40',
  red: 'bg-red-100/70 text-red-950 ring-red-200/50 group-hover:bg-red-100 dark:bg-red-950/35 dark:text-red-100 dark:ring-red-800/40',
  green: 'bg-green-100/75 text-green-950 ring-green-200/50 group-hover:bg-green-100 dark:bg-green-950/35 dark:text-green-100 dark:ring-green-800/40',
  stone: 'bg-stone-100/80 text-stone-800 ring-stone-200/55 group-hover:bg-stone-100 dark:bg-stone-800/40 dark:text-stone-100 dark:ring-stone-600/40',
  slate: 'bg-slate-200/70 text-slate-900 ring-slate-300/50 group-hover:bg-slate-200 dark:bg-slate-800/45 dark:text-slate-100 dark:ring-slate-600/40',
};

export type GestionHubCardAccent = keyof typeof CARD_ACCENT;

export function GestionHubCard({
  href,
  title,
  description,
  icon,
  disabled,
  accent = 'stone',
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  disabled?: boolean;
  accent?: GestionHubCardAccent;
}) {
  const well = CARD_ACCENT[accent] ?? CARD_ACCENT.stone;

  if (disabled) {
    return (
      <div className="flex min-h-[168px] flex-col rounded-2xl border border-dashed border-border/80 bg-muted/25 p-5 opacity-55">
        <div className={`mb-3 flex h-[3.35rem] w-[3.35rem] items-center justify-center rounded-2xl ring-1 ${well} opacity-70`}>{icon}</div>
        <h3 className="text-base font-bold leading-snug text-foreground">{title}</h3>
        <p className="mt-1.5 text-sm font-medium leading-relaxed text-foreground/65 dark:text-foreground/70">{description}</p>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group flex min-h-[168px] flex-col rounded-2xl border border-border/70 bg-card/95 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#a0705a]/28 hover:shadow-md dark:bg-card"
    >
      <div
        className={`mb-3 flex h-[3.35rem] w-[3.35rem] shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 transition-transform duration-200 group-hover:scale-[1.03] ${well}`}
      >
        {icon}
      </div>
      <h3 className="text-base font-bold leading-snug text-foreground transition-colors group-hover:text-[#8B5E45] dark:group-hover:text-amber-200/90">
        {title}
      </h3>
      <p className="mt-1.5 flex-1 text-sm font-medium leading-relaxed text-foreground/65 dark:text-foreground/70">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#9a6b52] transition-colors group-hover:text-[#7a4f3a] dark:text-amber-200/80 dark:group-hover:text-amber-100">
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
