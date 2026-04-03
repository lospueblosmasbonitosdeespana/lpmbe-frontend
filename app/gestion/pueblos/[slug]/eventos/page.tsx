import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { redirect } from 'next/navigation';
import { getPuebloBySlug } from '@/lib/api';
import EventosListAdminClient from './EventosListAdmin.client';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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

  // ADMIN: listado de eventos (tabla Evento) con opción "Ocultar en Planifica"
  if (me.rol === 'ADMIN') {
    let puebloId: number | null = null;
    let puebloNombre = slug;
    try {
      const pueblo = await getPuebloBySlug(slug);
      puebloId = pueblo.id;
      puebloNombre = (pueblo as { nombre?: string }).nombre ?? slug;
    } catch {
      // mantener slug como nombre
    }
    const contenidosUrl = `/gestion/pueblo/contenidos?tipo=EVENTO${puebloId ? `&puebloId=${puebloId}&puebloNombre=${encodeURIComponent(puebloNombre)}` : ''}`;
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Eventos del pueblo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestión de eventos (tabla Evento). Para contenidos tipo evento del CMS, ve a{' '}
          <Link href={contenidosUrl} className="text-blue-600 underline">
            Contenidos
          </Link>.
        </p>
        <div className="mt-4">
          <Link
            href={`/gestion/pueblos/${slug}/eventos/nuevo`}
            className="inline-block rounded-md border bg-muted px-3 py-2 text-sm font-medium hover:bg-gray-200"
          >
            Nuevo evento
          </Link>
        </div>
        <div className="mt-6">
          <EventosListAdminClient slug={slug} />
        </div>
      </main>
    );
  }

  // ALCALDE: redirect al CMS de contenidos
  let puebloId: number | null = null;
  try {
    const pueblo = await getPuebloBySlug(slug);
    puebloId = pueblo.id;
  } catch (e) {
    // Si falla, redirect sin puebloId (la página lo resolverá)
  }
  redirect(`/gestion/pueblo/contenidos?tipo=EVENTO${puebloId ? `&puebloId=${puebloId}` : ''}`);
}
