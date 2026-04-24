import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { GestionAsociacionSubpageShell } from '../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconMegaphone } from '../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const ASOCIACION_BACK = '/gestion/asociacion';
const ASOCIACION_BACK_LABEL = 'Volver a gestión de la asociación';

export default async function NotasPrensaNewsletterPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Notas de prensa y Newsletter"
      subtitle="Envíos masivos, segmentación y métricas"
      heroIcon={<AsociacionHeroIconMegaphone />}
      maxWidthClass="max-w-6xl"
      backHref={ASOCIACION_BACK}
      backLabel={ASOCIACION_BACK_LABEL}
    >
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

        <article className="rounded-xl border-2 border-amber-300 bg-amber-50/50 p-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
              Nuevo
            </span>
            <h2 className="text-lg font-semibold">Ayuntamientos</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Comunicaciones internas a alcaldes y personal de ayuntamiento
            (concejales, oficinas de turismo…). Mismo constructor visual.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/gestion/asociacion/notas-prensa-newsletter/ayuntamientos"
              className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Ir a Ayuntamientos
            </Link>
            <Link
              href="/gestion/asociacion/notas-prensa-newsletter/ayuntamientos/contactos"
              className="inline-flex rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium"
            >
              Gestionar contactos
            </Link>
          </div>
        </article>
      </section>
    </GestionAsociacionSubpageShell>
  );
}
