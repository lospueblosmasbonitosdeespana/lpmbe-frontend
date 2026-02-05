'use client';

import { usePathname } from 'next/navigation';
import Breadcrumbs from '@/app/_components/ui/Breadcrumbs';

const pathLabels: Record<string, string> = {
  '/mi-cuenta': 'Mi cuenta',
  '/mi-cuenta/puntos': 'Mis puntos',
  '/mi-cuenta/pueblos': 'Pueblos visitados',
  '/mi-cuenta/bandeja': 'Centro de notificaciones',
  '/mi-cuenta/notificaciones': 'Preferencias de notificaciones',
  '/mi-cuenta/perfil': 'Mi perfil',
  '/mi-cuenta/direcciones': 'Mis direcciones',
  '/mi-cuenta/club': 'Club de Amigos',
  '/mi-cuenta/mapa': 'Mi mapa',
  '/mi-cuenta/club/recursos': 'Recursos',
  '/mi-cuenta/club/validaciones': 'Validaciones',
  '/mi-cuenta/club/visitados': 'Visitados',
};

export default function MiCuentaBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const items = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    const label = pathLabels[href] ?? seg;
    const isLast = i === segments.length - 1;
    return { label, href: isLast ? undefined : href };
  });
  return <Breadcrumbs items={items} />;
}
