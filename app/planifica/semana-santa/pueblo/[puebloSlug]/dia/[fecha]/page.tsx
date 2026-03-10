import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import { getLocale, getTranslations } from 'next-intl/server';
import ShareButton from '@/app/components/ShareButton';
import EventoRecorridoMap from '../../EventoRecorridoMap';
import ImagenConLightbox from '../../ImagenConLightbox';
import YoutubeEmbed from '../../YoutubeEmbed';
import { translateHolyWeekDayLabel } from '../../day-labels';

type Agenda = {
  id: number;
  titulo: string;
  descripcion: string | null;
  avisosImportantes?: string | null;
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
    pueblo: { nombre: string; slug: string };
    agenda: Agenda[];
    dias: Array<{
      id: number;
      fecha: string;
      nombreDia: string;
      titulo: string | null;
      descripcion: string | null;
      fotoUrl: string | null;
    }>;
  };
};

async function fetchData(slug: string, locale: string): Promise<Payload | null> {
  const API = getApiUrl();
  const lang = encodeURIComponent(locale);
  const res = await fetch(`${API}/semana-santa/pueblos/${slug}?lang=${lang}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function SemanaSantaDiaPage({
  params,
}: {
  params: Promise<{ puebloSlug: string; fecha: string }>;
}) {
  const { puebloSlug, fecha } = await params;
  const locale = await getLocale();
  const t = await getTranslations('planifica.semanaSanta');
  const data = await fetchData(puebloSlug, locale);
  if (!data) return notFound();

  const day = data.participante.dias.find((d) => d.fecha === fecha);
  const eventos = data.participante.agenda.filter((a) => a.fechaInicio.slice(0, 10) === fecha);
  if (!day) return notFound();

  const timeOpts = { hour: '2-digit' as const, minute: '2-digit' as const, hour12: false as const, timeZone: 'Europe/Madrid' };

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href={`/planifica/semana-santa/pueblo/${puebloSlug}`} className="text-sm text-muted-foreground hover:underline">
        {t('backToVillageHolyWeek')}
      </Link>

      <header className="mt-4 rounded-xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">{data.participante.pueblo.nombre}</p>
        <h1 className="font-serif text-3xl font-medium">
          {translateHolyWeekDayLabel(day.titulo || day.nombreDia, t)}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date(day.fecha).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        {day.descripcion && <p className="mt-3 text-muted-foreground">{day.descripcion}</p>}
      </header>

      <section className="mt-6 rounded-xl border bg-card p-5">
        <h2 className="text-xl font-semibold">{t('eventsOfDay')}</h2>
        {eventos.length === 0 ? (
          <p className="mt-3 text-muted-foreground">{t('noEventsForDay')}</p>
        ) : (
          <div className="mt-4 space-y-4">
            {eventos.map((e) => (
              <article key={e.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{e.titulo}</h3>
                    {e.esFiestaInteresTuristico && (
                      <span className="inline-flex shrink-0 rounded-full border border-[#b2643a]/30 bg-[#b2643a]/10 px-2.5 py-1 text-xs font-medium text-[#8f4a26]">
                        {t('tourismFestivalTag')}
                      </span>
                    )}
                  </div>
                  <ShareButton
                    url={`/planifica/semana-santa/pueblo/${puebloSlug}/dia/${fecha}`}
                    title={e.titulo}
                    variant="icon"
                    className="rounded-full border bg-card"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(e.fechaInicio).toLocaleTimeString(locale, timeOpts)}
                  {e.fechaFin ? ` - ${new Date(e.fechaFin).toLocaleTimeString(locale, timeOpts)}` : ''}
                </p>
                {e.fotoUrl && (
                  <div className="mt-3 overflow-hidden rounded-lg border bg-muted/30">
                    <ImagenConLightbox
                      src={e.fotoUrl}
                      alt={e.titulo}
                      className="max-h-64 w-full object-contain"
                    />
                  </div>
                )}
                {e.ubicacion && <p className="mt-1 text-sm">📍 {e.ubicacion}</p>}
                {e.descripcion && <p className="mt-3 text-sm text-muted-foreground">{e.descripcion}</p>}
                {e.avisosImportantes && (
                  <div className="mt-3 rounded-md border border-amber-300/40 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <p className="font-medium">{t('importantNotices')}</p>
                    <p className="mt-1 whitespace-pre-line">{e.avisosImportantes}</p>
                  </div>
                )}
                {(e.inicioLat != null &&
                  e.inicioLng != null &&
                  Array.isArray(e.paradas) &&
                  e.paradas.length > 0) && (
                  <div className="mt-3">
                    <EventoRecorridoMap
                      inicioLat={e.inicioLat}
                      inicioLng={e.inicioLng}
                      finLat={e.finLat}
                      finLng={e.finLng}
                      paradas={e.paradas}
                    />
                  </div>
                )}
                {e.youtubeUrl && (
                  <div className="mt-4 border-t pt-4">
                    <p className="mb-2 text-sm font-medium">{t('previousYearsVideo')}</p>
                    <YoutubeEmbed url={e.youtubeUrl} title={t('previousYearsVideoTitle', { title: e.titulo })} />
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
