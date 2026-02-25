import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import BackButton from '@/app/c/[slug]/BackButton';
import ShareButton from '@/app/components/ShareButton';
import { formatEventoRangeEs, formatDateTimeEs } from '@/app/_lib/dates';
import { getApiUrl } from '@/lib/api';
import SmartCoverImage from '@/app/components/SmartCoverImage';

const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'de', 'pt', 'it'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function isHtmlContent(content: string): boolean {
  const trimmed = content.trimStart();
  return trimmed.startsWith('<') && /<[a-z][\s\S]*>/i.test(trimmed);
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
};

async function fetchEvento(slug: string): Promise<Evento | null> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value;
  const lang = locale && SUPPORTED_LOCALES.includes(locale as SupportedLocale) ? locale : 'es';

  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/public/eventos/${encodeURIComponent(slug)}?lang=${lang}`, {
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
  const evento = await fetchEvento(slug);

  if (!evento) {
    return { title: 'Evento no encontrado | Los Pueblos Más Bonitos de España' };
  }

  const description = evento.resumen ?? '';

  return {
    title: `${evento.titulo} | Los Pueblos Más Bonitos de España`,
    description: description || undefined,
    openGraph: {
      title: evento.titulo,
      description: description || undefined,
      images: evento.coverUrl ? [{ url: evento.coverUrl }] : [],
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

  if (!evento) notFound();

  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'es';
  const fechaFormateada = evento.createdAt ? formatDateTimeEs(evento.createdAt, locale) : '';

  return (
    <main style={{ padding: '40px 20px' }}>
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
                <strong>Evento:</strong> {formatEventoRangeEs(evento.fechaInicio, evento.fechaFin, locale)}
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
                <div dangerouslySetInnerHTML={{ __html: texto }} />
              ) : (
                <ReactMarkdown>{texto}</ReactMarkdown>
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
