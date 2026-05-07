import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
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
      heroIcon={
        <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path d="M9 22V12h6v10" />
        </svg>
      }
      maxWidthClass="max-w-6xl"
    >
      <GrandesEventosListado />
    </GestionAsociacionSubpageShell>
  );
}
