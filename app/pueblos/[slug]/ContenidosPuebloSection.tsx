'use client';

import Link from 'next/link';

type Contenido = {
  id: number;
  titulo: string;
  tipo: 'EVENTO' | 'NOTICIA' | 'ARTICULO' | 'PAGINA';
  coverUrl: string | null;
  slug: string;
  publishedAt: string | null;
  fecha_inicio: string | null;
};

type ContenidosPuebloSectionProps = {
  contenidos: Contenido[];
};

function formatearFecha(fecha: string | null): string {
  if (!fecha) return '';
  try {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function getBadgeColor(tipo: string): string {
  switch (tipo) {
    case 'EVENTO':
      return '#e74c3c';
    case 'NOTICIA':
      return '#3498db';
    case 'ARTICULO':
      return '#2ecc71';
    case 'PAGINA':
      return '#95a5a6';
    default:
      return '#95a5a6';
  }
}

export default function ContenidosPuebloSection({
  contenidos,
}: ContenidosPuebloSectionProps) {
  if (contenidos.length === 0) return null;

  return (
    <section style={{ marginTop: '32px' }}>
      <h2>Contenidos del pueblo</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
          marginTop: '16px',
        }}
      >
        {contenidos.map((contenido) => {
          const fecha =
            contenido.tipo === 'EVENTO'
              ? contenido.fecha_inicio
              : contenido.publishedAt;

          return (
            <article
              key={contenido.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {contenido.coverUrl && (
                <img
                  src={contenido.coverUrl}
                  alt={contenido.titulo}
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                  }}
                  loading="lazy"
                />
              )}

              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '8px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor: getBadgeColor(contenido.tipo),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                    }}
                  >
                    {contenido.tipo}
                  </span>
                </div>

                <h3
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '18px',
                    fontWeight: '600',
                    lineHeight: '1.4',
                  }}
                >
                  {contenido.titulo}
                </h3>

                {fecha && (
                  <p
                    style={{
                      margin: '0 0 12px 0',
                      fontSize: '14px',
                      color: '#666',
                    }}
                  >
                    {formatearFecha(fecha)}
                  </p>
                )}

                <div style={{ marginTop: 'auto' }}>
                  <Link
                    href={`/c/${contenido.slug}`}
                    style={{
                      color: '#0066cc',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    Ver más →
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
