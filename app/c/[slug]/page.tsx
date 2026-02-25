import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import BackButton from './BackButton';
import ShareButton from '@/app/components/ShareButton';
import { formatEventoRangeEs, formatDateTimeEs } from '@/app/_lib/dates';
import { getApiUrl } from '@/lib/api';

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

  return {
    title: `${contenido.titulo} | Los Pueblos Más Bonitos de España`,
    description: description || undefined,
    openGraph: {
      title: contenido.titulo,
      description: description || undefined,
      images: contenido.coverUrl ? [{ url: contenido.coverUrl }] : [],
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
    <main style={{ padding: '40px 20px' }}>
      <article>
        {/* IMAGEN DE PORTADA (si existe) */}
        {contenido.coverUrl && contenido.coverUrl.trim() && (
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto 48px',
              overflow: 'hidden',
              borderRadius: '8px',
            }}
          >
            <img
              src={contenido.coverUrl.trim()}
              alt={contenido.titulo}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '500px',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        )}

        {/* CONTENEDOR DE LECTURA */}
        <div
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            padding: '0 20px',
          }}
        >
          {/* HEADER: Badge + Título + Fecha */}
          <header style={{ marginBottom: '40px' }}>
            {/* Badge de tipo */}
            <div
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '16px',
              }}
            >
              {tipoBadge[contenido.tipo] || contenido.tipo}
            </div>

            {/* Título + Compartir */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
              <h1
                style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  lineHeight: '1.2',
                  margin: 0,
                  color: '#111',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {contenido.titulo}
              </h1>
              <ShareButton url={`/c/${slug}`} title={contenido.titulo} variant="button" />
            </div>

            {/* Fecha de publicación */}
            {fechaPublicacionFormateada && (
              <p
                style={{
                  fontSize: '14px',
                  color: '#666',
                  marginTop: '8px',
                }}
              >
                {fechaPublicacionFormateada}
              </p>
            )}

            {/* Fechas del evento (si es EVENTO) */}
            {esEvento && fechaInicioEvento && (
              <p
                style={{
                  fontSize: '16px',
                  color: '#111',
                  marginTop: '16px',
                  fontWeight: 500,
                  padding: '12px 16px',
                  backgroundColor: '#f0f9ff',
                  borderLeft: '3px solid #0066cc',
                  borderRadius: '4px',
                }}
              >
                <strong>Evento:</strong> {formatEventoRangeEs(fechaInicioEvento, contenido.fechaFin, locale)}
              </p>
            )}

          </header>

          {/* CONTENIDO (HTML o Markdown) */}
          {contenido.contenidoMd && (
            <div
              style={{
                fontSize: '16px',
                lineHeight: '1.8',
                color: '#333',
              }}
              className="prose-contenido"
            >
              {isHtmlContent(contenido.contenidoMd) ? (
                <div dangerouslySetInnerHTML={{ __html: contenido.contenidoMd }} />
              ) : (
                <ReactMarkdown>{contenido.contenidoMd}</ReactMarkdown>
              )}
            </div>
          )}

          {/* FOOTER: Volver */}
          <div
            style={{
              marginTop: '60px',
              paddingTop: '24px',
              borderTop: '1px solid #e5e5e5',
            }}
          >
            <BackButton />
          </div>
        </div>
      </article>

      {/* ESTILOS PARA MARKDOWN */}
      <style>{`
        .link-volver {
          font-size: 14px;
          color: #666;
          text-decoration: none;
        }
        .link-volver:hover {
          text-decoration: underline;
        }
        .prose-contenido p {
          margin-bottom: 20px;
        }
        .prose-contenido h2 {
          font-size: 24px;
          font-weight: 600;
          margin-top: 32px;
          margin-bottom: 16px;
          color: #111;
        }
        .prose-contenido h3 {
          font-size: 20px;
          font-weight: 600;
          margin-top: 24px;
          margin-bottom: 12px;
          color: #222;
        }
        .prose-contenido ul,
        .prose-contenido ol {
          margin-bottom: 20px;
          padding-left: 24px;
        }
        .prose-contenido li {
          margin-bottom: 8px;
        }
        .prose-contenido img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 24px 0;
        }
        .prose-contenido blockquote {
          border-left: 3px solid #ddd;
          padding-left: 16px;
          margin: 24px 0;
          color: #555;
          font-style: italic;
        }
        .prose-contenido code {
          background-color: #f5f5f5;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 14px;
        }
        .prose-contenido pre {
          background-color: #f5f5f5;
          padding: 16px;
          border-radius: 4px;
          overflow-x: auto;
          margin: 24px 0;
        }
        .prose-contenido a {
          color: #0066cc;
          text-decoration: none;
        }
        .prose-contenido a:hover {
          text-decoration: underline;
        }
      `}</style>
    </main>
  );
}
