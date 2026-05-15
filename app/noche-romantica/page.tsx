import type { Metadata } from 'next';
import { cache } from 'react';
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { getApiUrl } from '@/lib/api';
import {
  getCanonicalUrl,
  getDefaultOgImage,
  getLocaleAlternates,
  getOGLocale,
  seoDescription,
  seoTitle,
  type SupportedLocale,
} from '@/lib/seo';
import CountdownBeso from './CountdownBeso';

export const revalidate = 60;
interface NRConfig {
  edicion: number;
  anio: number;
  fechaEvento: string | null;
  titulo: string;
  subtitulo: string | null;
  descripcion1Titulo: string | null;
  descripcion1Texto: string | null;
  descripcion2Titulo: string | null;
  descripcion2Texto: string | null;
  logoUrl: string | null;
  heroImageUrl: string | null;
  videoUrl: string | null;
  videoTipo: 'YOUTUBE' | 'R2';
  activo: boolean;
}

const LANDING_TITLE: Record<string, string> = {
  es: 'La Noche Romántica en los pueblos más bonitos de España',
  en: 'La Noche Romántica in the most beautiful villages of Spain',
  fr: 'La Noche Romántica dans les plus beaux villages d’Espagne',
  de: 'La Noche Romántica in den schönsten Dörfern Spaniens',
  pt: 'La Noche Romántica nas aldeias mais bonitas de Espanha',
  it: 'La Noche Romántica nei borghi più belli di Spagna',
  ca: 'La Noche Romántica als pobles més bonics d’Espanya',
};

const LANDING_DESC: Record<string, string> = {
  es: 'Descubre La Noche Romántica: una velada mágica en los pueblos más bonitos de España con cenas, actividades, música y experiencias únicas para parejas.',
  en: 'Discover La Noche Romántica: a magical evening in the most beautiful villages of Spain with dinners, activities, music and unique experiences for couples.',
  fr: 'Découvrez La Noche Romántica : une soirée magique dans les plus beaux villages d’Espagne avec dîners, activités, musique et expériences uniques pour les couples.',
  de: 'Entdecke La Noche Romántica: ein magischer Abend in den schönsten Dörfern Spaniens mit Abendessen, Aktivitäten, Musik und einzigartigen Erlebnissen für Paare.',
  pt: 'Descobre La Noche Romántica: uma noite mágica nas aldeias mais bonitas de Espanha com jantares, atividades, música e experiências únicas para casais.',
  it: 'Scopri La Noche Romántica: una serata magica nei borghi più belli di Spagna con cene, attività, musica ed esperienze uniche per le coppie.',
  ca: 'Descobreix La Noche Romántica: una vetllada màgica als pobles més bonics d’Espanya amb sopars, activitats, música i experiències úniques per a parelles.',
};

const fetchConfigCached = cache(async (locale: string): Promise<NRConfig | null> => {
  try {
    const API_BASE = getApiUrl();
    const url =
      locale && locale !== 'es'
        ? `${API_BASE}/noche-romantica/config?lang=${locale}`
        : `${API_BASE}/noche-romantica/config`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const config = await fetchConfigCached(locale);
  const path = '/noche-romantica';
  const baseTitle = config?.titulo?.trim() || (LANDING_TITLE[locale] ?? LANDING_TITLE.es);
  const titleWithEdition = config?.edicion
    ? `${baseTitle} · ${config.edicion}ª edición ${config.anio ?? ''}`.trim()
    : baseTitle;
  const title = seoTitle(titleWithEdition);
  const description = seoDescription(
    config?.subtitulo?.trim() ||
      config?.descripcion1Texto?.trim() ||
      (LANDING_DESC[locale] ?? LANDING_DESC.es),
  );
  const heroImage = config?.heroImageUrl?.trim() || config?.logoUrl?.trim() || getDefaultOgImage();
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale),
      locale: getOGLocale(locale),
      type: 'website',
      images: [{ url: heroImage, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [heroImage],
    },
    robots: { index: true, follow: true },
  };
}

function formatFechaEvento(fecha: string | null, edicion: number, editionLabel: string): string {
  if (fecha) {
    const d = new Date(fecha + 'T00:00:00');
    const formatted = d.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return `${edicion}ª ${editionLabel} · ${formatted.charAt(0).toUpperCase() + formatted.slice(1)}`;
  }
  return `${edicion}ª ${editionLabel}`;
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // youtube.com/watch?v=ID
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
    }
    // youtu.be/ID
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    // already embed
    if (url.includes('/embed/')) return url;
    return null;
  } catch {
    return null;
  }
}

