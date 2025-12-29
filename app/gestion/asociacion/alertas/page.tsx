import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';

function getWebUrl() {
  // En producción, usar NEXT_PUBLIC_WEB_URL si existe, sino VERCEL_URL
  if (process.env.NEXT_PUBLIC_WEB_URL) {
    return process.env.NEXT_PUBLIC_WEB_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

async function fetchAlertasGlobales() {
  const res = await fetch(`${getWebUrl()}/api/gestion/asociacion/alertas`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

export default async function AlertasGlobalesPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  const alertas = await fetchAlertasGlobales();

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Alertas globales</h1>
          <p className="mt-1 text-sm text-gray-600">Asociación · Nacional</p>
        </div>

        <Link
          className="rounded-md border px-3 py-2 text-sm hover:underline"
          href="/gestion/asociacion/alertas/nueva"
        >
          + Nueva alerta
        </Link>
      </div>

      {alertas.length === 0 ? (
        <div className="mt-6 rounded-md border p-4 text-sm text-gray-600">
          No hay alertas globales todavía.
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {alertas.map((a: any) => (
            <li key={a.id ?? a.titulo} className="rounded-md border p-4">
              <div className="font-medium">{a.titulo ?? '(sin título)'}</div>
              <div className="mt-1 text-xs text-gray-500">
                {a.fecha ?? a.createdAt ?? ''}
              </div>
              {a.contenido ? (
                <div className="mt-2 text-sm text-gray-700">
                  {String(a.contenido).slice(0, 240)}
                  {String(a.contenido).length > 240 ? '…' : ''}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href="/gestion/asociacion">
          ← Volver
        </Link>
      </div>
    </main>
  );
}





