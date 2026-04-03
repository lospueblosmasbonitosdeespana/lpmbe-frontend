import { getMeServer } from '@/lib/me';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import NegociosPuebloClient from './NegociosPuebloClient';
import { GestionAsociacionSubpageShell } from '../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconStore } from '../../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const NEGOCIOS_BACK = '/gestion/asociacion/negocios';
const NEGOCIOS_BACK_LABEL = 'Volver a Negocios';

export default async function NegociosPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  const { slug } = await params;

  let title = 'Negocios';
  let subtitle = 'Gestiona comercios del club · Asociación LPMBE';

  if (slug === 'asociacion-general') {
    title = 'Negocios · Asociación';
    subtitle = 'Negocios no vinculados a un pueblo concreto';
  } else {
    try {
      const p = await getPuebloBySlug(slug);
      title = `Negocios · ${p.nombre}`;
      subtitle = `Comercios del pueblo · ${slug}`;
    } catch {
      title = 'Negocios del pueblo';
      subtitle = slug;
    }
  }

  return (
    <GestionAsociacionSubpageShell
      title={title}
      subtitle={subtitle}
      heroIcon={<AsociacionHeroIconStore />}
      maxWidthClass="max-w-5xl"
      backHref={NEGOCIOS_BACK}
      backLabel={NEGOCIOS_BACK_LABEL}
    >
      <NegociosPuebloClient puebloSlug={slug} embeddedInShell />
    </GestionAsociacionSubpageShell>
  );
}
