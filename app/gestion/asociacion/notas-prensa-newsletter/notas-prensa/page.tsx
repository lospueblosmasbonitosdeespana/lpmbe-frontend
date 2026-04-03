import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import NotasPrensaNewsletterClient from '../NotasPrensaNewsletterClient';
import { GestionAsociacionSubpageShell } from '../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconMegaphone } from '../../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const NP_BACK = '/gestion/asociacion/notas-prensa-newsletter';
const NP_BACK_LABEL = 'Volver a Notas de prensa y Newsletter';

export default async function NotasPrensaPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Notas de prensa"
      subtitle="Contactos de medios y campañas segmentadas"
      heroIcon={<AsociacionHeroIconMegaphone />}
      maxWidthClass="max-w-6xl"
      backHref={NP_BACK}
      backLabel={NP_BACK_LABEL}
      heroAction={
        <Link
          href="/gestion/asociacion/notas-prensa-newsletter/notas-prensa/contactos"
          className="inline-flex rounded-lg border border-white/40 bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/25"
        >
          Contactos de prensa
        </Link>
      }
    >
      <NotasPrensaNewsletterClient mode="press" embeddedInShell />
    </GestionAsociacionSubpageShell>
  );
}
