import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SemaforoForm from './SemaforoForm.client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ESTADO_LABEL: Record<string, { label: string; color: string; dot: string }> = {
  VERDE:    { label: 'Verde',    color: 'bg-green-50 border-green-200 text-green-800',    dot: 'bg-green-500' },
  AMARILLO: { label: 'Amarillo', color: 'bg-yellow-50 border-yellow-200 text-yellow-800', dot: 'bg-yellow-400' },
  ROJO:     { label: 'Rojo',     color: 'bg-red-50 border-red-200 text-red-800',          dot: 'bg-red-500' },
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
  // Evento programado futuro (objeto con { estado, mensaje, inicio, fin })
  const programado: any = s?.programado ?? null;

  // Datos del estado manual
  const mensajePublicoManual: string = s?.mensaje_publico ?? '';
  const mensajeInternoManual: string = s?.mensaje ?? '';
  const caducaEn: string | null = s?.caduca_en ?? null;
  const ultimaActualizacion: string | null = s?.ultima_actualizacion ?? s?.ultimaActualizacion ?? null;

  // Datos del evento programado (para pre-rellenar la pestaña de programación)
  const inicioProgramadoActual: string | null = s?.programado_inicio ?? null;
  const finProgramadoActual: string | null = s?.programado_fin ?? null;
  // El motivo y mensaje del programado vienen en programado.motivo / programado.mensaje
  const mensajePublicoProgramado: string = programado?.mensaje ?? '';
  const motivoProgramado: string = programado?.motivo ?? '';

  // Para el formulario manual: siempre pre-rellenar con los datos manuales reales
  const hayManualActivo = estadoManual !== 'VERDE';
  const mensajePublicoFormularioManual = mensajePublicoManual; // siempre (incluso verde para editar)
  const mensajeInternoFormulario = mensajeInternoManual;

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

        {/* Semáforo en tiempo real */}
        <div className={`rounded-lg border p-4 ${ESTADO_LABEL[estadoEfectivo]?.color ?? 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Semáforo en tiempo real (público)</span>
            <EstadoBadge estado={estadoEfectivo} />
          </div>
          {mensajePublicoManual && hayManualActivo && (
            <p className="mt-2 text-sm">{mensajePublicoManual}</p>
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
          {!hayManualActivo && !programado && (
            <p className="mt-2 text-xs opacity-60 italic">Sin incidencias activas.</p>
          )}
        </div>

        {/* Evento programado futuro */}
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

        {!hayManualActivo && !programado && (
          <p className="text-sm text-gray-400 italic">Sin eventos activos ni programados.</p>
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
          // Manual
          estadoManualActual={estadoManual}
          mensajePublicoManualActual={mensajePublicoFormularioManual}
          mensajeInternoActual={mensajeInternoFormulario}
          hayManualActivo={hayManualActivo}
          // Programado
          estadoProgramadoActual={programado?.estado ?? 'AMARILLO'}
          mensajePublicoProgramadoActual={mensajePublicoProgramado}
          motivoProgramadoActual={motivoProgramado}
          inicioProgramadoActual={inicioProgramadoActual}
          finProgramadoActual={finProgramadoActual}
          hayProgramadoActivo={!!programado}
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
