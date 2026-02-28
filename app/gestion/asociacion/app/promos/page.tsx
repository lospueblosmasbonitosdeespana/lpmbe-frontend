import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import AppPromosList from './AppPromosList.client';

export const dynamic = 'force-dynamic';

export default async function AppPromosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main>
      <div className="mx-auto max-w-4xl px-6 pb-4">
        <Link className="text-sm text-muted-foreground hover:underline" href="/gestion/asociacion/app">
          ← Volver a App
        </Link>
      </div>
      <AppPromosList />
    </main>
  );
}
