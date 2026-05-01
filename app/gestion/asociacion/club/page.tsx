import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import ClubAdminClient from './ClubAdminClient';
import { GestionAsociacionSubpageShell } from '../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconUsers } from '../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type QuickLink = {
  href: string;
  title: string;
  description: string;
  tone: 'amber' | 'emerald' | 'sky' | 'violet' | 'rose' | 'teal' | 'fuchsia';
  icon: React.ReactNode;
};

const TONES: Record<QuickLink['tone'], { card: string; bullet: string; iconBg: string }> = {
  amber: {
    card: 'border-amber-200/80 hover:border-amber-300 hover:shadow-amber-100/60 dark:border-amber-800/50 from-amber-50/70',
    bullet: 'text-amber-700 dark:text-amber-200',
    iconBg: 'from-amber-500 to-amber-600 shadow-amber-200/60',
  },
  emerald: {
    card: 'border-emerald-200/80 hover:border-emerald-300 hover:shadow-emerald-100/60 dark:border-emerald-800/50 from-emerald-50/70',
    bullet: 'text-emerald-700 dark:text-emerald-200',
    iconBg: 'from-emerald-500 to-emerald-600 shadow-emerald-200/60',
  },
  sky: {
    card: 'border-sky-200/80 hover:border-sky-300 hover:shadow-sky-100/60 dark:border-sky-800/50 from-sky-50/70',
    bullet: 'text-sky-700 dark:text-sky-200',
    iconBg: 'from-sky-500 to-sky-600 shadow-sky-200/60',
  },
  violet: {
    card: 'border-violet-200/80 hover:border-violet-300 hover:shadow-violet-100/60 dark:border-violet-800/50 from-violet-50/70',
    bullet: 'text-violet-700 dark:text-violet-200',
    iconBg: 'from-violet-500 to-violet-600 shadow-violet-200/60',
  },
  rose: {
    card: 'border-rose-200/80 hover:border-rose-300 hover:shadow-rose-100/60 dark:border-rose-800/50 from-rose-50/70',
    bullet: 'text-rose-700 dark:text-rose-200',
    iconBg: 'from-rose-500 to-rose-600 shadow-rose-200/60',
  },
  teal: {
    card: 'border-teal-200/80 hover:border-teal-300 hover:shadow-teal-100/60 dark:border-teal-800/50 from-teal-50/70',
    bullet: 'text-teal-700 dark:text-teal-200',
    iconBg: 'from-teal-500 to-teal-600 shadow-teal-200/60',
  },
  fuchsia: {
    card: 'border-fuchsia-200/80 hover:border-fuchsia-300 hover:shadow-fuchsia-100/60 dark:border-fuchsia-800/50 from-fuchsia-50/70',
    bullet: 'text-fuchsia-700 dark:text-fuchsia-200',
    iconBg: 'from-fuchsia-500 to-fuchsia-600 shadow-fuchsia-200/60',
  },
};

const QUICK_LINKS: QuickLink[] = [
  {
    href: '/gestion/asociacion/club/recursos-pueblos',
    title: 'Recursos pueblos',
    description: 'Catálogo RRTT por pueblo · descuentos y regalos',
    tone: 'emerald',
    icon: (
      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M3 21h18M5 21V8l7-5 7 5v13" />
        <path d="M9 21v-6h6v6M10 11h4" />
      </svg>
    ),
  },
  {
    href: '/gestion/asociacion/club/recursos-asociacion',
    title: 'Recursos asociación',
    description: 'Beneficios globales para socios',
    tone: 'amber',
    icon: (
      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M20 12V8a2 2 0 00-2-2h-2.5L13 3h-2L8.5 6H6a2 2 0 00-2 2v4" />
        <path d="M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6" />
        <path d="M12 11v8M9 14l3-3 3 3" />
      </svg>
    ),
  },
  {
    href: '/gestion/asociacion/club/recursos-rurales',
    title: 'Recursos rurales/naturales',
    description: 'Cascadas, miradores, parajes · validados por GPS',
    tone: 'emerald',
    icon: (
      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M3 20l5-9 4 6 3-4 6 7z" />
        <path d="M9 11l1.5-2L12 11" />
      </svg>
    ),
  },
  {
    href: '/gestion/asociacion/club/metricas',
    title: 'Métricas validaciones',
    description: 'QR escaneados por pueblo y día',
    tone: 'sky',
    icon: (
      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 4 4 5-5" />
      </svg>
    ),
  },
  {
    href: '/gestion/asociacion/club/sorteos',
    title: 'Sorteos',
    description: 'Concursos para socios · ganadores transparentes',
    tone: 'violet',
    icon: (
      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M6 9h12l-1 11H7L6 9z" />
        <path d="M9 9V6a3 3 0 016 0v3" />
        <path d="M12 13v3" />
      </svg>
    ),
  },
  {
    href: '/gestion/asociacion/club/comunicaciones',
    title: 'Comunicaciones',
    description: 'Newsletter segmentada del Club',
    tone: 'rose',
    icon: (
      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M3 5h18v14H3z" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    ),
  },
  {
    href: '/gestion/asociacion/club/catalogo',
    title: 'Estado catálogo RRTT',
    description: 'Cobertura por pueblo · qué falta',
    tone: 'teal',
    icon: (
      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M4 5a2 2 0 012-2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" />
        <path d="M14 3v6h6M9 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: '/gestion/asociacion/club/gamificacion',
    title: 'Gamificación',
    description: 'Puntos por cada acción del socio · igual para todos los pueblos',
    tone: 'fuchsia',
    icon: (
      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 2l2.39 4.84 5.34.78-3.86 3.76.91 5.31L12 14.77l-4.78 2.51.91-5.31L4.27 7.62l5.34-.78L12 2z" />
      </svg>
    ),
  },
  {
    href: '/gestion/asociacion/club/recompensas',
    title: 'Premios y recompensas',
    description: 'Catálogo de canjes · stock, reembolsos y caducidad',
    tone: 'amber',
    icon: (
      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
      </svg>
    ),
  },
  {
    href: '/gestion/asociacion/datos/puntos-recursos',
    title: 'Puntos por recurso',
    description: 'Ajustes individuales · imprescindible para SELECTION',
    tone: 'rose',
    icon: (
      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" />
      </svg>
    ),
  },
  {
    href: '/gestion/asociacion/club/interesados',
    title: 'Interesados en Club',
    description: 'Lista de emails en espera para aviso de apertura',
    tone: 'violet',
    icon: (
      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M3 5h18v14H3z" />
        <path d="M3 7l9 6 9-6" />
        <path d="M8 12h8M8 16h5" />
      </svg>
    ),
  },
];

export default async function GestionAsociacionClubPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Club de amigos"
      subtitle="Socios, inscripciones, precios y estadísticas · Asociación LPMBE"
      heroIcon={<AsociacionHeroIconUsers />}
      maxWidthClass="max-w-5xl"
    >
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-foreground">Accesos rápidos</h2>
          <span className="text-xs text-muted-foreground">{QUICK_LINKS.length} herramientas</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((link) => {
            const tone = TONES[link.tone];
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br via-white to-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:to-card ${tone.card}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md ${tone.iconBg}`}
                  >
                    {link.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{link.title}</h3>
                      <svg
                        className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${tone.bullet}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        aria-hidden
                      >
                        <path d="M5 12h14M13 5l7 7-7 7" />
                      </svg>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{link.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <ClubAdminClient />
    </GestionAsociacionSubpageShell>
  );
}
