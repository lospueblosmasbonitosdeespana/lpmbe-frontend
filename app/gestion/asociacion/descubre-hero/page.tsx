import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import DescubreHeroClient from './DescubreHeroClient';

export const dynamic = 'force-dynamic';

export default async function DescubreHeroPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/mi-cuenta');

  return <DescubreHeroClient />;
}
