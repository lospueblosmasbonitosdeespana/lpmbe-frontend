import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import NotasPrensaNewsletterClient from '../NotasPrensaNewsletterClient';
import { GestionAsociacionSubpageShell } from '../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconMegaphone } from '../../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const NP_BACK = '/gestion/asociacion/notas-prensa-newsletter';
const NP_BACK_LABEL = 'Volver a Notas de prensa y Newsletter';

export default async function NotasNewsletterPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Newsletter"
      subtitle="Suscriptores, campañas y métricas de envío"
      heroIcon={<AsociacionHeroIconMegaphone />}
      maxWidthClass="max-w-6xl"
      backHref={NP_BACK}
      backLabel={NP_BACK_LABEL}
    >
      <NotasPrensaNewsletterClient mode="newsletter" embeddedInShell />
    </GestionAsociacionSubpageShell>
  );
}
