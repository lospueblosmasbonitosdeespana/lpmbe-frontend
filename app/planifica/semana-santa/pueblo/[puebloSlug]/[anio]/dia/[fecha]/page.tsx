import type { Metadata } from 'next';
import { cache } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import { getLocale, getTranslations } from 'next-intl/server';
import {
  getCanonicalUrl,
  getDefaultOgImage,
  getLocaleAlternates,
  getOGLocale,
  seoDescription,
  seoTitle,
  slugToTitle,
  type SupportedLocale,
} from '@/lib/seo';
import ShareButton from '@/app/components/ShareButton';
import EventoRecorridoMap from '../../../EventoRecorridoMap';
import ImagenConLightbox from '../../../ImagenConLightbox';
import YoutubeEmbed from '../../../YoutubeEmbed';
import { translateHolyWeekDayLabel } from '../../../day-labels';

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
  googleMapsUrl?: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  fotoUrl: string | null;
  youtubeUrl?: string | null;
  esFiestaInteresTuristico?: boolean;
};

type Dia = {
  id: number;
  fecha: string;
  nombreDia: string;
  titulo: string | null;
  descripcion: string | null;
  fotoUrl: string | null;
  slug: string;
};

type Payload = {
  participa: true;
  anio: number;
  esEdicionActiva: boolean;
  participante: {
    pueblo: { nombre: string; slug: string; foto_destacada?: string | null };
    cartelHorizontalUrl?: string | null;
    cartelVerticalUrl?: string | null;
    agenda: Agenda[];
    dias: Dia[];
  };
};

const fetchData = cache(
  async (slug: string, anio: number, locale: string): Promise<Payload | null> => {
    const API = getApiUrl();
    const lang = encodeURIComponent(locale);
    try {
      const res = await fetch(`${API}/semana-santa/pueblos/${slug}/${anio}?lang=${lang}`);
      if (!res.ok) return null;
      return (await res.json()) as Payload;
    } catch {
      return null;
    }
  },
);

function parseAnio(raw: string): number | null {
  if (!/^\d{4}$/.test(raw)) return null;
  const n = parseInt(raw, 10);
  if (n < 2000 || n > 2100) return null;
  return n;
}

