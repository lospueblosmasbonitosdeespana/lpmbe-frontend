import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import { Display, Lead } from '@/app/components/ui/typography';
import {
  Trophy,
  MapPin,
  Settings,
  User,
  Users,
  Package,
  Bookmark,
  ShoppingBag,
} from 'lucide-react';
import { LogoutButton } from './components/LogoutButton';
import ThemeSelector from '@/app/cuenta/ThemeSelector';
import NotifCenterBadgeLink from './components/NotifCenterBadgeLink';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';
import NivelIcono from './components/NivelIcono';

type SectionTone = 'amber' | 'emerald' | 'violet' | 'sky';

export default async function MiCuentaPage() {
  const t = await getTranslations('myAccount');
  const levelsT = await getTranslations('levels');
  const pointsT = await getTranslations('points');

  const token = await getToken();
  const API_BASE = getApiUrl();
  let puntosTotales = 0;
  let nivelNombre = 'Turista Curioso';
  if (token) {
    try {
      const puntosRes = await fetch(`${API_BASE}/usuarios/me/puntos`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (puntosRes.ok) {
        const puntosData = await puntosRes.json();
        puntosTotales = Number(puntosData?.total ?? 0);
        nivelNombre = String(puntosData?.nivel ?? 'Turista Curioso');
      }
    } catch {
      // Fallo no crítico: mostramos la home de /mi-cuenta igualmente.
    }
  }

  const NIVEL_SLUG: Record<string, string> = {
    'Turista Curioso': 'turistaCurioso',
    'Explorador Local': 'exploradorLocal',
    'Viajero Apasionado': 'viajeroApasionado',
    'Amante de los Pueblos': 'amantePueblos',
    'Gran Viajero': 'granViajero',
    'Leyenda LPBE': 'leyendaLpbe',
    'Embajador de los Pueblos': 'embajadorPueblos',
    'Maestro Viajero': 'maestroViajero',
    'Gran Maestre de los Pueblos': 'granMaestre',
  };
  const nivelTraducido = NIVEL_SLUG[nivelNombre]
    ? levelsT(NIVEL_SLUG[nivelNombre])
    : nivelNombre;

  const notifCenter = {
    href: '/mi-cuenta/bandeja',
    title: t('notifCenter'),
    description: t('notifCenterDesc'),
  };

  const links = [
    {
      href: '/mi-cuenta/puntos',
      title: t('points'),
      description: t('pointsDesc'),
      icon: Trophy,
    },
    {
      href: '/planifica/mis-rutas',
      title: t('rutasGuardadas'),
      description: t('rutasGuardadasDesc'),
      icon: Bookmark,
    },
    {
      href: '/mi-cuenta/pueblos',
      title: t('visitedVillages'),
      description: t('visitedVillagesDesc'),
      icon: MapPin,
    },
    {
      href: '/mi-cuenta/notificaciones',
      title: t('notifPrefs'),
      description: t('notifPrefsDesc'),
      icon: Settings,
    },
    {
      href: '/mi-cuenta/perfil',
      title: t('myProfile'),
      description: t('myProfileDesc'),
      icon: User,
    },
    {
      href: '/mi-cuenta/direcciones',
      title: t('myAddresses'),
      description: t('myAddressesDesc'),
      icon: Package,
    },
    {
      href: '/mi-cuenta/pedidos',
      title: t('myOrders'),
      description: t('myOrdersDesc'),
      icon: ShoppingBag,
    },
    {
      href: '/mi-cuenta/club',
      title: t('club'),
      description: t('clubDesc'),
      icon: Users,
    },
  ];

  const sectionedLinks = [
    {
      title: t('sectionMyJourney'),
      description: t('sectionMyJourneyDesc'),
      items: [links[0], links[1], links[2]],
      includeNotifCenter: false,
      tone: 'emerald',
    },
    {
      title: t('sectionSettings'),
      description: t('sectionSettingsDesc'),
      items: [links[3], links[4]],
      includeNotifCenter: true,
      tone: 'violet',
    },
    {
      title: t('sectionShop'),
      description: t('sectionShopDesc'),
      items: [links[5], links[6]],
      includeNotifCenter: false,
      tone: 'sky',
    },
  ] as const;

  const cardClass =
    'group relative overflow-hidden flex min-h-[178px] flex-col items-center justify-center rounded-2xl border border-border/80 bg-gradient-to-br from-white via-card to-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg dark:from-card dark:via-card dark:to-card';

  const sectionToneClass: Record<
    SectionTone,
    { wrapper: string; chip: string; line: string }
  > = {
    amber: {
      wrapper: 'border-amber-200/70 bg-gradient-to-br from-amber-50/70 to-card dark:border-amber-900/60 dark:from-amber-950/40 dark:to-card',
      chip: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200',
      line: 'bg-amber-300/70 dark:bg-amber-900/70',
    },
    emerald: {
      wrapper: 'border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 to-card dark:border-emerald-900/60 dark:from-emerald-950/40 dark:to-card',
      chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200',
      line: 'bg-emerald-300/70 dark:bg-emerald-900/70',
    },
    violet: {
      wrapper: 'border-violet-200/70 bg-gradient-to-br from-violet-50/70 to-card dark:border-violet-900/60 dark:from-violet-950/40 dark:to-card',
      chip: 'bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-200',
      line: 'bg-violet-300/70 dark:bg-violet-900/70',
    },
    sky: {
      wrapper: 'border-sky-200/70 bg-gradient-to-br from-sky-50/70 to-card dark:border-sky-900/60 dark:from-sky-950/40 dark:to-card',
      chip: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-200',
      line: 'bg-sky-300/70 dark:bg-sky-900/70',
    },
  };

  return (
    <main>
      <Section spacing="none" background="default">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-muted via-muted/50 to-background" />
          <Container className="relative">
            <div className="flex flex-col items-center pb-12 pt-8 text-center lg:pb-16 lg:pt-12">
              <Display className="mb-4">{t('title')}</Display>
              <Lead className="mb-6 max-w-2xl text-muted-foreground">
                {t('subtitle')}
              </Lead>

              <div className="mb-10 w-full max-w-4xl rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm backdrop-blur-sm">
                <ThemeSelector />
              </div>

              <div className="w-full max-w-5xl space-y-6">
                <section className="rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-card to-card p-5 text-left shadow-sm dark:border-amber-900/60 dark:from-amber-950/40 dark:via-card dark:to-card sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <NivelIcono
                      nombreNivel={nivelNombre}
                      className="h-28 w-28 shrink-0 sm:h-32 sm:w-32"
                      imgClassName="scale-105"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-950/70 dark:text-amber-200">
                        {pointsT('myAccount')}
                      </span>
                      <p className="mt-2 text-3xl font-semibold leading-none tracking-tight text-foreground sm:text-4xl">
                        {puntosTotales} {pointsT('pointsLabel')}
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {nivelTraducido}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {levelsT('allPointsCount')}
                      </p>
                    </div>
                    <div className="h-[96px] w-[96px] shrink-0 overflow-hidden rounded-2xl border border-amber-200 bg-transparent p-0.5 shadow-sm dark:border-amber-900/60 sm:h-[112px] sm:w-[112px]">
                      <Image
                        src="/club-escudo-monocromo.png"
                        alt={links[7].title}
                        width={112}
                        height={112}
                        className="h-full w-full scale-[1.28] object-contain"
                      />
                    </div>
                  </div>
                </section>

                <Link
                  href={links[7].href}
                  className="group relative block overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-card to-card p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg dark:border-amber-900/60 dark:from-amber-950/40 dark:via-card dark:to-card sm:p-7"
                >
                  <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-amber-200/20 blur-2xl dark:bg-amber-900/30" />
                  <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="h-[132px] w-[132px] shrink-0 overflow-hidden rounded-2xl border border-amber-200 bg-transparent p-0.5 shadow-sm dark:border-amber-900/60">
                      <Image
                        src="/club-escudo-monocromo.png"
                        alt={links[7].title}
                        width={132}
                        height={132}
                        className="h-full w-full scale-[1.32] object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-950/70 dark:text-amber-200">
                        {t('sectionMyClub')}
                      </span>
                      <h2 className="mt-2 text-2xl font-bold text-foreground">
                        {links[7].title}
                      </h2>
                      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        {links[7].description}
                      </p>
                    </div>
                    <span className="text-xl font-semibold text-amber-700 transition-transform group-hover:translate-x-1 dark:text-amber-300">
                      →
                    </span>
                  </div>
                </Link>

                {sectionedLinks.map((section) => (
                  <section
                    key={section.title}
                    className={`rounded-3xl border p-4 sm:p-5 ${sectionToneClass[section.tone].wrapper}`}
                  >
                    <div className="mb-4 text-left">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${sectionToneClass[section.tone].chip}`}
                      >
                        {section.title}
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {section.description}
                      </p>
                      <div className={`mt-3 h-px w-full ${sectionToneClass[section.tone].line}`} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link key={item.href} href={item.href} className={cardClass}>
                            <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <Icon className="h-6 w-6" />
                            </span>
                            <p className="mb-1 text-center text-[15px] font-bold text-foreground">
                              {item.title}
                            </p>
                            <p className="text-center text-[14px] text-muted-foreground group-hover:text-foreground">
                              {item.description}
                            </p>
                          </Link>
                        );
                      })}
                      {section.includeNotifCenter && (
                        <NotifCenterBadgeLink
                          href={notifCenter.href}
                          title={notifCenter.title}
                          description={notifCenter.description}
                        />
                      )}
                    </div>
                  </section>
                ))}
              </div>

              <LogoutButton />
            </div>
          </Container>
        </div>
      </Section>
    </main>
  );
}
