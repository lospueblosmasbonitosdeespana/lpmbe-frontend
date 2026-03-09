import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import AgendaInteractiva from './AgendaInteractiva';
import { getLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Dia = {
  id: number;
  fecha: string;
  nombreDia: string;
  titulo: string | null;
  descripcion: string | null;
  fotoUrl: string | null;
};

type Agenda = {
  id: number;
  titulo: string;
  descripcion: string | null;
  ubicacion: string | null;
  inicioLat?: number | null;
  inicioLng?: number | null;
  finLat?: number | null;
  finLng?: number | null;
  paradas?: Array<{ lat: number; lng: number; label?: string }> | null;
  fechaInicio: string;
  fechaFin: string | null;
  fotoUrl: string | null;
  youtubeUrl?: string | null;
  esFiestaInteresTuristico?: boolean;
};

type Payload = {
  participante: {
    titulo: string | null;
    descripcion: string | null;
    cartelVerticalUrl: string | null;
    cartelHorizontalUrl: string | null;
    streamUrl: string | null;
    interesTuristico: 'NINGUNO' | 'REGIONAL' | 'NACIONAL' | 'INTERNACIONAL';
    pueblo: {
      nombre: string;
      slug: string;
      provincia: string;
      comunidad: string;
      foto_destacada: string | null;
    };
    agenda: Agenda[];
    dias: Dia[];
  };
  config: {
    titulo: string;
    anio: number;
  };
};

async function fetchData(slug: string, locale: string): Promise<Payload | null> {
  const API = getApiUrl();
  const lang = encodeURIComponent(locale);
  const res = await fetch(`${API}/semana-santa/pueblos/${slug}?lang=${lang}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function SemanaSantaPuebloPage({
  params,
}: {
  params: Promise<{ puebloSlug: string }>;
}) {
  const { puebloSlug } = await params;
  const locale = await getLocale();
  const data = await fetchData(puebloSlug, locale);
  if (!data) notFound();

  const { participante, config } = data;
  const hero =
    (participante.pueblo.foto_destacada && participante.pueblo.foto_destacada.trim()) ||
    (participante.cartelHorizontalUrl && participante.cartelHorizontalUrl.trim()) ||
    (participante.cartelVerticalUrl && participante.cartelVerticalUrl.trim());
  const interesLabel =
    participante.interesTuristico === 'INTERNACIONAL'
      ? 'Interés Turístico Internacional'
      : participante.interesTuristico === 'NACIONAL'
        ? 'Interés Turístico Nacional'
        : participante.interesTuristico === 'REGIONAL'
          ? 'Interés Turístico Regional'
          : null;
  const eventsByDate = participante.agenda.reduce<Record<string, Agenda[]>>((acc, item) => {
    const key = item.fechaInicio.slice(0, 10);
    acc[key] = [...(acc[key] || []), item].sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));
    return acc;
  }, {});

  const timeOpts = { hour: '2-digit' as const, minute: '2-digit' as const, timeZone: 'Europe/Madrid' };
  const diasConEventos = participante.dias.filter((d) => (eventsByDate[d.fecha]?.length ?? 0) > 0);

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 via-background to-background">
      {hero && (
        <section className="relative h-[44vh] w-full overflow-hidden bg-muted">
          <img src={hero} alt={participante.pueblo.nombre} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-6xl px-6 pb-8 text-white">
            <p className="text-sm uppercase tracking-wide opacity-90">{config.titulo}</p>
            <h1 className="mt-1 font-serif text-4xl font-medium">{participante.pueblo.nombre}</h1>
            <p className="mt-1 text-sm opacity-90">
              {participante.pueblo.provincia}, {participante.pueblo.comunidad}
            </p>
            {interesLabel && (
              <span className="mt-3 inline-block rounded-full border border-white/35 bg-black/35 px-3 py-1 text-xs">
                {interesLabel}
              </span>
            )}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl px-6 py-10">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href="/planifica/semana-santa" className="hover:underline">
            ← Volver al listado de pueblos
          </Link>
        </nav>

        {(participante.titulo || participante.descripcion) && (
          <section className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
            {participante.titulo && <h2 className="font-serif text-2xl font-medium">{participante.titulo}</h2>}
            {participante.descripcion && (
              <p className="mt-3 whitespace-pre-line text-muted-foreground">{participante.descripcion}</p>
            )}
          </section>
        )}

        {(participante.cartelVerticalUrl || participante.cartelHorizontalUrl) && (
          <section className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 font-serif text-2xl font-medium">Cartel</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {participante.cartelVerticalUrl && (
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Formato vertical</p>
                  <img
                    src={participante.cartelVerticalUrl}
                    alt={`Cartel vertical ${participante.pueblo.nombre}`}
                    className="w-full rounded-xl border object-cover"
                  />
                </div>
              )}
              {participante.cartelHorizontalUrl && (
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Formato horizontal</p>
                  <img
                    src={participante.cartelHorizontalUrl}
                    alt={`Cartel horizontal ${participante.pueblo.nombre}`}
                    className="w-full rounded-xl border object-cover"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        <AgendaInteractiva agenda={participante.agenda} locale={locale} />

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-2xl font-medium">Procesiones por día</h2>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {config.anio}
            </span>
          </div>
          {diasConEventos.length === 0 ? (
            <p className="text-muted-foreground">No hay días con eventos programados.</p>
          ) : (
            <div className="space-y-3">
              {diasConEventos.map((d) => (
                <Link key={d.id} href={`/planifica/semana-santa/pueblo/${participante.pueblo.slug}/dia/${d.fecha}`}>
                  <article className="rounded-xl border bg-background p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {new Date(d.fecha).toLocaleDateString(locale, {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold">{d.titulo || d.nombreDia}</h3>
                      </div>
                      <span className="rounded-full border px-2.5 py-1 text-xs">
                        {(eventsByDate[d.fecha]?.length ?? 0)} eventos
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {(eventsByDate[d.fecha] ?? []).map((ev) => (
                        <p key={ev.id} className="flex flex-wrap items-center gap-2">
                          <span>
                            {new Date(ev.fechaInicio).toLocaleTimeString(locale, timeOpts)}
                            {ev.fechaFin
                              ? ` - ${new Date(ev.fechaFin).toLocaleTimeString(locale, timeOpts)}`
                              : ''}{' '}
                            · {ev.titulo}
                          </span>
                          {ev.esFiestaInteresTuristico && (
                            <span className="inline-flex shrink-0 rounded-full border border-[#b2643a]/30 bg-[#b2643a]/10 px-2 py-0.5 text-[10px] font-medium text-[#8f4a26]">
                              Fiesta de Interés Turístico
                            </span>
                          )}
                        </p>
                      ))}
                    </div>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary">Ver eventos del día →</p>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>

        {participante.streamUrl && (
          <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 font-serif text-2xl font-medium">Retransmisión en directo</h2>
            <div className="relative w-full overflow-hidden rounded-md border bg-black" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={participante.streamUrl}
                title={`Directo ${participante.pueblo.nombre}`}
                className="absolute inset-0 h-full w-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
