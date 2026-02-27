import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import UsuarioDetalle from './UsuarioDetalle';

export default async function UsuarioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/mi-cuenta');

  const { id } = await params;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <Link
          href="/gestion/asociacion/datos?tab=usuarios"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← Volver a Usuarios
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Detalle de usuario</h1>
      </div>
      <UsuarioDetalle userId={id} />
    </main>
  );
}
