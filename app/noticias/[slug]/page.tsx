import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import BackButton from '@/app/c/[slug]/BackButton';
import ShareButton from '@/app/components/ShareButton';
import { formatDateTimeEs } from '@/app/_lib/dates';
import { getApiUrl } from '@/lib/api';

const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'de', 'pt', 'it'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function isHtmlContent(content: string): boolean {
  const trimmed = content.trimStart();
  return trimmed.startsWith('<') && /<[a-z][\s\S]*>/i.test(trimmed);
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Noticia = {
  id: number;
  titulo: string;
  slug: string;
  resumen?: string;
  contenido?: string;
  coverUrl?: string;
  tipo: string;
  createdAt?: string;
};

async function fetchNoticia(slug: string): Promise<Noticia | null> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value;
  const lang = locale && SUPPORTED_LOCALES.includes(locale as SupportedLocale) ? locale : 'es';

  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/public/noticias/${encodeURIComponent(slug)}?lang=${lang}`, {
    cache: 'no-store',
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
  const noticia = await fetchNoticia(slug);

  if (!noticia) {
    return { title: 'Noticia no encontrada | Los Pueblos Más Bonitos de España' };
  }

  const description = noticia.resumen ?? '';

  return {
    title: `${noticia.titulo} | Los Pueblos Más Bonitos de España`,
    description: description || undefined,
    openGraph: {
      title: noticia.titulo,
      description: description || undefined,
      images: noticia.coverUrl ? [{ url: noticia.coverUrl }] : [],
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

  if (!noticia) notFound();

  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'es';
  const fechaFormateada = noticia.createdAt ? formatDateTimeEs(noticia.createdAt, locale) : '';

  return (
    <main style={{ padding: '40px 20px' }}>
      <article>
        {noticia.coverUrl && noticia.coverUrl.trim() && (
          <div style={{ maxWidth: '1200px', margin: '0 auto 48px', overflow: 'hidden', borderRadius: '8px' }}>
            <img
              src={noticia.coverUrl.trim()}
              alt={noticia.titulo}
              style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}

        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 20px' }}>
          <header style={{ marginBottom: '40px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
              Noticia
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
              <h1 style={{ fontSize: '36px', fontWeight: 700, lineHeight: '1.2', margin: 0, color: '#111', flex: 1, minWidth: 0 }}>
                {noticia.titulo}
              </h1>
              <ShareButton url={`/noticias/${slug}`} title={noticia.titulo} variant="button" />
            </div>

            {fechaFormateada && (
              <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                {fechaFormateada}
              </p>
            )}

            {noticia.resumen && (
              <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#444', marginTop: '24px', fontWeight: 400 }}>
                {noticia.resumen}
              </p>
            )}
          </header>

          {noticia.contenido && (
            <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#333' }} className="prose-contenido">
              {isHtmlContent(noticia.contenido) ? (
                <div dangerouslySetInnerHTML={{ __html: noticia.contenido }} />
              ) : (
                <ReactMarkdown>{noticia.contenido}</ReactMarkdown>
              )}
            </div>
          )}

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
