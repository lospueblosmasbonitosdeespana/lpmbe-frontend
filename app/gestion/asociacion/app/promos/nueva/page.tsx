import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import AppPromoForm from '../AppPromoForm.client';

export const dynamic = 'force-dynamic';

export default async function NuevaAppPromoPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main>
      <div className="mx-auto max-w-2xl px-6 pt-6 pb-2">
        <Link className="text-sm text-muted-foreground hover:underline" href="/gestion/asociacion/app/promos">
          ← Volver a Pop-ups
        </Link>
      </div>
      <AppPromoForm />
    </main>
  );
}
