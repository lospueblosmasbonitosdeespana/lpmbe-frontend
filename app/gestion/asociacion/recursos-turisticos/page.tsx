import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import RecursosAsociacionClient from './RecursosAsociacionClient';
import { GestionAsociacionSubpageShell } from '../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconCastle } from '../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 0;

export default async function RecursosTuristicosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Recursos turísticos"
      subtitle="Castillos, monasterios, museos y recursos no vinculados a un pueblo concreto · Asociación LPMBE"
      heroIcon={<AsociacionHeroIconCastle />}
      maxWidthClass="max-w-5xl"
    >
      <RecursosAsociacionClient />
    </GestionAsociacionSubpageShell>
  );
}
