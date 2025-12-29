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
        <div>
          <span className="text-sm text-gray-600">sub</span>
          <div className="font-medium">{me.sub}</div>
        </div>
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
            <div className="font-medium">Mis pueblos</div>

            {misPueblos.length === 0 ? (
              <div className="mt-2 text-sm text-gray-600">
                No hay pueblos asociados a este usuario.
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {misPueblos.map((p) => (
                  <li key={p.id}>
                    <Link className="text-sm hover:underline" href={`/pueblos/${p.slug}`}>
                      {p.nombre}
                    </Link>
                    <span className="ml-2 text-xs text-gray-500">#{p.id}</span>
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
