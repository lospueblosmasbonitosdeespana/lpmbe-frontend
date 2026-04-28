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
      <div className="space-y-8">
        <p className="max-w-3xl text-sm text-muted-foreground">
          Cuatro canales de comunicación masiva con medidas anti-spam, plantillas reutilizables
          y métricas de entrega/aperturas. Cada canal tiene su lista de contactos y su
          constructor visual.
        </p>

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
          {/* Newsletter */}
          <article className="group relative overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/70 via-white to-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg dark:border-violet-800/50 dark:from-violet-950/40 dark:to-card">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-200/40 blur-3xl transition-opacity group-hover:opacity-80 dark:bg-violet-800/20" aria-hidden />
            <div className="relative flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-md shadow-violet-200/60">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">Newsletter</h2>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700 ring-1 ring-violet-200 dark:bg-violet-950 dark:text-violet-200 dark:ring-violet-800">
                    Mensual
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Suscriptores y campañas semanales con el constructor visual.
                </p>
              </div>
            </div>
            <div className="relative mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Link
                href="/gestion/asociacion/notas-prensa-newsletter/newsletter"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-violet-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-violet-200/60 transition-all hover:from-violet-700 hover:to-violet-800 active:scale-[0.98]"
              >
                Ir a Newsletter
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </article>

          {/* Notas de prensa */}
          <article className="group relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg dark:border-amber-800/50 dark:from-amber-950/40 dark:to-card">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-200/40 blur-3xl transition-opacity group-hover:opacity-80 dark:bg-amber-800/20" aria-hidden />
            <div className="relative flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-amber-200/60">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M3 11l18-7v16L3 13z" />
                  <path d="M11.6 16.8a3 3 0 11-5.8-1.6" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">Notas de prensa</h2>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800">
                    Medios
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Contactos de medios, segmentación por ámbito y métricas por campaña.
                </p>
              </div>
            </div>
            <div className="relative mt-5 flex flex-wrap gap-2">
              <Link
                href="/gestion/asociacion/notas-prensa-newsletter/notas-prensa"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-amber-200/60 transition-all hover:from-amber-600 hover:to-amber-700 active:scale-[0.98]"
              >
                Ir a Notas de prensa
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/gestion/asociacion/notas-prensa-newsletter/notas-prensa/contactos"
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition-all hover:bg-amber-50 dark:border-amber-800 dark:bg-card dark:text-amber-200 dark:hover:bg-amber-950/40"
              >
                Contactos
              </Link>
            </div>
          </article>

          {/* Ayuntamientos */}
          <article className="group relative overflow-hidden rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50/70 via-white to-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-lg dark:border-teal-800/50 dark:from-teal-950/40 dark:to-card">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-teal-200/40 blur-3xl transition-opacity group-hover:opacity-80 dark:bg-teal-800/20" aria-hidden />
            <div className="relative flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-md shadow-teal-200/60">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M3 21h18M5 21V8l7-5 7 5v13" />
                  <path d="M9 21v-6h6v6M10 11h4" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">Ayuntamientos</h2>
                  <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-700 ring-1 ring-teal-200 dark:bg-teal-950 dark:text-teal-200 dark:ring-teal-800">
                    Nuevo
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Comunicaciones internas a alcaldes, concejales y oficinas de turismo.
                </p>
              </div>
            </div>
            <div className="relative mt-5 flex flex-wrap gap-2">
              <Link
                href="/gestion/asociacion/notas-prensa-newsletter/ayuntamientos"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-200/60 transition-all hover:from-teal-600 hover:to-teal-700 active:scale-[0.98]"
              >
                Ir a Ayuntamientos
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/gestion/asociacion/notas-prensa-newsletter/ayuntamientos/contactos"
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-700 transition-all hover:bg-teal-50 dark:border-teal-800 dark:bg-card dark:text-teal-200 dark:hover:bg-teal-950/40"
              >
                Contactos
              </Link>
            </div>
          </article>

          {/* Club de Amigos */}
          <article className="group relative overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/70 via-white to-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-lg dark:border-rose-800/50 dark:from-rose-950/40 dark:to-card">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-rose-200/40 blur-3xl transition-opacity group-hover:opacity-80 dark:bg-rose-800/20" aria-hidden />
            <div className="relative flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-md shadow-rose-200/60">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 11l-3 3-1.5-1.5" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">Club de Amigos</h2>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-800">
                    Socios
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Comunicaciones segmentadas a socios: por estado, intereses, provincia, edad o caducidad.
                </p>
              </div>
            </div>
            <div className="relative mt-5 flex flex-wrap gap-2">
              <Link
                href="/gestion/asociacion/club/comunicaciones"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-rose-200/60 transition-all hover:from-rose-600 hover:to-rose-700 active:scale-[0.98]"
              >
                Ir a Newsletter Club
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/gestion/asociacion/datos/club"
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition-all hover:bg-rose-50 dark:border-rose-800 dark:bg-card dark:text-rose-200 dark:hover:bg-rose-950/40"
              >
                Socios
              </Link>
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-border bg-gradient-to-b from-muted/30 to-card p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 shadow-md">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-foreground">Buenas prácticas de envío</h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                  Adjuntos hasta <strong className="font-semibold text-foreground">12 MB por archivo</strong> y <strong className="font-semibold text-foreground">35 MB en total</strong> por correo.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
                  Si una campaña marca <strong className="font-semibold text-foreground">FAILED</strong>, usa el botón &laquo;Reenviar fallidos&raquo; — recupera los adjuntos automáticamente.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" aria-hidden />
                  Las notas de prensa <em>no</em> incluyen enlace de baja para que los periodistas no se autoexcluyan; las newsletters, ayuntamientos y comunicaciones al Club sí.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" aria-hidden />
                  En el <strong className="font-semibold text-foreground">Club de Amigos</strong>, los emails transaccionales (caducidad, sorteos, recordatorios) se envían siempre; el resto solo a quienes hayan aceptado marketing.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </GestionAsociacionSubpageShell>
  );
}
