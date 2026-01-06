import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SemaforoForm from './SemaforoForm.client';

export const dynamic = 'force-dynamic';
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

  // Si es ALCALDE, verificamos que el pueblo está en su lista.
  if (me.rol === 'ALCALDE') {
    const mis = await getMisPueblosServer();
    const allowed = mis.some((p) => p.slug === slug);
    if (!allowed) redirect('/gestion/mis-pueblos');
  }

  // Cargar pueblo real
  const pueblo = await getPuebloBySlug(slug);

  // Leer datos del semáforo desde pueblo.semaforo
  const s = (pueblo as any)?.semaforo ?? null;

  const estadoActual = s?.estado ?? "VERDE";
  const mensajeActual = s?.mensaje ?? "";
  const mensajePublicoActual = s?.mensaje_publico ?? "";
  const motivoActual = s?.motivo ?? "";
  const inicioProgramadoActual = s?.programado_inicio ?? null;
  const finProgramadoActual = s?.programado_fin ?? null;
  const caducaEn = s?.caduca_en ?? null;
  const ultimaActualizacion = s?.ultima_actualizacion ?? s?.ultimaActualizacion ?? null;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Gestión del semáforo</h1>
      <p className="mt-2 text-sm text-gray-600">
        Pueblo: <strong>{pueblo.nombre}</strong>
      </p>

      {/* Estado actual (guardado) */}
      <div className="mt-6 rounded-md border p-4 text-sm">
        <div className="font-medium text-gray-800">Actual (guardado)</div>
        <div className="mt-2 text-gray-600">
          <p>Estado: <strong>{estadoActual}</strong></p>
          {ultimaActualizacion && (
            <p className="mt-1">Actualizado: {new Date(ultimaActualizacion).toLocaleString("es-ES")}</p>
          )}
          {mensajePublicoActual && (
            <p className="mt-1">Mensaje público: {mensajePublicoActual}</p>
          )}
          {motivoActual && (
            <p className="mt-1">Motivo: {motivoActual}</p>
          )}
          {mensajeActual && (
            <p className="mt-1">Mensaje interno: {mensajeActual}</p>
          )}
          {caducaEn && estadoActual !== "VERDE" && !inicioProgramadoActual && !finProgramadoActual && (
            <p className="mt-1">Caduca automático: {new Date(caducaEn).toLocaleString("es-ES")}</p>
          )}
          {inicioProgramadoActual && finProgramadoActual && (
            <p className="mt-1">
              Programado: {new Date(inicioProgramadoActual).toLocaleString("es-ES")} → {new Date(finProgramadoActual).toLocaleString("es-ES")}
            </p>
          )}
        </div>
      </div>

      {/* Formulario */}
      <div className="mt-6">
        <SemaforoForm
          puebloId={pueblo.id}
          slug={slug}
          estadoActual={estadoActual}
          mensajeActual={mensajeActual}
          mensajePublicoActual={mensajePublicoActual}
          motivoActual={motivoActual}
          inicioProgramadoActual={inicioProgramadoActual}
          finProgramadoActual={finProgramadoActual}
          key={`${pueblo.id}-${ultimaActualizacion ?? "na"}`}
        />
      </div>

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href={`/gestion/pueblos/${slug}`}>
          ← Volver a gestión del pueblo
        </Link>
      </div>
    </main>
  );
}








