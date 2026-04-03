import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import PrensaMediosForm from './PrensaMediosForm.client';
import { GestionAsociacionSubpageShell } from '../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconNewspaper } from '../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const ASOCIACION_BACK = '/gestion/asociacion';
const ASOCIACION_BACK_LABEL = 'Volver a gestión de la asociación';

export default async function PrensaMediosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Prensa y Medios"
      subtitle="Comunicados visibles en /prensa, medios externos y kit de prensa"
      heroIcon={<AsociacionHeroIconNewspaper />}
      maxWidthClass="max-w-6xl"
      backHref={ASOCIACION_BACK}
      backLabel={ASOCIACION_BACK_LABEL}
    >
      <PrensaMediosForm />
    </GestionAsociacionSubpageShell>
  );
}
