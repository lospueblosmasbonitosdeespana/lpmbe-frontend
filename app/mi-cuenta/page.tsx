import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import { Display, Lead, Caption } from '@/app/components/ui/typography';
import {
  Trophy,
  MapPin,
  Settings,
  User,
  Users,
  Package,
  Bookmark,
} from 'lucide-react';
import { LogoutButton } from './components/LogoutButton';
import ThemeSelector from '@/app/cuenta/ThemeSelector';
import NotifCenterBadgeLink from './components/NotifCenterBadgeLink';

export default async function MiCuentaPage() {
  const t = await getTranslations('myAccount');

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
      href: '/mi-cuenta/club',
      title: t('club'),
      description: t('clubDesc'),
      icon: Users,
    },
  ];
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

              <div className="mb-10 w-full max-w-4xl">
                <ThemeSelector />
              </div>

              <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Puntos, Rutas, Pueblos */}
                {links.slice(0, 3).map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                    >
                      <Icon className="mb-3 h-8 w-8 text-primary" />
                      <Caption className="mb-1 font-medium">{item.title}</Caption>
                      <p className="text-center text-sm text-muted-foreground group-hover:text-foreground">
                        {item.description}
                      </p>
                    </Link>
                  );
                })}
                {/* Centro de notificaciones con badge de no leídas */}
                <NotifCenterBadgeLink
                  href={notifCenter.href}
                  title={notifCenter.title}
                  description={notifCenter.description}
                />
                {/* Resto de links */}
                {links.slice(3).map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                    >
                      <Icon className="mb-3 h-8 w-8 text-primary" />
                      <Caption className="mb-1 font-medium">{item.title}</Caption>
                      <p className="text-center text-sm text-muted-foreground group-hover:text-foreground">
                        {item.description}
                      </p>
                    </Link>
                  );
                })}
              </div>

              <LogoutButton />
            </div>
          </Container>
        </div>
      </Section>
    </main>
  );
}
