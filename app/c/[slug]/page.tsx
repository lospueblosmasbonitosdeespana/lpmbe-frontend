import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import BackButton from './BackButton';

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
  fecha_inicio?: string;
};

async function fetchContenido(slug: string): Promise<Contenido | null> {
  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const baseUrl = `${proto}://${host}`;

  const res = await fetch(`${baseUrl}/api/public/contenidos/${slug}`, {
    cache: 'no-store',
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

  // Determinar fecha según tipo
  let fecha: string | undefined;
  if (contenido.tipo === 'EVENTO' && contenido.fecha_inicio) {
    fecha = contenido.fecha_inicio;
  } else {
    fecha = contenido.publishedAt ?? contenido.createdAt;
  }

  const fechaFormateada = fecha
    ? new Date(fecha).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

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
        {contenido.coverUrl && (
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto 48px',
              overflow: 'hidden',
              borderRadius: '8px',
            }}
          >
            <img
              src={contenido.coverUrl}
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

            {/* Título */}
            <h1
              style={{
                fontSize: '36px',
                fontWeight: 700,
                lineHeight: '1.2',
                marginBottom: '12px',
                color: '#111',
              }}
            >
              {contenido.titulo}
            </h1>

            {/* Fecha */}
            {fechaFormateada && (
              <p
                style={{
                  fontSize: '14px',
                  color: '#666',
                  marginTop: '8px',
                }}
              >
                {fechaFormateada}
              </p>
            )}

            {/* Resumen (si existe) */}
            {contenido.resumen && (
              <p
                style={{
                  fontSize: '18px',
                  lineHeight: '1.6',
                  color: '#444',
                  marginTop: '24px',
                  fontWeight: 400,
                }}
              >
                {contenido.resumen}
              </p>
            )}
          </header>

          {/* CONTENIDO MARKDOWN */}
          {contenido.contenidoMd && (
            <div
              style={{
                fontSize: '16px',
                lineHeight: '1.8',
                color: '#333',
              }}
              className="prose-contenido"
            >
              <ReactMarkdown>{contenido.contenidoMd}</ReactMarkdown>
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
