// app/cuenta/page.tsx
import { getMeServer } from '@/lib/me';
import LogoutButton from './LogoutButton';

export default async function CuentaPage() {
  const me = await getMeServer();

  if (!me) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-semibold">Cuenta</h1>
        <p className="mt-4">No autenticado.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Cuenta</h1>

      <section className="mt-6 space-y-2">
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

      <section className="mt-8 space-y-2">
        {me.rol === 'ALCALDE' ? (
          <div className="rounded-md border p-4">
            <div className="font-medium">Mis pueblos</div>
            <div className="text-sm text-gray-600">
              Placeholder: enlace a gestión (pendiente).
            </div>
          </div>
        ) : null}

        {me.rol === 'ADMIN' ? (
          <div className="rounded-md border p-4">
            <div className="font-medium">Admin</div>
            <div className="text-sm text-gray-600">
              Placeholder: enlace a panel admin (pendiente).
            </div>
          </div>
        ) : null}
      </section>

      <LogoutButton />
    </main>
  );
}
