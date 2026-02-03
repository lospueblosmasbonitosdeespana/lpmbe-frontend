// app/cuenta/page.tsx
import { redirect } from 'next/navigation';
import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import LogoutButton from './LogoutButton';
import ProfileForm from './ProfileForm';
import Link from 'next/link';

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');

  // USUARIO va a su área personal en /mi-cuenta
  if (me.rol === 'USUARIO') {
    const params = await searchParams;
    if (params.msg === 'gestion_solo_autorizados') {
      redirect('/mi-cuenta?msg=gestion_solo_autorizados');
    }
    redirect('/mi-cuenta');
  }

  // Solo ADMIN y ALCALDE llegan aquí
  const misPueblos = await getMisPueblosServer();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Cuenta</h1>

      <section className="mt-6 space-y-4">
        <div>
          <span className="text-sm text-gray-600">Email</span>
          <div className="font-medium">{me.email}</div>
        </div>
        <div>
          <span className="text-sm text-gray-600">Rol</span>
          <div className="font-medium">{me.rol}</div>
        </div>
        {me.rol === 'ALCALDE' && misPueblos.length > 0 && (
          <div>
            <span className="text-sm text-gray-600">
              {misPueblos.length === 1 ? 'Pueblo que representas' : 'Pueblos que representas'}
            </span>
            <div className="font-medium">
              {misPueblos.map((p) => p.nombre).join(', ')}
            </div>
          </div>
        )}
      </section>

      <div className="mt-8">
        <ProfileForm initialNombre={me.nombre ?? ''} />
      </div>

      <section className="mt-10 space-y-3">
        {/* Solo ADMIN y ALCALDE llegan aquí, USUARIO ya fue redirigido */}
        {me.rol === 'ADMIN' || me.rol === 'ALCALDE' ? (
          <div className="rounded-md border p-4">
            {me.rol === 'ADMIN' ? (
              <>
                <div className="font-medium">Gestión global y de pueblos</div>
                <p className="mt-1 text-sm text-gray-600">
                  Tienes acceso completo a todos los pueblos y a la asociación.
                </p>
                <div className="mt-4 flex flex-wrap gap-4">
                  <Link
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
                    href="/gestion"
                  >
                    Ir a Gestión de pueblos y asociación →
                  </Link>
                  <Link className="text-sm hover:underline" href="/gestion/mis-pueblos">
                    Ver listado de pueblos →
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="font-medium">
                  {misPueblos.length === 1 ? `Gestión de ${misPueblos[0].nombre}` : 'Mis pueblos'}
                </div>
                {misPueblos.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-600">
                    No hay pueblos asociados a este usuario.
                  </p>
                ) : misPueblos.length === 1 ? (
                  <div className="mt-3">
                    <Link
                      className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                      href={`/gestion/pueblos/${misPueblos[0].slug}`}
                    >
                      Gestión de {misPueblos[0].nombre} →
                    </Link>
                  </div>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {misPueblos.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2">
                        <span className="text-sm">{p.nombre}</span>
                        <Link className="text-sm font-medium text-blue-700 hover:underline" href={`/gestion/pueblos/${p.slug}`}>
                          Gestión de {p.nombre} →
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        ) : null}
      </section>

      <LogoutButton />
    </main>
  );
}
