import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import { GestionAsociacionSubpageShell } from '../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconStore } from '../../_components/asociacion-hero-icons';

const TIENDA_BACK = '/gestion/asociacion/tienda';
const TIENDA_BACK_LABEL = 'Volver a Tienda';

export default async function DestacadosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Banners destacados"
      subtitle="Gestión de banners destacados en la tienda"
      heroIcon={<AsociacionHeroIconStore />}
      maxWidthClass="max-w-4xl"
      backHref={TIENDA_BACK}
      backLabel={TIENDA_BACK_LABEL}
    >
      <p className="text-sm text-muted-foreground">
        Contenido de esta sección en preparación.
      </p>
    </GestionAsociacionSubpageShell>
  );
}