function isDateFormat(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function findDay(dias: Dia[], param: string): Dia | undefined {
  if (isDateFormat(param)) return dias.find((d) => d.fecha === param);
  return dias.find((d) => d.slug === param);
}

export const revalidate = 60;

function safeDateLabel(isoDate: string | null | undefined, locale: string): string {
  if (!isoDate) return '';
  const dt = new Date(isoDate);
  if (Number.isNaN(dt.getTime())) return String(isoDate);
  try {
    return dt.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(isoDate);
  }
}

function safeTimeLabel(isoDateTime: string | null | undefined, locale: string): string {
  if (!isoDateTime) return '';
  const dt = new Date(isoDateTime);
  if (Number.isNaN(dt.getTime())) return '';
  try {
    return dt.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Madrid',
    });
  } catch {
    return '';
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ puebloSlug: string; anio: string; fecha: string }>;
}): Promise<Metadata> {
  const { puebloSlug, anio: anioRaw, fecha } = await params;
  const anio = parseAnio(anioRaw);
  if (!anio) return { robots: { index: false, follow: false } };
  const locale = (await getLocale()) as SupportedLocale;
  const tSeo = await getTranslations('seo');
  const data = await fetchData(puebloSlug, anio, locale);
  const nameFallback = slugToTitle(puebloSlug);
  const day = data ? findDay(data.participante.dias, fecha) : undefined;
  const hasDayData = Boolean(day);
  const puebloName = data?.participante.pueblo.nombre ?? nameFallback;
  const canonicalSlug = day?.slug ?? fecha;
  const path = `/planifica/semana-santa/pueblo/${puebloSlug}/${anio}/dia/${canonicalSlug}`;
  const shortPath = `/planifica/semana-santa/pueblo/${puebloSlug}/dia/${canonicalSlug}`;
  const dateLabel = day != null ? safeDateLabel(day.fecha, locale) : fecha;
  const title = hasDayData
    ? seoTitle(tSeo('semanaSantaDiaTitle', { nombre: puebloName, fecha: dateLabel }))
    : seoTitle(tSeo('semanaSantaTitle', { nombre: puebloName }));
  const description = hasDayData
    ? seoDescription(
        day?.descripcion?.trim() ||
          tSeo('semanaSantaDiaDesc', { nombre: puebloName, fecha: dateLabel }),
      )
    : seoDescription(tSeo('semanaSantaDesc', { nombre: puebloName }));
  const ogImage = hasDayData
    ? day?.fotoUrl?.trim() ||
      data?.participante?.cartelHorizontalUrl?.trim() ||
      data?.participante?.pueblo?.foto_destacada?.trim() ||
      data?.participante?.cartelVerticalUrl?.trim() ||
      getDefaultOgImage()
    : getDefaultOgImage();

  // Edición activa → canonical a URL corta (sin año). Archivo → canonical a sí misma.
  const isActive = data?.esEdicionActiva ?? false;
  const canonical = getCanonicalUrl(isActive ? shortPath : path, locale);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: getLocaleAlternates(isActive ? shortPath : path),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      locale: getOGLocale(locale),
      type: hasDayData ? 'article' : 'website',
      images: [{ url: ogImage, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: { index: hasDayData && !isActive, follow: true },
  };
}

export default async function SemanaSantaDiaAnioPage({
  params,
}: {
  params: Promise<{ puebloSlug: string; anio: string; fecha: string }>;
}) {
  const { puebloSlug, anio: anioRaw, fecha } = await params;
  const anio = parseAnio(anioRaw);
  if (!anio) notFound();
  const locale = await getLocale();
  const t = await getTranslations('planifica.semanaSanta');
  const data = await fetchData(puebloSlug, anio, locale);
  if (!data) return notFound();

  const day = findDay(data.participante.dias, fecha);
  if (!day) return notFound();

  if (isDateFormat(fecha) && day.slug) {
    redirect(`/planifica/semana-santa/pueblo/${puebloSlug}/${anio}/dia/${day.slug}`);
  }

  const agenda = Array.isArray(data.participante.agenda) ? data.participante.agenda : [];
  const eventos = agenda.filter((a) => {
    const inicio = typeof a?.fechaInicio === 'string' ? a.fechaInicio : '';
    return inicio.slice(0, 10) === day.fecha;
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href={`/planifica/semana-santa/pueblo/${puebloSlug}/${anio}`} className="text-sm text-muted-foreground hover:underline">
        {t('backToVillageHolyWeek')}
      </Link>

      <header className="mt-4 rounded-xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          {data.participante.pueblo.nombre} · Semana Santa {anio}
          {!data.esEdicionActiva && (
            <span className="ml-2 inline-block rounded-full border border-amber-300/60 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">
              archivo
            </span>
          )}
        </p>
        <h1 className="font-serif text-3xl font-medium">
          {translateHolyWeekDayLabel(day.titulo || day.nombreDia, t)}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{safeDateLabel(day.fecha, locale)}</p>
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
                    url={`/planifica/semana-santa/pueblo/${puebloSlug}/${anio}/dia/${day.slug}`}
                    title={e.titulo}
                    variant="icon"
                    className="rounded-full border bg-card"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {safeTimeLabel(e.fechaInicio, locale)}
                  {e.fechaFin ? ` - ${safeTimeLabel(e.fechaFin, locale)}` : ''}
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
                {e.ubicacion && <p className="mt-1 text-sm">{e.ubicacion}</p>}
                {e.descripcion && <p className="mt-3 text-sm text-muted-foreground">{e.descripcion}</p>}
                {e.avisosImportantes && (
                  <div className="mt-3 rounded-md border border-amber-300/40 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <p className="font-medium">{t('importantNotices')}</p>
                    <p className="mt-1 whitespace-pre-line">{e.avisosImportantes}</p>
                  </div>
                )}
                {e.googleMapsUrl ? (
                  <div className="mt-3 overflow-hidden rounded-lg border">
                    <iframe
                      src={e.googleMapsUrl.replace(/\/edit\?/, '/embed?').replace(/\/view\?/, '/embed?')}
                      className="h-72 w-full md:h-80"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                ) : (e.inicioLat != null &&
                  e.inicioLng != null &&
                  Array.isArray(e.paradas) &&
                  e.paradas.length > 0) ? (
                  <div className="mt-3">
                    <EventoRecorridoMap
                      inicioLat={e.inicioLat}
                      inicioLng={e.inicioLng}
                      finLat={e.finLat}
                      finLng={e.finLng}
                      paradas={e.paradas}
                    />
                  </div>
                ) : null}
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
