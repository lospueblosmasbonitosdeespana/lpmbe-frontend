// app/gestion/page.tsx
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';

function GridCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground group-hover:text-primary">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
        Acceder
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </span>
    </Link>
  );
}

function MapIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01M9 13h.01M15 13h.01" />
    </svg>
  );
}

export default async function GestionPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');

  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN') {
    redirect('/cuenta');
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Gestión</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {me.rol === 'ALCALDE'
          ? 'Gestiona los contenidos de tus pueblos asignados.'
          : 'Gestión de contenidos y configuración global.'}
      </p>

      {/* Grid para alcaldes */}
      <section className="mt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Mis pueblos
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <GridCard
            href="/gestion/mis-pueblos"
            title="Mis pueblos"
            description={
              me.rol === 'ALCALDE'
                ? 'Gestiona los pueblos que tienes asignados'
                : 'Ver y gestionar todos los pueblos'
            }
            icon={<MapIcon />}
          />
        </div>
      </section>

      {/* Grid para admins (Asociación) */}
      {me.rol === 'ADMIN' && (
        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Asociación (global)
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <GridCard
              href="/gestion/asociacion"
              title="Asociación"
              description="Configuración global, contenidos, tienda y más"
              icon={<BuildingIcon />}
            />
          </div>
        </section>
      )}

      <div className="mt-10 text-sm">
        <Link className="text-muted-foreground hover:text-foreground hover:underline" href="/cuenta">
          ← Volver a cuenta
        </Link>
      </div>
    </main>
  );
}

