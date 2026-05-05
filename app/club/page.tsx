'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Landmark,
  Mountain,
  Hotel,
  History,
  Lock,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

type AuthMe = { rol: string } | null;
type ClubMe = { isMember: boolean; plan: string | null } | null;

type Category = {
  icon: React.ElementType;
  titleKey: string;
  subKey: string;
  href: string;
  color: string;
  iconBg: string;
};

const CATEGORIES: Category[] = [
  {
    icon: Landmark,
    titleKey: 'accessRecursosTitle',
    subKey: 'accessRecursosSub',
    href: '/mi-cuenta/club/recursos',
    color: 'text-amber-700',
    iconBg: 'bg-amber-100',
  },
  {
    icon: Mountain,
    titleKey: 'accessRecursosRuralesTitle',
    subKey: 'accessRecursosRuralesSub',
    href: '/mi-cuenta/club/recursos-rurales',
    color: 'text-emerald-700',
    iconBg: 'bg-emerald-100',
  },
  {
    icon: Hotel,
    titleKey: 'accessNegociosTitle',
    subKey: 'accessNegociosSub',
    href: '/mi-cuenta/club/negocios',
    color: 'text-rose-700',
    iconBg: 'bg-rose-100',
  },
  {
    icon: History,
    titleKey: 'validationHistory',
    subKey: 'accessValidacionesSub',
    href: '/mi-cuenta/club/validaciones',
    color: 'text-sky-700',
    iconBg: 'bg-sky-100',
  },
];

export default function ClubHubPage() {
  const t = useTranslations('club');
  const [authMe, setAuthMe] = useState<AuthMe>(undefined as any);
  const [clubMe, setClubMe] = useState<ClubMe>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const meRes = await fetch(`/api/auth/me?_t=${Date.now()}`, {
          cache: 'no-store',
          credentials: 'include',
        });
        if (!meRes.ok) {
          if (mounted) { setAuthMe(null); setLoading(false); }
          return;
        }
        const me = await meRes.json();
        if (!me?.rol) {
          if (mounted) { setAuthMe(null); setLoading(false); }
          return;
        }
        if (mounted) setAuthMe(me);

        const clubRes = await fetch('/api/club/me', {
          cache: 'no-store',
          credentials: 'include',
        });
        if (clubRes.ok) {
          const club = await clubRes.json();
          if (mounted) setClubMe(club);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const isMember = !!clubMe?.isMember;
  const isLoggedIn = !!authMe;

  return (
    <main className="min-h-screen bg-[#faf7f2]">
      {/* Hero */}
      <div className="border-b border-amber-100 bg-gradient-to-b from-amber-50 to-[#faf7f2] px-4 py-12 text-center">
        <div className="mx-auto max-w-xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700">
            <Sparkles size={13} aria-hidden />
            {t('prelaunchBadge')}
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            El Club de los más Bonitos
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {t('prelaunchHeroSubtitle')}
          </p>
          {isMember && (
            <Link
              href="/mi-cuenta/club"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              {t('clubHubMemberArea')}
              <ChevronRight size={16} aria-hidden />
            </Link>
          )}
        </div>
      </div>

      {/* Categorías */}
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            const isLast = i === CATEGORIES.length - 1;

            if (isMember) {
              return (
                <Link
                  key={cat.titleKey}
                  href={cat.href}
                  className={`group flex items-center gap-4 px-5 py-4 transition hover:bg-muted/40 ${!isLast ? 'border-b border-border' : ''}`}
                >
                  <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cat.iconBg} ${cat.color}`}>
                    <Icon size={22} aria-hidden />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{t(cat.titleKey as any)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t(cat.subKey as any)}</p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              );
            }

            return (
              <div
                key={cat.titleKey}
                className={`flex items-center gap-4 px-5 py-4 opacity-50 ${!isLast ? 'border-b border-border' : ''}`}
              >
                <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cat.iconBg} ${cat.color}`}>
                  <Icon size={22} aria-hidden />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{t(cat.titleKey as any)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t(cat.subKey as any)}</p>
                </div>
                <Lock size={17} className="shrink-0 text-muted-foreground" aria-hidden />
              </div>
            );
          })}
        </div>

        {/* CTA para no socios */}
        {!loading && !isMember && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white px-6 py-8 text-center shadow-sm">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <ShieldCheck size={28} aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-bold text-amber-900">
              {t('clubHubLockedTitle')}
            </h2>
            <p className="mt-2 text-sm text-amber-800/80">
              {t('clubHubLockedDesc')}
            </p>
            <Link
              href={isLoggedIn ? '/mi-cuenta/club' : '/entrar?redirect=%2Fmi-cuenta%2Fclub'}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800"
            >
              <Sparkles size={15} aria-hidden />
              {t('joinClub')}
            </Link>
          </div>
        )}

        {/* Skeleton loading */}
        {loading && (
          <div className="mt-6 h-48 animate-pulse rounded-2xl bg-muted/40" />
        )}
      </div>
    </main>
  );
}
