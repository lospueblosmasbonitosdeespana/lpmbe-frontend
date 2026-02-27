import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import BackButton from './BackButton';
import ShareButton from '@/app/components/ShareButton';
import { formatEventoRangeEs, formatDateTimeEs } from '@/app/_lib/dates';
import { getApiUrl } from '@/lib/api';
import { getCanonicalUrl, getLocaleAlternates } from '@/lib/seo';
import SmartCoverImage from '@/app/components/SmartCoverImage';

const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'de', 'pt', 'it'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function isHtmlContent(content: string): boolean {
  const trimmed = content.trimStart();
  return trimmed.startsWith('<') && /<[a-z][\s\S]*>/i.test(trimmed);
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Contenido = {
  id: number;
  titulo: string;
  slug: string;
  resumen?: string;
  contenidoMd?: string;
  coverUrl?: string;
  tipo: string;
  estado: string;
  publishedAt?: string;
  createdAt?: string;
  fechaInicio?: string;
  fechaFin?: string;
};

async function fetchContenido(slug: string): Promise<Contenido | null> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value;
  const lang = locale && SUPPORTED_LOCALES.includes(locale as SupportedLocale) ? locale : 'es';

  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/public/contenidos/${slug}?lang=${lang}`, {
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
  const contenido = await fetchContenido(slug);

  if (!contenido) {
    return {
      title: 'Contenido no encontrado | Los Pueblos Más Bonitos de España',
    };
  }

  // Generar descripción: resumen o primeros 160 chars del markdown
  let description = contenido.resumen ?? '';
  if (!description && contenido.contenidoMd) {
    const plainText = contenido.contenidoMd
      .replace(/[#*\[\]()]/g, '') // Quitar símbolos markdown
      .replace(/\n+/g, ' ')
      .trim();
    description = plainText.slice(0, 160);
    if (plainText.length > 160) description += '...';
  }

  const path = `/c/${slug}`;
  return {
    title: `${contenido.titulo} | Los Pueblos Más Bonitos de España`,
    description: description || undefined,
    alternates: {
      canonical: getCanonicalUrl(path),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title: contenido.titulo,
      description: description || undefined,
      url: getCanonicalUrl(path),
      images: contenido.coverUrl ? [{ url: contenido.coverUrl }] : [],
    },
    twitter: {
      card: contenido.coverUrl ? 'summary_large_image' : 'summary',
      title: contenido.titulo,
      description: description || undefined,
    },
  };
}

export default async function ContenidoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const contenido = await fetchContenido(slug);

  if (!contenido) {
    notFound();
  }

  // Leer locale para formateo de fechas
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'es';

  // Determinar fecha de publicación
  const fechaPublicacion = contenido.publishedAt ?? contenido.createdAt;
  const fechaPublicacionFormateada = fechaPublicacion ? formatDateTimeEs(fechaPublicacion, locale) : '';

  // Formatear fechas del evento si es EVENTO
  const esEvento = contenido.tipo === 'EVENTO';
  const fechaInicioEvento = esEvento ? contenido.fechaInicio : null;

  // Texto del badge según tipo
  const tipoBadge: Record<string, string> = {
    EVENTO: 'Evento',
    NOTICIA: 'Noticia',
    ARTICULO: 'Artículo',
    PAGINA: 'Página',
  };

  return (
    <main className="px-5 py-10 md:py-[40px]">
      <article>
        {contenido.coverUrl && contenido.coverUrl.trim() && (
          <SmartCoverImage src={contenido.coverUrl.trim()} alt={contenido.titulo} />
        )}

        <div className="max-w-[720px] mx-auto px-5">
          <header className="mb-10">
            <div className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide mb-4">
              {tipoBadge[contenido.tipo] || contenido.tipo}
            </div>

            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-3xl md:text-4xl font-bold leading-tight m-0 text-foreground flex-1 min-w-0">
                {contenido.titulo}
              </h1>
              <ShareButton url={`/c/${slug}`} title={contenido.titulo} variant="button" />
            </div>

            {fechaPublicacionFormateada && (
              <p className="text-sm text-muted-foreground mt-2">
                {fechaPublicacionFormateada}
              </p>
            )}

            {esEvento && fechaInicioEvento && (
              <p className="text-base text-foreground mt-4 font-medium py-3 px-4 bg-primary/10 dark:bg-primary/20 border-l-4 border-primary rounded-r">
                <strong>Evento:</strong> {formatEventoRangeEs(fechaInicioEvento, contenido.fechaFin, locale)}
              </p>
            )}
          </header>

          {contenido.contenidoMd && (
            <div className="prose-contenido text-base leading-relaxed text-foreground">
              {isHtmlContent(contenido.contenidoMd) ? (
                <div dangerouslySetInnerHTML={{ __html: contenido.contenidoMd }} />
              ) : (
                <ReactMarkdown>{contenido.contenidoMd}</ReactMarkdown>
              )}
            </div>
          )}

          <div className="mt-14 pt-6 border-t border-border">
            <BackButton />
          </div>
        </div>
      </article>

      <style>{`
        .link-volver {
          font-size: 14px;
          text-decoration: none;
          color: var(--muted-foreground);
        }
        .link-volver:hover { text-decoration: underline; }

        .prose-contenido p { margin-bottom: 20px; }
        .prose-contenido h2 {
          font-size: 24px;
          font-weight: 600;
          margin-top: 32px;
          margin-bottom: 16px;
        }
        .prose-contenido h3 {
          font-size: 20px;
          font-weight: 600;
          margin-top: 24px;
          margin-bottom: 12px;
        }
        .prose-contenido ul, .prose-contenido ol {
          margin-bottom: 20px;
          padding-left: 24px;
        }
        .prose-contenido li { margin-bottom: 8px; }
        .prose-contenido img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 24px 0;
        }
        .prose-contenido blockquote {
          border-left: 3px solid var(--border);
          padding-left: 16px;
          margin: 24px 0;
          color: var(--muted-foreground);
          font-style: italic;
        }
        .prose-contenido code {
          background-color: var(--muted);
          color: var(--foreground);
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 14px;
        }
        .prose-contenido pre {
          background-color: var(--muted);
          color: var(--foreground);
          padding: 16px;
          border-radius: 4px;
          overflow-x: auto;
          margin: 24px 0;
        }
        .prose-contenido a {
          color: var(--primary);
          text-decoration: none;
        }
        .prose-contenido a:hover { text-decoration: underline; }
      `}</style>
    </main>
  );
}
