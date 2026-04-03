import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import NegociosIndexClient from './NegociosIndexClient';
import { GestionAsociacionSubpageShell } from '../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconStore } from '../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export default async function NegociosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Negocios"
      subtitle="Hoteles, restaurantes, casas rurales y comercios de los pueblos del club · Asociación LPMBE"
      heroIcon={<AsociacionHeroIconStore />}
      maxWidthClass="max-w-5xl"
    >
      <NegociosIndexClient />
    </GestionAsociacionSubpageShell>
  );
}
