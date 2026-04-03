import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import NewslettersGestionClient from './NewslettersGestion.client';
import { GestionAsociacionSubpageShell } from '../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconMail } from '../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';

const ASOCIACION_BACK = '/gestion/asociacion';
const ASOCIACION_BACK_LABEL = 'Volver a gestión de la asociación';

export default async function NewslettersGestionPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Newsletters"
      subtitle="Ediciones (PDF, Canva) en R2 y enlace a suscriptores"
      heroIcon={<AsociacionHeroIconMail />}
      maxWidthClass="max-w-6xl"
      backHref={ASOCIACION_BACK}
      backLabel={ASOCIACION_BACK_LABEL}
    >
      <NewslettersGestionClient embeddedInShell />
    </GestionAsociacionSubpageShell>
  );
}
