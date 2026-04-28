import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import { GestionAsociacionSubpageShell } from '../../_components/GestionAsociacionSubpageShell';
import EmailsEnvioClient from './EmailsEnvioClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const BACK_HREF = '/gestion/asociacion/notas-prensa-newsletter';
const BACK_LABEL = 'Volver a comunicaciones';

export default async function EmailsEnvioPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Direcciones de envío"
      subtitle="Configura el remitente From: de cada canal"
      maxWidthClass="max-w-4xl"
      backHref={BACK_HREF}
      backLabel={BACK_LABEL}
    >
      <EmailsEnvioClient />
    </GestionAsociacionSubpageShell>
  );
}
