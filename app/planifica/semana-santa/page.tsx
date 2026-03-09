import Link from 'next/link';
import { getApiUrl } from '@/lib/api';
import { getLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Item = {
  id: number;
  cartelVerticalUrl: string | null;
  cartelHorizontalUrl: string | null;
  interesTuristico: 'NINGUNO' | 'REGIONAL' | 'NACIONAL' | 'INTERNACIONAL';
  pueblo: {
    nombre: string;
    slug: string;
    provincia: string;
    comunidad: string;
    foto_destacada: string | null;
  };
  agenda: Array<{ id: number }>;
  dias: Array<{ id: number }>;
};

type Config = {
  titulo: string;
  subtitulo: string | null;
  anio: number;
  activo: boolean;
};

async function fetchData(locale: string): Promise<{ config: Config | null; pueblos: Item[] }> {
  const API = getApiUrl();
  const lang = encodeURIComponent(locale);
  const [cfgRes, pueblosRes] = await Promise.all([
    fetch(`${API}/semana-santa/config?lang=${lang}`, { cache: 'no-store' }),
    fetch(`${API}/semana-santa/pueblos?lang=${lang}`, { cache: 'no-store' }),
  ]);
  return {
    config: cfgRes.ok ? await cfgRes.json() : null,
    pueblos: pueblosRes.ok ? await pueblosRes.json() : [],
  };
}

function badgeInteres(value: Item['interesTuristico']) {
  if (value === 'INTERNACIONAL') return 'Interés Turístico Internacional';
  if (value === 'NACIONAL') return 'Interés Turístico Nacional';
  if (value === 'REGIONAL') return 'Interés Turístico Regional';
  return null;
}

export default async function SemanaSantaLandingPage() {
  const locale = await getLocale();
  const { config, pueblos } = await fetchData(locale);
  const title = config?.titulo ?? 'Semana Santa';
  const totalEventos = pueblos.reduce((acc, p) => acc + p.agenda.length, 0);
  const totalDias = pueblos.reduce((acc, p) => acc + p.dias.length, 0);

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 via-background to-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-10 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 px-7 py-8 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-300">Experiencias · Planifica</p>
            <h1 className="mt-2 font-serif text-4xl font-medium">{title}</h1>
          </div>
          <div className="px-7 py-6">
            <p className="text-muted-foreground">
            {config?.subtitulo || 'Selecciona un pueblo participante para ver su cartel, agenda y procesiones por día.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {config?.anio && <span className="rounded-full border bg-background px-3 py-1">Edición {config.anio}</span>}
              <span className="rounded-full border bg-background px-3 py-1">{pueblos.length} pueblos activos</span>
              <span className="rounded-full border bg-background px-3 py-1">{totalEventos} eventos agenda</span>
              <span className="rounded-full border bg-background px-3 py-1">{totalDias} días procesionales</span>
            </div>
          </div>
        </header>

        {pueblos.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
            No hay pueblos activos en Semana Santa por ahora.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pueblos.map((p) => {
              const image =
                (p.cartelHorizontalUrl && p.cartelHorizontalUrl.trim()) ||
                (p.cartelVerticalUrl && p.cartelVerticalUrl.trim()) ||
                p.pueblo.foto_destacada;
              const badge = badgeInteres(p.interesTuristico);
              return (
                <Link
                  key={p.id}
                  href={`/planifica/semana-santa/pueblo/${p.pueblo.slug}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative h-52 bg-muted">
                    {image ? (
                      <img
                        src={image}
                        alt={p.pueblo.nombre}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">Semana Santa</div>
                    )}
                    {badge && (
                      <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white">
                        {badge}
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
                  </div>
                  <div className="p-5">
                    <h2 className="font-semibold text-foreground group-hover:text-primary">{p.pueblo.nombre}</h2>
                    <p className="text-sm text-muted-foreground">
                      {p.pueblo.provincia}, {p.pueblo.comunidad}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {p.agenda.length} eventos en agenda · {p.dias.length} días de procesiones
                    </p>
                    <p className="mt-3 text-sm font-medium text-primary">Ver página del pueblo →</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
