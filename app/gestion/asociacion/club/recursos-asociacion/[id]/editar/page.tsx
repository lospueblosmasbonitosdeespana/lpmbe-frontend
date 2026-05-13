import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import EditarNaturalClient from './EditarNaturalClient';
import { GestionAsociacionSubpageShell } from '../../../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconCastle } from '../../../../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const BACK = '/gestion/asociacion/club/recursos-asociacion';
const BACK_LABEL = 'Volver al listado';

export default async function EditarNaturalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  const { id } = await params;
  const recursoId = Number(id);

  return (
    <GestionAsociacionSubpageShell
      title="Editar recurso natural (asociación)"
      subtitle="Datos del recurso, ubicación, foto y descripción"
      heroIcon={<AsociacionHeroIconCastle />}
      maxWidthClass="max-w-4xl"
      backHref={BACK}
      backLabel={BACK_LABEL}
    >
      <EditarNaturalClient recursoId={recursoId} />
    </GestionAsociacionSubpageShell>
  );
}
