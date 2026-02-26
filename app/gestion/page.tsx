// app/gestion/page.tsx
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { IconMapa, IconAsociacion } from './_components/GestionIcons';

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

export default async function GestionPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');

  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN' && me.rol !== 'EDITOR' && me.rol !== 'COLABORADOR') {
    redirect('/cuenta');
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Gestión</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {me.rol === 'COLABORADOR'
          ? 'Gestiona el recurso turístico que tienes asignado.'
          : me.rol === 'ALCALDE'
            ? 'Gestiona los contenidos de tus pueblos asignados.'
            : me.rol === 'EDITOR'
              ? 'Edita contenidos, fotos y rutas de los pueblos.'
              : 'Gestión de contenidos y configuración global.'}
      </p>

      {/* Colaborador: solo Mis recursos */}
      {me.rol === 'COLABORADOR' && (
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Mi recurso
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <GridCard
              href="/colaborador"
              title="Mis recursos"
              description="Ver métricas y validar QRs del recurso asignado"
              icon={<IconMapa />}
            />
          </div>
        </section>
      )}

      {/* Grid para alcaldes, editores y admin */}
      {(me.rol === 'ALCALDE' || me.rol === 'ADMIN' || me.rol === 'EDITOR') && (
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {me.rol === 'ALCALDE' ? 'Mis pueblos' : 'Pueblos'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <GridCard
              href="/gestion/mis-pueblos"
              title={me.rol === 'ALCALDE' ? 'Mis pueblos' : 'Pueblos'}
              description={
                me.rol === 'ALCALDE'
                  ? 'Gestiona los pueblos que tienes asignados'
                  : 'Ver y gestionar todos los pueblos'
              }
              icon={<IconMapa />}
            />
          </div>
        </section>
      )}

      {/* Grid para admins (Asociación) - no para colaborador */}
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
              icon={<IconAsociacion />}
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

