import { cache } from 'react';
import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import { getLocale, getTranslations } from 'next-intl/server';
import BackButton from '@/app/c/[slug]/BackButton';
import ShareButton from '@/app/components/ShareButton';
import { formatDateTimeEs } from '@/app/_lib/dates';
import { getApiUrl } from '@/lib/api';
import { getBaseUrl, getCanonicalUrl, getLocaleAlternates, getOGLocale, seoTitle, seoDescription, type SupportedLocale } from '@/lib/seo';
import JsonLd from '@/app/components/seo/JsonLd';
import SmartCoverImage from '@/app/components/SmartCoverImage';
import SafeHtml from '@/app/_components/ui/SafeHtml';

const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'de', 'pt', 'it', 'ca'] as const;

function isHtmlContent(content: string): boolean {
  const trimmed = content.trimStart();
  return trimmed.startsWith('<') && /<[a-z][\s\S]*>/i.test(trimmed);
}

export const revalidate = 60;
type Noticia = {
  id: number;
  titulo: string;
  slug: string;
  resumen?: string;
  contenido?: string;
  coverUrl?: string;
  tipo: string;
  createdAt?: string;
  publishedAt?: string;
};

const PUBLISHER_ORGANIZATION = {
  '@type': 'Organization',
  name: 'Los Pueblos Más Bonitos de España',
  url: 'https://lospueblosmasbonitosdeespana.org',
  logo: {
    '@type': 'ImageObject',
    url: 'https://lospueblosmasbonitosdeespana.org/images/logo-lpbme.png',
  },
} as const;

function descriptionForNewsArticle(noticia: Noticia): string | undefined {
  const resumen = noticia.resumen?.trim();
  if (resumen) return seoDescription(resumen, 155);
  const body = noticia.contenido?.trim();
  if (!body) return undefined;
  const plain = body
    .replace(/<[^>]+>/g, '')
    .replace(/[#*`\[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return undefined;
  return plain.length <= 155 ? plain : `${plain.slice(0, 152).trimEnd()}…`;
}

function newsArticleJsonLd(
  noticia: Noticia & { updatedAt?: string },
  canonicalUrl: string,
  lang: string,
): Record<string, unknown> {
  const datePublished = noticia.publishedAt ?? noticia.createdAt;
  const dateModified = noticia.updatedAt ?? datePublished;
  const description = descriptionForNewsArticle(noticia);
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: noticia.titulo,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    publisher: PUBLISHER_ORGANIZATION,
    author: PUBLISHER_ORGANIZATION,
    inLanguage: lang,
  };
  if (datePublished) data.datePublished = datePublished;
  if (dateModified) data.dateModified = dateModified;
  if (description) data.description = description;
  if (noticia.coverUrl) data.image = [noticia.coverUrl];
  return data;
}

function breadcrumbLdNoticia(titulo: string, canonicalUrl: string, baseUrl: string): Record<string, unknown> {
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

/**
 * Fetch de la noticia deduplicado con React `cache()`: `generateMetadata` y la
 * página comparten el mismo resultado, evitando 2 llamadas (y por tanto 2× 404
 * en el log del backend cuando el slug no existe).
 */
const fetchNoticia = cache(async (slug: string): Promise<Noticia | null> => {
  const locale = await getLocale();
  const lang = SUPPORTED_LOCALES.includes(locale as SupportedLocale) ? (locale as SupportedLocale) : 'es';

  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/public/noticias/${encodeURIComponent(slug)}?lang=${lang}`, {
    headers: { 'Accept-Language': lang },
  });

  if (!res.ok) return null;
  return res.json();
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const lang = SUPPORTED_LOCALES.includes(locale as SupportedLocale) ? (locale as SupportedLocale) : 'es';
  const noticia = await fetchNoticia(slug);

  if (!noticia) {
    const tSeo = await getTranslations('seo');
    return { title: tSeo('noticiaNotFound') };
  }

  const description = noticia.resumen ? seoDescription(noticia.resumen, 160) : undefined;

  // Path sin barra final; canonical absoluta única para que Google no elija otra variante.
  const path = `/noticias/${String(slug).replace(/\/$/, '')}`;
  const canonicalUrl = getCanonicalUrl(path, lang);
  const title = seoTitle(noticia.titulo);
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      locale: getOGLocale(lang as SupportedLocale),
      images: noticia.coverUrl ? [{ url: noticia.coverUrl }] : [],
    },
    twitter: {
      card: noticia.coverUrl ? 'summary_large_image' : 'summary',
      title,
      description,
    },
  };
}

export default async function NoticiaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const noticia = await fetchNoticia(slug);

  if (!noticia) permanentRedirect('/actualidad');

  const locale = await getLocale();
  const lang = SUPPORTED_LOCALES.includes(locale as SupportedLocale) ? (locale as SupportedLocale) : 'es';
  const fechaFormateada = noticia.createdAt ? formatDateTimeEs(noticia.createdAt, lang) : '';
  const base = getBaseUrl();
  const canonicalUrl = `${base}/noticias/${slug}`;

  return (
    <main style={{ padding: '40px 20px' }}>
      <JsonLd data={newsArticleJsonLd(noticia, canonicalUrl, lang)} />
      <JsonLd data={breadcrumbLdNoticia(noticia.titulo, canonicalUrl, base)} />
      <article>
        {noticia.coverUrl && noticia.coverUrl.trim() && (
          <SmartCoverImage src={noticia.coverUrl.trim()} alt={noticia.titulo} />
        )}

        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 20px' }}>
          <header style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Noticia
              </div>
              <ShareButton url={`/noticias/${slug}`} title={noticia.titulo} variant="button" />
            </div>

            <h1 style={{ fontSize: '36px', fontWeight: 700, lineHeight: '1.2', margin: 0, color: '#111' }}>
              {noticia.titulo}
            </h1>

            {fechaFormateada && (
              <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                {fechaFormateada}
              </p>
            )}

          </header>

          {/* Mostrar contenido principal. Si contenido está vacío, usar resumen como fallback */}
          {(() => {
            const texto = noticia.contenido?.trim() || noticia.resumen?.trim() || '';
            if (!texto) return null;
            return (
              <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#333' }} className="prose-contenido">
                {isHtmlContent(texto) ? (
                  <SafeHtml html={texto} altFallback={noticia.titulo} />
                ) : (
                  <ReactMarkdown
                    components={{
                      img: ({ alt, ...props }) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img {...props} alt={alt?.trim() || noticia.titulo} />
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
