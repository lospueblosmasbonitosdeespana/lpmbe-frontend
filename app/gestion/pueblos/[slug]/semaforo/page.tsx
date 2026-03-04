import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SemaforoForm from './SemaforoForm.client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ESTADO_LABEL: Record<string, { label: string; color: string; dot: string }> = {
  VERDE:    { label: 'Verde',    color: 'bg-green-50 border-green-200 text-green-800',   dot: 'bg-green-500' },
  AMARILLO: { label: 'Amarillo', color: 'bg-yellow-50 border-yellow-200 text-yellow-800', dot: 'bg-yellow-400' },
  ROJO:     { label: 'Rojo',     color: 'bg-red-50 border-red-200 text-red-800',         dot: 'bg-red-500' },
};

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_LABEL[estado] ?? ESTADO_LABEL['VERDE'];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${cfg.color}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

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

  // Estado manual real (lo que hay en la BD, sin calcular efectivo)
  const estadoManual: string = s?.estado_manual ?? s?.estado ?? 'VERDE';
  // Estado efectivo (lo que ve el público ahora mismo)
  const estadoEfectivo: string = s?.estado ?? 'VERDE';
  // Evento programado futuro
  const programado: any = s?.programado ?? null;

  const mensajePublicoActual: string = s?.mensaje_publico ?? '';
  const mensajeActual: string = s?.mensaje ?? '';
  const motivoActual: string = s?.motivo ?? '';
  const caducaEn: string | null = s?.caduca_en ?? null;
  const ultimaActualizacion: string | null = s?.ultima_actualizacion ?? s?.ultimaActualizacion ?? null;

  // Para el formulario: las fechas de programación son las del evento futuro
  const inicioProgramadoActual: string | null = s?.programado_inicio ?? null;
  const finProgramadoActual: string | null = s?.programado_fin ?? null;

  // Determinar si hay override manual activo (estado manual != VERDE)
  const hayManualActivo = estadoManual !== 'VERDE';
  // El estado efectivo para el formulario de edición es el manual
  const estadoFormulario = estadoManual;

  // Si hay override manual y también hay programado futuro, el mensaje del formulario
  // es el del manual (mensaje_publico); el programado tiene el suyo propio
  const mensajePublicoFormulario = hayManualActivo
    ? mensajePublicoActual
    : (programado ? '' : mensajePublicoActual);
  const motivoFormulario = hayManualActivo ? motivoActual : (programado ? '' : motivoActual);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Gestión del semáforo</h1>
      <p className="mt-1 text-sm text-gray-600">
        Pueblo: <strong>{pueblo.nombre}</strong>
      </p>

      {/* ── ESTADO ACTUAL ── */}
      <section className="mt-6 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Estado actual
        </h2>

        {/* Semáforo en tiempo real (lo que ve el público ahora) */}
        <div className={`rounded-lg border p-4 ${ESTADO_LABEL[estadoEfectivo]?.color ?? 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Semáforo en tiempo real (público)</span>
            <EstadoBadge estado={estadoEfectivo} />
          </div>
          {mensajePublicoActual && (
            <p className="mt-2 text-sm">{mensajePublicoActual}</p>
          )}
          {ultimaActualizacion && (
            <p className="mt-2 text-xs opacity-70">
              Actualizado: {formatDate(ultimaActualizacion)}
            </p>
          )}
          {caducaEn && hayManualActivo && (
            <p className="mt-1 text-xs opacity-70">
              Expira automáticamente: {formatDate(caducaEn)}
            </p>
          )}
        </div>

        {/* Evento programado futuro (si existe) */}
        {programado && (
          <div className={`rounded-lg border p-4 ${ESTADO_LABEL[programado.estado]?.color ?? 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Evento programado (futuro)</span>
              <EstadoBadge estado={programado.estado} />
            </div>
            {programado.mensaje && (
              <p className="mt-2 text-sm">{programado.mensaje}</p>
            )}
            <p className="mt-2 text-xs opacity-70">
              {formatDate(programado.inicio)} → {formatDate(programado.fin)}
            </p>
          </div>
        )}

        {/* Sin actividad */}
        {estadoEfectivo === 'VERDE' && !programado && (
          <p className="text-sm text-gray-500 italic">
            Sin eventos activos ni programados.
          </p>
        )}
      </section>

      <hr className="my-6 border-gray-200" />

      {/* ── FORMULARIO ── */}
      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Editar
        </h2>
        <p className="mb-4 text-xs text-gray-500">
          El semáforo en tiempo real y el evento programado son independientes.
          Puedes tener un ROJO manual activo y un amarillo programado para el futuro al mismo tiempo.
        </p>
        <SemaforoForm
          puebloId={pueblo.id}
          slug={slug}
          estadoActual={estadoFormulario}
          mensajeActual={mensajeActual}
          mensajePublicoActual={mensajePublicoFormulario}
          motivoActual={motivoFormulario}
          inicioProgramadoActual={inicioProgramadoActual}
          finProgramadoActual={finProgramadoActual}
          key={`${pueblo.id}-${ultimaActualizacion ?? 'na'}`}
        />
      </section>

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href={`/gestion/pueblos/${slug}`}>
          ← Volver a gestión del pueblo
        </Link>
      </div>
    </main>
  );
}
