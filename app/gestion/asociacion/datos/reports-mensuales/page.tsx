import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import { GestionAsociacionSubpageShell } from '../../_components/GestionAsociacionSubpageShell';
import ReportsMensualesAdminDashboard from './ReportsMensualesAdminDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ReportsMensualesPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/mi-cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Reports mensuales"
      subtitle={
        <>Envío automático el día 1 de cada mes a alcaldes y equipos · Histórico y reenvío manual</>
      }
      backHref="/gestion/asociacion/datos"
      backLabel="Volver a Datos"
      maxWidthClass="max-w-7xl"
      heroIcon={
        <svg
          className="h-6 w-6 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 8l9 6 9-6M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
          />
        </svg>
      }
    >
      <ReportsMensualesAdminDashboard />
    </GestionAsociacionSubpageShell>
  );
}
