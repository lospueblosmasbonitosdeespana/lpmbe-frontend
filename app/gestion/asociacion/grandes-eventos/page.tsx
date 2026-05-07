import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import { CalendarHeart } from 'lucide-react';
import { GestionAsociacionSubpageShell } from '../_components/GestionAsociacionSubpageShell';
import GrandesEventosListado from './GrandesEventosListado';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/mi-cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Grandes eventos"
      subtitle={
        <>
          Asambleas, encuentros internacionales y otros eventos con acreditaciones.
          <br />
          Programa, pueblos del recorrido, avisos urgentes y galería de fotos en vivo, todo gestionable desde aquí.
        </>
      }
      heroIcon={<CalendarHeart className="h-6 w-6 text-white" />}
      maxWidthClass="max-w-6xl"
    >
      <GrandesEventosListado />
    </GestionAsociacionSubpageShell>
  );
}
