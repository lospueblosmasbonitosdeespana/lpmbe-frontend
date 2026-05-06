import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import RrssAdminClient from './RrssAdminClient';

export const dynamic = 'force-dynamic';

export default async function RrssAdminPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/mi-cuenta');

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          RRSS · Solicitudes de negocios
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Cola de trabajo del community manager. Stories, menciones editoriales
          y publicaciones contratadas por los negocios. Aprueba, prepara
          borrador y publica.
        </p>
      </header>
      <RrssAdminClient />
    </main>
  );
}
