import { getNotificaciones } from '@/lib/api/notificaciones';
import NotificacionesFeed from './ui/NotificacionesFeed';

export default async function NotificacionesPage() {
  const data = await getNotificaciones();

  return (
    <main style={{ padding: 24 }}>
      <h1>Centro de notificaciones</h1>

      <NotificacionesFeed
        initialItems={data.items}
        initialCursor={data.nextCursor}
      />
    </main>
  );
}