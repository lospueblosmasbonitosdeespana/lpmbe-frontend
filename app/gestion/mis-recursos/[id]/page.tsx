import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import EditarRecursoClient from './EditarRecursoClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 0;

const ALLOWED_ROLES = ['COLABORADOR', 'ALCALDE', 'ADMIN'];

export default async function EditarRecursoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getMeServer();

  if (!me) redirect('/entrar');
  if (!ALLOWED_ROLES.includes(me.rol)) redirect('/mi-cuenta');

  const recursoId = parseInt(id, 10);
  if (isNaN(recursoId) || recursoId < 1) {
    redirect('/gestion/mis-recursos');
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Link
          className="text-sm text-muted-foreground hover:text-gray-700 hover:underline"
          href="/gestion/mis-recursos"
        >
          ← Volver a mis recursos
        </Link>
      </div>

      <EditarRecursoClient recursoId={recursoId} />
    </main>
  );
}
