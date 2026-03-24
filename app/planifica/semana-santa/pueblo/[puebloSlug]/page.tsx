import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import AgendaInteractiva from './AgendaInteractiva';
import { getLocale, getTranslations } from 'next-intl/server';
import { translateHolyWeekDayLabel } from './day-labels';
import ImagenConLightbox from './ImagenConLightbox';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function toYouTubeEmbedUrl(url: string): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes('/embed/')) return trimmed;

  const liveMatch = trimmed.match(/youtube\.com\/(?:watch\?v=|live\/)([a-zA-Z0-9_-]{11})/);
  if (liveMatch) return `https://www.youtube.com/embed/${liveMatch[1]}?autoplay=1`;

  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1`;

  const channelPatterns = [
    /youtube\.com\/(?:c|channel|user)\/([^/?#]+)/,
    /youtube\.com\/@([^/?#]+)/,
  ];
  for (const pattern of channelPatterns) {
    const m = trimmed.match(pattern);
    if (m) return `https://www.youtube.com/embed/live_stream?channel=${m[1]}&autoplay=1`;
  }

  return trimmed;
}

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
  googleMapsUrl?: string | null;
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
  const t = await getTranslations('planifica.semanaSanta');
  const data = await fetchData(puebloSlug, locale);
  if (!data) notFound();

  const { participante, config } = data;
  const hero =
    (participante.pueblo.foto_destacada && participante.pueblo.foto_destacada.trim()) ||
    (participante.cartelHorizontalUrl && participante.cartelHorizontalUrl.trim()) ||
    (participante.cartelVerticalUrl && participante.cartelVerticalUrl.trim());
  const interesLabel =
    participante.interesTuristico === 'INTERNACIONAL'
      ? t('tourismInterestInternational')
      : participante.interesTuristico === 'NACIONAL'
        ? t('tourismInterestNational')
        : participante.interesTuristico === 'REGIONAL'
          ? t('tourismInterestRegional')
          : null;
  const eventsByDate = participante.agenda.reduce<Record<string, Agenda[]>>((acc, item) => {
    const key = item.fechaInicio.slice(0, 10);
    acc[key] = [...(acc[key] || []), item].sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));
    return acc;
  }, {});

  const timeOpts = { hour: '2-digit' as const, minute: '2-digit' as const, hour12: false as const, timeZone: 'Europe/Madrid' };
  const diasConEventos = participante.dias
    .filter((d) => (eventsByDate[d.fecha]?.length ?? 0) > 0)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const hasBothPosters = Boolean(participante.cartelVerticalUrl && participante.cartelHorizontalUrl);

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
            {t('backToVillageList')}
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
            <div className={hasBothPosters ? 'grid gap-4 md:grid-cols-2' : 'flex justify-center'}>
              {participante.cartelVerticalUrl && (
                <div className="flex justify-center">
                  <ImagenConLightbox
                    src={participante.cartelVerticalUrl}
                    alt={t('verticalPosterAlt', { village: participante.pueblo.nombre })}
                    wrapperClassName="w-full max-w-2xl rounded-xl border"
                    className="max-h-[70vh]"
                    fit="contain"
                  />
                </div>
              )}
              {participante.cartelHorizontalUrl && (
                <div className="flex justify-center">
                  <ImagenConLightbox
                    src={participante.cartelHorizontalUrl}
                    alt={t('horizontalPosterAlt', { village: participante.pueblo.nombre })}
                    wrapperClassName="w-full max-w-2xl rounded-xl border"
                    className="max-h-[70vh]"
                    fit="contain"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        <AgendaInteractiva agenda={participante.agenda} locale={locale} puebloSlug={participante.pueblo.slug} />

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-2xl font-medium">{t('processionsByDay')}</h2>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {config.anio}
            </span>
          </div>
          {diasConEventos.length === 0 ? (
            <p className="text-muted-foreground">{t('noScheduledEventDays')}</p>
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
                        <h3 className="mt-1 text-lg font-semibold">
                          {translateHolyWeekDayLabel(d.titulo || d.nombreDia, t)}
                        </h3>
                      </div>
                      <span className="rounded-full border px-2.5 py-1 text-xs">
                        {t('eventsCount', { count: eventsByDate[d.fecha]?.length ?? 0 })}
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
                              {t('tourismFestivalTag')}
                            </span>
                          )}
                        </p>
                      ))}
                    </div>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary">{t('viewDayEvents')}</p>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>

        {participante.streamUrl && (
          <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 font-serif text-2xl font-medium">{t('liveStream')}</h2>
            <div className="relative w-full overflow-hidden rounded-md border bg-black" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={toYouTubeEmbedUrl(participante.streamUrl)}
                title={t('liveTitle', { village: participante.pueblo.nombre })}
                className="absolute inset-0 h-full w-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
            <a
              href={participante.streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5zm7.25-.75a.75.75 0 01.75-.75h3.5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0V6.31l-5.47 5.47a.75.75 0 01-1.06-1.06l5.47-5.47H12.25a.75.75 0 01-.75-.75z" clipRule="evenodd" />
              </svg>
              Abrir en YouTube
            </a>
          </section>
        )}
      </div>
    </main>
  );
}
