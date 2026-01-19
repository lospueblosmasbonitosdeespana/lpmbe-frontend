import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { redirect } from 'next/navigation';
import { getPuebloBySlug } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function EventosPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN') redirect('/cuenta');

  // Verificar acceso
  if (me.rol === 'ALCALDE') {
    const mis = await getMisPueblosServer();
    const allowed = mis.some((p) => p.slug === slug);
    if (!allowed) redirect('/gestion/mis-pueblos');
  }

  // Obtener puebloId para redirect
  let puebloId: number | null = null;
  try {
    const pueblo = await getPuebloBySlug(slug);
    puebloId = pueblo.id;
  } catch (e) {
    // Si falla, redirect sin puebloId (la página lo resolverá)
  }

  // REDIRECT A CMS NUEVO
  redirect(`/gestion/pueblo/contenidos?tipo=EVENTO${puebloId ? `&puebloId=${puebloId}` : ''}`);
}
