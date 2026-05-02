import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PuntosRecursosClient from './PuntosRecursosClient';

export default async function PuntosRecursosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/gestion/asociacion');

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Puntos por recurso (Club de Amigos)
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Por defecto, cada elemento usa el valor de su regla genérica de
          gamificación. Aquí puedes ajustar puntos individualmente para{' '}
          <strong>RRTT/negocios</strong>, <strong>POIs</strong>,{' '}
          <strong>multiexperiencias</strong> (bonus completa),{' '}
          <strong>paradas custom</strong> y <strong>eventos Club</strong>.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Si dejas el valor en blanco, el recurso vuelve a usar el valor
          genérico de la regla. Las reglas genéricas se gestionan en{' '}
          <Link
            href="/gestion/asociacion/gamificacion"
            className="font-medium text-foreground underline"
          >
            Gamificación
          </Link>
          .
        </p>
        <Link
          href="/gestion/asociacion/datos"
          className="mt-3 inline-block text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← Volver a Datos
        </Link>
      </div>

      <PuntosRecursosClient />
    </main>
  );
}
