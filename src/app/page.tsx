import { getNotificaciones } from '@/lib/api/notificaciones';

export default async function NotificacionesPage() {
  const data = await getNotificaciones();

  return (
    <main style={{ padding: 24 }}>
      <h1>Centro de notificaciones</h1>

      <ul style={{ marginTop: 24 }}>
        {data.items.map((n: any) => (
          <li key={n.refId} style={{ marginBottom: 16 }}>
            <strong>{n.titulo}</strong>
            <div>{new Date(n.fecha).toLocaleString()}</div>

            {n.pueblo && (
              <div>Pueblo: {n.pueblo.nombre}</div>
            )}

            {n.semaforo && (
              <div>Semáforo: {n.semaforo.estado}</div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}