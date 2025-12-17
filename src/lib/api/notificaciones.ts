export async function getNotificaciones(cursor?: string) {
  const url = new URL(
    `${process.env.NEXT_PUBLIC_API_URL}/notificaciones`
  );

  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }

  const res = await fetch(url.toString(), {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Error cargando notificaciones');
  }

  return res.json();
}