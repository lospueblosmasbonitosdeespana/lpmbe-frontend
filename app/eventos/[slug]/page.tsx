import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import { getLocale, getTranslations } from 'next-intl/server';
import BackButton from '@/app/c/[slug]/BackButton';
import ShareButton from '@/app/components/ShareButton';
import { formatEventoRangeEs, formatDateTimeEs } from '@/app/_lib/dates';
import { getApiUrl } from '@/lib/api';
import { getBaseUrl, getCanonicalUrl, getLocaleAlternates, getOGLocale, seoDescription, seoTitle, type SupportedLocale } from '@/lib/seo';
import JsonLd from '@/app/components/seo/JsonLd';
import SmartCoverImage from '@/app/components/SmartCoverImage';
import SafeHtml from '@/app/_components/ui/SafeHtml';

const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'de', 'pt', 'it', 'ca'] as const;

function isHtmlContent(content: string): boolean {
  const trimmed = content.trimStart();
  return trimmed.startsWith('<') && /<[a-z][\s\S]*>/i.test(trimmed);
}

export const revalidate = 60;
type Evento = {
  id: number;
  titulo: string;
  slug: string;
  resumen?: string;
  contenido?: string;
  coverUrl?: string;
  tipo: string;
  fechaInicio?: string;
  fechaFin?: string;
  createdAt?: string;
  pueblo?: { nombre: string; provincia?: string; comunidad?: string } | null;
};

const PUBLISHER_ORGANIZATION = {
  '@type': 'Organization',
  name: 'Los Pueblos Más Bonitos de España',
  url: 'https://lospueblosmasbonitosdeespana.org',
} as const;

function descriptionForEvent(evento: Evento): string | undefined {
  const resumen = evento.resumen?.trim();
  if (resumen) return seoDescription(resumen, 155);
  const body = evento.contenido?.trim();
  if (!body) return undefined;
  const plain = body
    .replace(/<[^>]+>/g, '')
    .replace(/[#*`\[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return undefined;
  return plain.length <= 155 ? plain : `${plain.slice(0, 152).trimEnd()}…`;
}

function buildLocation(pueblo?: { nombre: string; provincia?: string; comunidad?: string } | null): Record<string, unknown> {
  if (pueblo?.nombre) {
    return {
      '@type': 'Place',
      name: pueblo.nombre,
      address: {
        '@type': 'PostalAddress',
        addressLocality: pueblo.nombre,
        ...(pueblo.provincia ? { addressRegion: pueblo.provincia } : {}),
        addressCountry: 'ES',
      },
    };
  }
  return {
    '@type': 'Place',
    name: 'España',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ES',
    },
  };
}

function eventJsonLd(evento: Evento, canonicalUrl: string, lang: string): Record<string, unknown> {
  const description = descriptionForEvent(evento);
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: evento.titulo,
    url: canonicalUrl,
    inLanguage: lang,
    location: buildLocation(evento.pueblo),
    organizer: PUBLISHER_ORGANIZATION,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
  };
  if (evento.fechaInicio) data.startDate = evento.fechaInicio;
  if (evento.fechaFin) data.endDate = evento.fechaFin;
  if (description) data.description = description;
  if (evento.coverUrl) data.image = evento.coverUrl;
  data.offers = {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    url: canonicalUrl,
  };
  return data;
}

function breadcrumbLdEvento(titulo: string, canonicalUrl: string, baseUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Actualidad', item: `${baseUrl}/actualidad` },
      { '@type': 'ListItem', position: 3, name: titulo, item: canonicalUrl },
    ],
  };
}

