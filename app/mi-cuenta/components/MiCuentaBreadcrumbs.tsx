'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Breadcrumbs from '@/app/_components/ui/Breadcrumbs';

export default function MiCuentaBreadcrumbs() {
  const pathname = usePathname();
  const t = useTranslations('myAccount');
  
  const pathLabels: Record<string, string> = {
    '/mi-cuenta': t('breadcrumbAccount'),
    '/mi-cuenta/puntos': t('breadcrumbPoints'),
    '/mi-cuenta/pueblos': t('breadcrumbVillages'),
    '/mi-cuenta/bandeja': t('breadcrumbNotifCenter'),
    '/mi-cuenta/notificaciones': t('breadcrumbNotifPrefs'),
    '/mi-cuenta/perfil': t('breadcrumbProfile'),
    '/mi-cuenta/direcciones': t('breadcrumbAddresses'),
    '/mi-cuenta/club': t('breadcrumbClub'),
    '/mi-cuenta/mapa': t('breadcrumbMap'),
    '/mi-cuenta/club/recursos': t('breadcrumbResources'),
    '/mi-cuenta/club/validaciones': t('breadcrumbValidations'),
    '/mi-cuenta/club/visitados': t('breadcrumbVisited'),
  };
  
  const segments = pathname.split('/').filter(Boolean);
  const items = segments
    .map((seg, i) => {
      const href = '/' + segments.slice(0, i + 1).join('/');
      const label = pathLabels[href] ?? (/^\d+$/.test(seg) ? null : seg);
      if (label === null) return null;
      const isLast = i === segments.length - 1;
      return { label, href: isLast ? undefined : href };
    })
    .filter(Boolean) as { label: string; href?: string }[];
  return <Breadcrumbs items={items} />;
}
