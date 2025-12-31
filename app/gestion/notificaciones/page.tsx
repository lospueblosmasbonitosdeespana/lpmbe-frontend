import { getMeServer } from '@/lib/me';
import { getNotificacionesServer, type Notificacion } from '@/lib/notificaciones';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NotificacionesPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN') redirect('/cuenta');

  const notificaciones = await getNotificacionesServer();

  // Ordenar: primero SEMAFORO, luego el resto, ambos por createdAt DESC
  const ordenadas = [...notificaciones].sort((a, b) => {
    const aEsSemaforo = a.tipo === 'SEMAFORO';
    const bEsSemaforo = b.tipo === 'SEMAFORO';
    
    if (aEsSemaforo && !bEsSemaforo) return -1;
    if (!aEsSemaforo && bEsSemaforo) return 1;
    
    // Mismo tipo, ordenar por fecha DESC
    const fechaA = new Date(a.createdAt).getTime();
    const fechaB = new Date(b.createdAt).getTime();
    return fechaB - fechaA;
  });

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">Notificaciones</h1>
      <p className="mt-2 text-sm text-gray-600">
        Total: {ordenadas.length} notificaciones
      </p>

      <div className="mt-6">
        <Link className="text-blue-600 hover:underline" href="/gestion/mis-pueblos">
          ← Volver a gestión
        </Link>
      </div>

      {ordenadas.length === 0 ? (
        <div className="mt-8 p-4 border rounded">
          <p className="text-gray-600">No hay notificaciones.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {ordenadas.map((n) => (
            <div key={n.id} className="p-4 border rounded">
              <div className="text-sm text-gray-500">
                {new Date(n.createdAt).toLocaleString('es-ES')}
              </div>
              {n.pueblo && (
                <div className="mt-1 text-sm text-gray-600">
                  Pueblo: <strong>{n.pueblo.nombre}</strong> ({n.pueblo.slug})
                </div>
              )}
              <div className="mt-1 text-sm">
                Tipo: <strong>{n.tipo}</strong>
              </div>
              {n.titulo && (
                <div className="mt-2 font-semibold">{n.titulo}</div>
              )}
              {n.contenido && (
                <div className="mt-2 text-gray-700">{n.contenido}</div>
              )}
              {n.autor && (
                <div className="mt-2 text-xs text-gray-500">
                  Por: {n.autor.nombre || 'Usuario'} ({n.autor.rol})
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}



