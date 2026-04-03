import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import SeasonalEventForm from './SeasonalEventForm.client';
import { GestionAsociacionSubpageShell } from '../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconSmartphone } from '../../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const APP_BACK = '/gestion/asociacion/app';
const APP_BACK_LABEL = 'Volver a App';

export default async function AppEventoActivoPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Evento estacional en botón de app"
      subtitle="Qué evento aparece en el acceso rápido de la Home de la app móvil"
      heroIcon={<AsociacionHeroIconSmartphone />}
      maxWidthClass="max-w-3xl"
      backHref={APP_BACK}
      backLabel={APP_BACK_LABEL}
    >
      <SeasonalEventForm />
    </GestionAsociacionSubpageShell>
  );
}
