// app/cuenta/page.tsx
import { redirect } from 'next/navigation';
import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import LogoutButton from './LogoutButton';
import ProfileForm from './ProfileForm';
import Link from 'next/link';

export default async function CuentaPage() {
  const me = await getMeServer();

  if (!me) {
    redirect('/entrar');
  }

  const misPueblos =
    me.rol === 'ALCALDE' || me.rol === 'ADMIN'
      ? await getMisPueblosServer()
      : [];

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
        {me.rol === 'USUARIO' ? (
          <div className="rounded-md border p-4">
            <div className="font-medium">Tu cuenta</div>
            <div className="text-sm text-gray-600">
              Área de usuario básica (seguiremos ampliando).
            </div>
          </div>
        ) : null}

        {(me.rol === 'ALCALDE' || me.rol === 'ADMIN') ? (
          <div className="rounded-md border p-4">
            <div className="font-medium">
              {me.rol === 'ALCALDE' && misPueblos.length === 1
                ? misPueblos[0].nombre
                : me.rol === 'ADMIN'
                  ? 'Gestión de pueblos'
                  : 'Mis pueblos'}
            </div>

            {misPueblos.length === 0 ? (
              <div className="mt-2 text-sm text-gray-600">
                No hay pueblos asociados a este usuario.
              </div>
            ) : me.rol === 'ALCALDE' && misPueblos.length === 1 ? (
              <div className="mt-2 text-sm text-gray-600">
                <Link className="hover:underline" href={`/pueblos/${misPueblos[0].slug}`}>
                  Ver ficha del pueblo →
                </Link>
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {misPueblos.map((p) => (
                  <li key={p.id}>
                    <Link className="text-sm hover:underline" href={`/pueblos/${p.slug}`}>
                      {p.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 text-sm">
              <Link className="hover:underline" href="/gestion">
                Ir a Gestión →
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      <LogoutButton />
    </main>
  );
}
