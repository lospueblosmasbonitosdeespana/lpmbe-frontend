import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import RutaForm from '../RutaForm.client';
import { GestionAsociacionSubpageShell } from '../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconMap } from '../../_components/asociacion-hero-icons';

const RUTAS_BACK = '/gestion/asociacion/rutas';
const RUTAS_BACK_LABEL = 'Volver a Rutas';

export default async function NuevaRutaPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Nueva ruta"
      subtitle="Multiexperiencia o ruta turística · Asociación LPMBE"
      heroIcon={<AsociacionHeroIconMap />}
      maxWidthClass="max-w-6xl"
      backHref={RUTAS_BACK}
      backLabel={RUTAS_BACK_LABEL}
    >
      <RutaForm />
    </GestionAsociacionSubpageShell>
  );
}
