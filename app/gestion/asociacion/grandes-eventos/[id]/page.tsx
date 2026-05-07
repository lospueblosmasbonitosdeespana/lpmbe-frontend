import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import { GestionAsociacionSubpageShell } from '../../_components/GestionAsociacionSubpageShell';
import GranEventoEditor from './GranEventoEditor';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/mi-cuenta');

  const { id } = await params;
  const idNum = parseInt(id, 10);
  if (isNaN(idNum)) redirect('/gestion/asociacion/grandes-eventos');

  return (
    <GestionAsociacionSubpageShell
      title="Editor de gran evento"
      subtitle="Toda la información del evento se gestiona aquí. Lo que cambies se traduce automáticamente a 7 idiomas y se publica en la web pública."
      backHref="/gestion/asociacion/grandes-eventos"
      backLabel="Volver al listado de grandes eventos"
      maxWidthClass="max-w-6xl"
    >
      <GranEventoEditor eventoId={idNum} />
    </GestionAsociacionSubpageShell>
  );
}
