import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NoticiasGlobalesPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  // REDIRECT A CMS NUEVO
  redirect('/gestion/asociacion/contenidos?tipo=NOTICIA');
}
