import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { GestionAsociacionSubpageShell } from '../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconMegaphone } from '../../_components/asociacion-hero-icons';
import AyuntamientosComposerClient from './AyuntamientosComposerClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const BACK = '/gestion/asociacion/notas-prensa-newsletter';
const BACK_LABEL = 'Volver a Notas de prensa y Newsletter';

export default async function Page() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Ayuntamientos"
      subtitle="Comunicaciones internas a alcaldes y personal de ayuntamientos"
      heroIcon={<AsociacionHeroIconMegaphone />}
      maxWidthClass="max-w-6xl"
      backHref={BACK}
      backLabel={BACK_LABEL}
    >
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-amber-900">
              Envío interno con el dominio <code>ayuntamientos@lospueblosmasbonitosdeespana.org</code>
            </h2>
            <p className="mt-1 text-xs text-amber-800">
              Los destinatarios son la unión de <strong>alcaldes usuarios</strong> de la web (activos) y los{' '}
              <strong>contactos institucionales</strong> (alcaldes, concejales, técnicos de turismo…) importados desde vCard.
              Los contactos pueden darse de baja sin perder su acceso como alcaldes.
            </p>
          </div>
          <Link
            href="/gestion/asociacion/notas-prensa-newsletter/ayuntamientos/contactos"
            className="shrink-0 rounded-lg border border-amber-400 bg-white px-3 py-2 text-xs font-medium text-amber-900 hover:bg-amber-100"
          >
            Gestionar contactos institucionales →
          </Link>
        </div>
      </div>
      <AyuntamientosComposerClient />
    </GestionAsociacionSubpageShell>
  );
}
