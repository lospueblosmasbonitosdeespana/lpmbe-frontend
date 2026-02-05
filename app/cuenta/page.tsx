// app/cuenta/page.tsx
import { redirect } from 'next/navigation';
import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import LogoutButton from './LogoutButton';
import Link from 'next/link';
import { IconMapa, IconAsociacion } from '@/app/gestion/_components/GestionIcons';

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
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
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

export default async function CuentaPage() {
  const me = await getMeServer();

  if (!me) {
    redirect('/entrar');
  }

  const misPueblos =
    me.rol === 'ALCALDE' || me.rol === 'ADMIN'
      ? await getMisPueblosServer()
      : [];

  const rolBadgeClass =
    me.rol === 'ADMIN'
      ? 'bg-primary/15 text-primary border-primary/30'
      : me.rol === 'ALCALDE'
        ? 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400 dark:border-amber-400/30'
        : 'bg-muted text-muted-foreground border-border';

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Cuenta</h1>

      <section className="mt-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </span>
              <div className="mt-1 font-medium text-foreground">{me.email}</div>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Rol
              </span>
              <div className="mt-2 space-y-1">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${rolBadgeClass}`}
                >
                  {me.rol === 'ADMIN' ? 'Administrador' : me.rol === 'ALCALDE' ? 'Alcalde' : 'Usuario'}
                </span>
                {me.rol === 'ALCALDE' && misPueblos.length > 0 && (
                  <div className="text-sm font-medium text-foreground">
                    {misPueblos.length === 1 ? (
                      misPueblos[0].nombre
                    ) : (
                      misPueblos.map((p) => p.nombre).join(', ')
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 space-y-3">
        {me.rol === 'USUARIO' ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="font-medium">Tu cuenta</div>
            <div className="text-sm text-muted-foreground">
              Área de usuario básica (seguiremos ampliando).
            </div>
          </div>
        ) : null}

        {(me.rol === 'ALCALDE' || me.rol === 'ADMIN') ? (
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Gestión
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <GridCard
                href={me.rol === 'ALCALDE' ? '/gestion/mis-pueblos' : '/gestion'}
                title={
                  me.rol === 'ALCALDE' && misPueblos.length === 1
                    ? misPueblos[0].nombre
                    : me.rol === 'ADMIN'
                      ? 'Gestión de pueblos'
                      : 'Mis pueblos'
                }
                description={
                  me.rol === 'ALCALDE'
                    ? misPueblos.length === 0
                      ? 'No hay pueblos asociados.'
                      : misPueblos.length === 1
                        ? `Gestiona ${misPueblos[0].nombre}`
                        : `Gestiona tus ${misPueblos.length} pueblos`
                    : 'Todos los pueblos disponibles.'
                }
                icon={<IconMapa />}
              />
              {me.rol === 'ADMIN' && (
                <GridCard
                  href="/gestion/asociacion"
                  title="Asociación"
                  description="Configuración global, contenidos, tienda y más"
                  icon={<IconAsociacion />}
                />
              )}
            </div>
            {me.rol === 'ALCALDE' && misPueblos.length === 1 && (
              <p className="mt-3 text-sm text-muted-foreground">
                <Link
                  href={`/pueblos/${misPueblos[0].slug}`}
                  className="text-primary hover:underline"
                >
                  Ver ficha del pueblo →
                </Link>
              </p>
            )}
          </div>
        ) : null}
      </section>

      <LogoutButton />
    </main>
  );
}