export default async function NocheRomanticaPage() {
  const t = await getTranslations('nocheRomantica');
  const locale = await getLocale();
  const config = await fetchConfigCached(locale);

  if (!config) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-4 text-muted-foreground">{t('comingSoon')}</p>
      </main>
    );
  }

  const embedUrl = config.videoUrl
    ? config.videoTipo === 'YOUTUBE'
      ? getYouTubeEmbedUrl(config.videoUrl)
      : config.videoUrl
    : null;

  // Logo del evento: usa el configurable desde admin si existe, y si no
  // recurre al logo oficial estático que vive en /public/eventos/.
  const eventoLogoSrc = config.logoUrl?.trim() || '/eventos/noche-romantica.png';

  return (
    <main>
      {/* Logo */}
      <div className="flex justify-center py-8 bg-white dark:bg-neutral-900 min-h-[128px] md:min-h-[176px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={eventoLogoSrc}
          alt={config.titulo || 'La Noche Romántica'}
          width={320}
          height={128}
          fetchPriority="high"
          decoding="sync"
          className="h-24 md:h-32 w-auto object-contain"
        />
      </div>

      {/* Hero */}
      {config.heroImageUrl && (
        <section className="relative w-full h-[50vh] md:h-[60vh] max-h-[70vh] overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config.heroImageUrl}
            alt={`${config.titulo} - ${t('edition')} ${config.edicion}`}
            className="h-full w-full object-cover"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white text-center">
            <h1 className="text-3xl md:text-5xl font-bold drop-shadow-lg">
              {config.titulo}
            </h1>
            {config.subtitulo && (
              <p className="mt-2 text-lg md:text-xl drop-shadow-md">
                {config.subtitulo}
              </p>
            )}
            <p className="mt-1 text-sm md:text-base drop-shadow-md opacity-90">
              {formatFechaEvento(config.fechaEvento, config.edicion, t('edition'))}
            </p>
            <CountdownBeso fechaEvento={config.fechaEvento} light />
          </div>
        </section>
      )}

      {/* Si no hay hero, titulo simple */}
      {!config.heroImageUrl && (
        <section className="bg-gradient-to-b from-rose-50 to-white py-16 text-center dark:from-rose-950/40 dark:to-neutral-900">
          <h1 className="text-4xl md:text-5xl font-bold text-rose-800">
            {config.titulo}
          </h1>
          {config.subtitulo && (
            <p className="mt-3 text-lg text-rose-600">{config.subtitulo}</p>
          )}
          <p className="mt-2 text-muted-foreground">
            {formatFechaEvento(config.fechaEvento, config.edicion, t('edition'))}
          </p>
          <div className="mt-4">
            <CountdownBeso fechaEvento={config.fechaEvento} />
          </div>
        </section>
      )}

      {/* Botón Pueblos Participantes */}
      <div className="flex justify-center py-10">
        <Link
          href="/noche-romantica/pueblos-participantes"
          className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-rose-700 hover:shadow-xl"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          {t('pueblosParticipantes')}
        </Link>
      </div>

      {/* Descripción 1 */}
      {(config.descripcion1Titulo || config.descripcion1Texto) && (
        <section className="mx-auto max-w-4xl px-4 py-12">
          {config.descripcion1Titulo && (
            <h2 className="mb-4 text-2xl md:text-3xl font-bold text-center text-gray-800 dark:text-neutral-100">
              {config.descripcion1Titulo}
            </h2>
          )}
          {config.descripcion1Texto && (
            <p className="text-lg text-gray-600 leading-relaxed text-center max-w-3xl mx-auto whitespace-pre-line">
              {config.descripcion1Texto}
            </p>
          )}
        </section>
      )}

      {/* Descripción 2 */}
      {(config.descripcion2Titulo || config.descripcion2Texto) && (
        <section className="bg-rose-50 py-12 dark:bg-rose-950/30">
          <div className="mx-auto max-w-4xl px-4">
            {config.descripcion2Titulo && (
            <h2 className="mb-4 text-2xl md:text-3xl font-bold text-center text-gray-800 dark:text-neutral-100">
              {config.descripcion2Titulo}
              </h2>
            )}
            {config.descripcion2Texto && (
              <p className="text-lg text-gray-600 leading-relaxed text-center max-w-3xl mx-auto whitespace-pre-line">
                {config.descripcion2Texto}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Video */}
      {embedUrl && (
        <section className="w-full bg-black">
          {config.videoTipo === 'YOUTUBE' ? (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={embedUrl}
                title={t('videoTitle')}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <video
              src={embedUrl}
              controls
              className="w-full max-h-[80vh]"
              playsInline
            />
          )}
        </section>
      )}
    </main>
  );
}
