import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SemaforoGestion from './SemaforoGestion.client';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 0;

export default async function SemaforoPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN') redirect('/cuenta');

  if (me.rol === 'ALCALDE') {
    const mis = await getMisPueblosServer();
    const allowed = mis.some((p) => p.slug === slug);
    if (!allowed) redirect('/gestion/mis-pueblos');
  }

  const pueblo = await getPuebloBySlug(slug);
  const s = (pueblo as any)?.semaforo ?? null;

  const estadoManual: string = s?.estado_manual ?? s?.estado ?? 'VERDE';
  const estadoEfectivo: string = s?.estado ?? 'VERDE';
  const mensajePublicoManual: string = s?.mensaje_publico ?? '';
  const mensajeInternoManual: string = s?.mensaje ?? '';
  const caducaEn: string | null = s?.caduca_en ?? null;
  const ultimaActualizacion: string | null = s?.ultima_actualizacion ?? s?.ultimaActualizacion ?? null;

  // Array de eventos programados futuros
  const eventosProgramados: any[] = s?.programado_eventos_list ?? (s?.programado ? [s.programado] : []);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Gestión del semáforo</h1>
      <p className="mt-1 text-sm text-gray-600">
        Pueblo: <strong>{pueblo.nombre}</strong>
      </p>

      <SemaforoGestion
        puebloId={pueblo.id}
        slug={slug}
        estadoManual={estadoManual}
        estadoEfectivo={estadoEfectivo}
        mensajePublicoManual={mensajePublicoManual}
        mensajeInternoManual={mensajeInternoManual}
        caducaEn={caducaEn}
        ultimaActualizacion={ultimaActualizacion}
        eventosProgramados={eventosProgramados}
        key={`${pueblo.id}-${ultimaActualizacion ?? 'na'}`}
      />

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href={`/gestion/pueblos/${slug}`}>
          ← Volver a gestión del pueblo
        </Link>
      </div>
    </main>
  );
}
