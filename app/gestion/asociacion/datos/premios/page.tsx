import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import { GestionAsociacionSubpageShell } from '../../_components/GestionAsociacionSubpageShell';
import PremiosAdminDashboard from './PremiosAdminDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PremiosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/mi-cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="10 Premios"
      subtitle={
        <>
          Reconocimientos anuales a los pueblos de la red · Ranking completo de 126
          posiciones por categoría
        </>
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
            d="M8 21h8M12 17v4M6 3h12v4a6 6 0 01-12 0V3zm0 0H3v2a3 3 0 003 3m12-5h3v2a3 3 0 01-3 3"
          />
        </svg>
      }
    >
      <PremiosAdminDashboard />
    </GestionAsociacionSubpageShell>
  );
}
