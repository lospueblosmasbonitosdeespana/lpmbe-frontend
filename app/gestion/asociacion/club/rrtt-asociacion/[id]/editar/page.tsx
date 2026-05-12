import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import EditarRrttClient from './EditarRrttClient';
import { GestionAsociacionSubpageShell } from '../../../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconCastle } from '../../../../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const BACK = '/gestion/asociacion/club/rrtt-asociacion';
const BACK_LABEL = 'Volver al listado';

export default async function EditarRrttPage({
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
      title="Editar RRTT de la Asociación"
      subtitle="Datos del recurso, contacto, ubicación, fotos y precio"
      heroIcon={<AsociacionHeroIconCastle />}
      maxWidthClass="max-w-4xl"
      backHref={BACK}
      backLabel={BACK_LABEL}
    >
      <EditarRrttClient recursoId={recursoId} />
    </GestionAsociacionSubpageShell>
  );
}
