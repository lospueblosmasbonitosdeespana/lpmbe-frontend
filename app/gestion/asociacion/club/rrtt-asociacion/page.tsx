import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import RecursosRrttAsociacionClient from './RecursosRrttAsociacionClient';
import { GestionAsociacionSubpageShell } from '../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconCastle } from '../../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const BACK = '/gestion/asociacion/club';
const BACK_LABEL = 'Volver al Club';

export default async function RecursosRrttAsociacionPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="RRTT de la Asociación"
      subtitle="Recursos turísticos tradicionales nacionales (museos, iglesias, castillos…) gestionados por la asociación"
      heroIcon={<AsociacionHeroIconCastle />}
      maxWidthClass="max-w-5xl"
      backHref={BACK}
      backLabel={BACK_LABEL}
    >
      <RecursosRrttAsociacionClient />
    </GestionAsociacionSubpageShell>
  );
}