async function fetchEvento(slug: string): Promise<Evento | null> {
  const locale = await getLocale();
  const lang = SUPPORTED_LOCALES.includes(locale as SupportedLocale) ? (locale as SupportedLocale) : 'es';

  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/public/eventos/${encodeURIComponent(slug)}?lang=${lang}`, {
    headers: { 'Accept-Language': lang },
  });

  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const lang = SUPPORTED_LOCALES.includes(locale as SupportedLocale) ? (locale as SupportedLocale) : 'es';
  const evento = await fetchEvento(slug);

  if (!evento) {
    const tSeo = await getTranslations('seo');
    return { title: tSeo('eventoNotFound') };
  }

  const rawDesc = descriptionForEvent(evento);
  const description = rawDesc ? seoDescription(rawDesc, 160) : undefined;
  const title = seoTitle(evento.titulo);

  const path = `/eventos/${slug}`;
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, lang),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, lang),
      locale: getOGLocale(lang as SupportedLocale),
      type: 'article',
      images: evento.coverUrl ? [{ url: evento.coverUrl }] : [],
    },
    twitter: {
      card: evento.coverUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(evento.coverUrl ? { images: [evento.coverUrl] } : {}),
    },
  };
}

export default async function EventoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const evento = await fetchEvento(slug);

  if (!evento) permanentRedirect('/actualidad');

  const locale = await getLocale();
  const lang = SUPPORTED_LOCALES.includes(locale as SupportedLocale) ? (locale as SupportedLocale) : 'es';
  const fechaFormateada = evento.createdAt ? formatDateTimeEs(evento.createdAt, lang) : '';
  const base = getBaseUrl();
  const canonicalUrl = `${base}/eventos/${slug}`;

  return (
    <main style={{ padding: '40px 20px' }}>
      <JsonLd data={eventJsonLd(evento, canonicalUrl, lang)} />
      <JsonLd data={breadcrumbLdEvento(evento.titulo, canonicalUrl, base)} />
      <article>
        {evento.coverUrl && evento.coverUrl.trim() && (
          <SmartCoverImage src={evento.coverUrl.trim()} alt={evento.titulo} />
        )}

        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 20px' }}>
          <header style={{ marginBottom: '40px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
              Evento
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
              <h1 style={{ fontSize: '36px', fontWeight: 700, lineHeight: '1.2', margin: 0, color: '#111', flex: 1, minWidth: 0 }}>
                {evento.titulo}
              </h1>
              <ShareButton url={`/eventos/${slug}`} title={evento.titulo} variant="button" />
            </div>

            {fechaFormateada && (
              <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                {fechaFormateada}
              </p>
            )}

            {evento.fechaInicio && (
              <p style={{
                fontSize: '16px', color: '#111', marginTop: '16px', fontWeight: 500,
                padding: '12px 16px', backgroundColor: '#f0f9ff', borderLeft: '3px solid #0066cc', borderRadius: '4px',
              }}>
                <strong>Evento:</strong> {formatEventoRangeEs(evento.fechaInicio, evento.fechaFin, lang)}
              </p>
            )}

          </header>

          {/* Mostrar contenido. Si contenido está vacío, usar resumen como fallback */}
          {(() => {
            const texto = evento.contenido?.trim() || evento.resumen?.trim() || '';
            if (!texto) return null;
            return (
            <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#333' }} className="prose-contenido">
              {isHtmlContent(texto) ? (
                <SafeHtml html={texto} altFallback={evento.titulo} />
              ) : (
                <ReactMarkdown
                  components={{
                    img: ({ alt, ...props }) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img {...props} alt={alt?.trim() || evento.titulo} />
                    ),
                  }}
                >
                  {texto}
                </ReactMarkdown>
              )}
            </div>
            );
          })()}

          <div style={{ marginTop: '60px', paddingTop: '24px', borderTop: '1px solid #e5e5e5' }}>
            <BackButton />
          </div>
        </div>
      </article>

      <style>{`
        .prose-contenido p { margin-bottom: 20px; }
        .prose-contenido h2 { font-size: 24px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; color: #111; }
        .prose-contenido h3 { font-size: 20px; font-weight: 600; margin-top: 24px; margin-bottom: 12px; color: #222; }
        .prose-contenido ul, .prose-contenido ol { margin-bottom: 20px; padding-left: 24px; }
        .prose-contenido li { margin-bottom: 8px; }
        .prose-contenido img { max-width: 100%; height: auto; border-radius: 4px; margin: 24px 0; }
        .prose-contenido blockquote { border-left: 3px solid #ddd; padding-left: 16px; margin: 24px 0; color: #555; font-style: italic; }
        .prose-contenido a { color: #0066cc; text-decoration: none; }
        .prose-contenido a:hover { text-decoration: underline; }
      `}</style>
    </main>
  );
}
