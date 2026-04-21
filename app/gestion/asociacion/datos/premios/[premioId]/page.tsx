import { getMeServer } from '@/lib/me';
import { redirect, notFound } from 'next/navigation';
import { GestionAsociacionSubpageShell } from '../../../_components/GestionAsociacionSubpageShell';
import PremioDetalleClient from './PremioDetalleClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PremioDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ premioId: string }>;
  searchParams: Promise<{ edicionId?: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/mi-cuenta');

  const { premioId: premioIdRaw } = await params;
  const premioId = Number.parseInt(premioIdRaw, 10);
  if (!Number.isInteger(premioId) || premioId < 1 || premioId > 12) notFound();

  const { edicionId } = await searchParams;
  const edicionIdNum = edicionId ? Number.parseInt(edicionId, 10) : null;

  return (
    <GestionAsociacionSubpageShell
      title={`Premio ${String(premioId).padStart(2, '0')}`}
      subtitle="Ranking completo por pueblo · descarga CSV disponible"
      backHref="/gestion/asociacion/datos/premios"
      backLabel="Volver a 10 Premios"
      maxWidthClass="max-w-6xl"
    >
      <PremioDetalleClient
        premioId={premioId}
        edicionIdInicial={edicionIdNum ?? undefined}
      />
    </GestionAsociacionSubpageShell>
  );
}
