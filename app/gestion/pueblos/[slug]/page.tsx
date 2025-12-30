import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getPuebloBySlug } from '@/lib/api';
import { getNotificacionesServer } from '@/lib/notificaciones';

export default async function GestionPuebloPage({
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

  const pueblo = await getPuebloBySlug(slug);
  
  // Leer datos del semáforo desde pueblo.semaforo
  const s: any = pueblo?.semaforo ?? null;
  const estado = s?.estado ?? "VERDE";
  const fecha = s?.ultima_actualizacion ?? s?.ultimaActualizacion ?? null;
  const mensajePublico = s?.mensaje_publico ?? null;
  const mensajeInterno = s?.mensaje ?? null;
  const caducaEn = s?.caduca_en ?? null;
  const inicio = s?.programado_inicio ?? null;
  const fin = s?.programado_fin ?? null;
  const motivo = s?.motivo ?? null;

  // Obtener últimas notificaciones del pueblo
  const todasNotificaciones = await getNotificacionesServer();
  const notificacionesPueblo = todasNotificaciones
    .filter((n) => n.puebloId === pueblo.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Gestión del pueblo</h1>
      <p className="mt-2 text-sm text-gray-600">
        Pueblo: <strong>{pueblo?.nombre ?? slug}</strong>
      </p>

      {/* Resumen Semáforo */}
      <div className="mt-6 rounded-md border p-4 text-sm">
        <div className="font-medium text-gray-800">Semáforo</div>
        <div className="mt-2 text-gray-600">
          <p>Estado: <strong>{estado}</strong></p>
          {fecha && (
            <p className="mt-1">Actualizado: {new Date(fecha).toLocaleString("es-ES")}</p>
          )}
          {mensajePublico && (
            <p className="mt-1">Mensaje público: {mensajePublico}</p>
          )}
          {caducaEn && estado !== "VERDE" && !inicio && !fin && (
            <p className="mt-1">Caduca automático: {new Date(caducaEn).toLocaleString("es-ES")}</p>
          )}
          {inicio && fin && (
            <p className="mt-1">
              Programado: {new Date(inicio).toLocaleString("es-ES")} → {new Date(fin).toLocaleString("es-ES")}
            </p>
          )}
          {motivo && (
            <p className="mt-1">Motivo: {motivo}</p>
          )}
          {mensajeInterno && (
            <p className="mt-1">Mensaje interno: {mensajeInterno}</p>
          )}
        </div>
        <div className="mt-3">
          <Link className="hover:underline text-blue-600" href={`/gestion/pueblos/${slug}/semaforo`}>
            Gestionar semáforo →
          </Link>
        </div>
      </div>

      {/* Últimas notificaciones */}
      {notificacionesPueblo.length > 0 && (
        <div className="mt-6 rounded-md border p-4 text-sm">
          <div className="font-medium text-gray-800">Últimas notificaciones</div>
          <div className="mt-2 space-y-3">
            {notificacionesPueblo.map((n) => (
              <div key={n.id} className="border-b pb-2 last:border-b-0">
                <div className="text-xs text-gray-500">
                  {new Date(n.createdAt).toLocaleString('es-ES')}
                </div>
                <div className="mt-1 text-xs">
                  Tipo: <strong>{n.tipo}</strong>
                </div>
                {n.titulo && (
                  <div className="mt-1 font-semibold">{n.titulo}</div>
                )}
                {n.contenido && (
                  <div className="mt-1 text-gray-600">{n.contenido}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-md border p-4 text-sm text-gray-600">
        <div className="font-medium text-gray-800">Acciones</div>
        <div className="mt-3 flex gap-4 text-sm">
          <Link className="hover:underline" href={`/gestion/pueblos/${slug}/noticias`}>
            Noticias
          </Link>
          <Link className="hover:underline" href={`/gestion/pueblos/${slug}/eventos`}>
            Eventos
          </Link>
          <Link className="hover:underline" href={`/gestion/pueblos/${slug}/alertas`}>
            Alertas
          </Link>
          <Link className="hover:underline" href={`/gestion/pueblos/${slug}/semaforo`}>
            Semáforo
          </Link>
        </div>
      </div>

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href="/gestion/mis-pueblos">← Volver a pueblos</Link>
      </div>
    </main>
  );
}

