import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import ClubAdminClient from './ClubAdminClient';
import { GestionAsociacionSubpageShell } from '../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconUsers } from '../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const HERO_LINK =
  'inline-flex items-center justify-center rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm transition-all hover:bg-white/25 hover:ring-white/40 active:scale-[0.98]';

export default async function GestionAsociacionClubPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Club de amigos"
      subtitle="Socios, inscripciones, precios y estadísticas · Asociación LPMBE"
      heroIcon={<AsociacionHeroIconUsers />}
      maxWidthClass="max-w-5xl"
      heroAction={
        <div className="flex max-w-md flex-col gap-2 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-end">
          <Link href="/gestion/asociacion/club/recursos-pueblos" className={HERO_LINK}>
            Recursos pueblos
          </Link>
          <Link href="/gestion/asociacion/club/recursos-asociacion" className={HERO_LINK}>
            Recursos asociación
          </Link>
          <Link href="/gestion/asociacion/club/metricas" className={HERO_LINK}>
            Métricas validaciones
          </Link>
          <Link href="/gestion/asociacion/club/sorteos" className={HERO_LINK}>
            Sorteos
          </Link>
          <Link href="/gestion/asociacion/club/comunicaciones" className={HERO_LINK}>
            Comunicaciones
          </Link>
          <Link href="/gestion/asociacion/club/catalogo" className={HERO_LINK}>
            Estado catálogo RRTT
          </Link>
        </div>
      }
    >
      <ClubAdminClient />
    </GestionAsociacionSubpageShell>
  );
}
