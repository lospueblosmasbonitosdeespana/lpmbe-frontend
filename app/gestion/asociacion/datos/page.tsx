import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import {
  IconMetricas,
  IconGlobo,
  IconUsuario,
  IconClub,
  IconAutorizados,
  IconEstrella,
  IconNewsletter,
  IconPueblos,
} from '../../_components/GestionIcons';

const ACCESOS = [
  {
    href: '/gestion/asociacion/datos/metricas',
    title: 'Métricas',
    description: 'Dashboard con métricas globales: Club, tienda, usuarios y actividad',
    icon: <IconMetricas />,
  },
  {
    href: '/gestion/asociacion/datos/visitas-web',
    title: 'Visitas y datos de la web',
    description: 'Analytics propio: páginas vistas, sesiones, dispositivos y referrers',
    icon: <IconGlobo />,
  },
  {
    href: '/gestion/asociacion/datos/usuarios',
    title: 'Usuarios',
    description: 'Gestión completa: ver, editar, cambiar roles y pueblos visitados',
    icon: <IconUsuario />,
  },
  {
    href: '/gestion/asociacion/datos/club',
    title: 'Club de Amigos',
    description: 'Socios del club: suscripciones, duración, pueblos visitados y validaciones',
    icon: <IconClub />,
  },
  {
    href: '/gestion/asociacion/datos/clientes',
    title: 'Clientes tienda',
    description: 'Listado de clientes de la tienda con historial de pedidos',
    icon: <IconAutorizados />,
  },
  {
    href: '/gestion/asociacion/datos/valoraciones-pueblos',
    title: 'Valoraciones de pueblos',
    description: 'Estrellas por pueblo, tops y estadísticas',
    icon: <IconEstrella />,
  },
  {
    href: '/gestion/asociacion/datos/newsletter',
    title: 'Newsletter',
    description: 'Suscriptores y gestión de la newsletter',
    icon: <IconNewsletter />,
  },
  {
    href: '/gestion/asociacion/datos/pueblos',
    title: 'Pueblos',
    description: 'Registro de todos los movimientos: quién ha tocado qué y cuándo',
    icon: <IconPueblos />,
  },
];

function GridCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground group-hover:text-primary">
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
        Acceder
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </span>
    </Link>
  );
}

export default async function DatosAdminPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-8">
        <Link
          href="/gestion/asociacion"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← Volver
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Datos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Métricas, clientes y newsletter. Visión global para administradores.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACCESOS.map((item) => (
          <GridCard
            key={item.href}
            href={item.href}
            title={item.title}
            description={item.description}
            icon={item.icon}
          />
        ))}
      </div>
    </main>
  );
}
