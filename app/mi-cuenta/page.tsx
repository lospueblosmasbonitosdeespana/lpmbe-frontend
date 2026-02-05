import Link from 'next/link';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import { Display, Lead, Caption } from '@/app/components/ui/typography';
import {
  Trophy,
  MapPin,
  Bell,
  Settings,
  User,
  Users,
  Package,
} from 'lucide-react';

const links = [
  {
    href: '/mi-cuenta/puntos',
    title: 'Mis puntos',
    description: 'Nivel, progreso y recompensas',
    icon: Trophy,
  },
  {
    href: '/mi-cuenta/pueblos',
    title: 'Pueblos visitados',
    description: 'Listado y valoraciones',
    icon: MapPin,
  },
  {
    href: '/mi-cuenta/bandeja',
    title: 'Centro de notificaciones',
    description: 'Ver mis notificaciones y alertas',
    icon: Bell,
  },
  {
    href: '/mi-cuenta/notificaciones',
    title: 'Preferencias de notificaciones',
    description: 'Configurar pueblos y tipos',
    icon: Settings,
  },
  {
    href: '/mi-cuenta/perfil',
    title: 'Mi perfil',
    description: 'Datos personales y seguridad',
    icon: User,
  },
  {
    href: '/mi-cuenta/direcciones',
    title: 'Mis direcciones',
    description: 'Direcciones de envío para tus compras',
    icon: Package,
  },
  {
    href: '/mi-cuenta/club',
    title: 'Club de Amigos',
    description: 'QR y recursos turísticos visitados',
    icon: Users,
  },
];

export default function MiCuentaPage() {
  return (
    <main>
      <Section spacing="none" background="default">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-muted via-muted/50 to-background" />
          <Container className="relative">
            <div className="flex flex-col items-center pb-12 pt-8 text-center lg:pb-16 lg:pt-12">
              <Display className="mb-4">Mi Cuenta</Display>
              <Lead className="mb-10 max-w-2xl text-muted-foreground">
                Tu espacio personal para gestionar puntos, pueblos favoritos y preferencias.
              </Lead>

              <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {links.map((item) => {
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
            </div>
          </Container>
        </div>
      </Section>
    </main>
  );
}
