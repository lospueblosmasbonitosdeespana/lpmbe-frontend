import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function NotasPrensaNewsletterPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Notas de prensa y Newsletter</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Selecciona el área que quieres gestionar.
      </p>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Newsletter</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Suscriptores, campañas de newsletter y métricas de envío.
          </p>
          <Link
            href="/gestion/asociacion/notas-prensa-newsletter/newsletter"
            className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Ir a Newsletter
          </Link>
        </article>

        <article className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Notas de prensa</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Contactos de medios, segmentación por ámbito y envíos de prensa.
          </p>
          <Link
            href="/gestion/asociacion/notas-prensa-newsletter/notas-prensa"
            className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Ir a Notas de prensa
          </Link>
        </article>
      </section>

      <div className="mt-10 text-sm">
        <Link className="text-muted-foreground hover:text-foreground hover:underline" href="/gestion/asociacion">
          ← Volver a gestión
        </Link>
      </div>
    </main>
  );
}
