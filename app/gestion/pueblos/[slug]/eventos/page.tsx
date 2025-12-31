import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchEventos(puebloSlug: string) {
  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const baseUrl = `${proto}://${host}`;

  const res = await fetch(
    `${baseUrl}/api/gestion/eventos?puebloSlug=${encodeURIComponent(puebloSlug)}`,
    {
      cache: 'no-store',
      headers: { cookie: h.get('cookie') ?? '' },
    }
  );
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

export default async function EventosPuebloPage({
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
    if (!mis.some((p) => p.slug === slug)) redirect('/gestion/mis-pueblos');
  }

  const eventos = await fetchEventos(slug);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Eventos</h1>
          <p className="mt-1 text-sm text-gray-600">
            Pueblo: <strong>{slug}</strong>
          </p>
        </div>

        <Link
          className="rounded-md border px-3 py-2 text-sm hover:underline"
          href={`/gestion/pueblos/${slug}/eventos/nuevo`}
        >
          + Nuevo evento
        </Link>
      </div>

      {eventos.length === 0 ? (
        <div className="mt-6 rounded-md border p-4 text-sm text-gray-600">
          No hay eventos todavía.
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {eventos.map((e: any) => (
            <li key={e.id ?? e.titulo} className="rounded-md border p-4">
              <div className="font-medium">{e.titulo ?? '(sin título)'}</div>
              <div className="mt-1 text-xs text-gray-500">
                {e.fecha_inicio ? String(e.fecha_inicio) : ''}
                {e.fecha_fin ? ` → ${String(e.fecha_fin)}` : ''}
              </div>
              {e.descripcion ? (
                <div className="mt-2 text-sm text-gray-700">
                  {String(e.descripcion).slice(0, 200)}
                  {String(e.descripcion).length > 200 ? '…' : ''}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href={`/gestion/pueblos/${slug}`}>
          ← Volver a gestión del pueblo
        </Link>
      </div>
    </main>
  );
}





