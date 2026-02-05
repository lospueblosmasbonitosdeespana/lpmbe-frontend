import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';

const ACCESOS = [
  {
    href: '/gestion/asociacion/home',
    title: 'Configuración del Home',
    description: 'Banners y bloques de la página principal',
    icon: '🏠',
  },
  {
    href: '/gestion/asociacion/rutas',
    title: 'Rutas',
    description: 'Multiexperiencias y rutas turísticas',
    icon: '🛤️',
  },
  {
    href: '/gestion/asociacion/contenidos',
    title: 'Contenidos',
    description: 'Páginas, noticias y eventos globales',
    icon: '📄',
  },
  {
    href: '/gestion/asociacion/alertas',
    title: 'Alertas globales',
    description: 'Avisos visibles a nivel nacional',
    icon: '⚠️',
  },
  {
    href: '/gestion/asociacion/club',
    title: 'Club de amigos',
    description: 'Configuración del club y socios',
    icon: '👥',
  },
  {
    href: '/gestion/asociacion/tienda',
    title: 'Tienda',
    description: 'Productos, pedidos y promociones',
    icon: '🛒',
  },
  {
    href: '/gestion/asociacion/datos',
    title: 'Datos',
    description: 'Métricas, clientes, newsletter',
    icon: '📊',
  },
  {
    href: '/gestion/asociacion/ajustes',
    title: 'Ajustes de marca',
    description: 'Logo y nombre del sitio',
    icon: '🎨',
  },
  {
    href: '/gestion/asociacion/el-sello',
    title: 'El Sello (CMS)',
    description: 'Páginas y contenidos de El Sello',
    icon: '🏅',
  },
  {
    href: '/gestion/asociacion/el-sello/documentos',
    title: 'Documentos',
    description: 'PDFs (Estatutos, Carta de Calidad)',
    icon: '📑',
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
  icon: string;
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

export default async function GestionAsociacionPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Gestión · Asociación</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Noticias, eventos y alertas globales (visibles a nivel nacional).
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <div className="mt-10 text-sm">
        <Link className="text-muted-foreground hover:text-foreground hover:underline" href="/gestion">
          ← Volver
        </Link>
      </div>
    </main>
  );
}

