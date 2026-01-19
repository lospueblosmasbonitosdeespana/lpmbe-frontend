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
            <Link
              key={contenido.id}
              href={`/c/${contenido.slug}`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
                cursor: 'pointer',
              }}
              className="contenido-card-link"
            >
              <article
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#fff',
                  height: '100%',
                }}
              >
                {/* IMAGEN: solo si existe */}
                {contenido.coverUrl && (
                  <div
                    style={{
                      width: '100%',
                      height: '180px',
                      overflow: 'hidden',
                      backgroundColor: '#f5f5f5',
                    }}
                  >
                    <img
                      src={contenido.coverUrl}
                      alt={contenido.titulo}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      loading="lazy"
                    />
                  </div>
                )}

                {/* CONTENIDO */}
                <div
                  style={{
                    padding: '16px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Badge tipo */}
                  <div style={{ marginBottom: '8px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: '#666',
                      }}
                    >
                      {contenido.tipo}
                    </span>
                  </div>

                  {/* Título con line-clamp */}
                  <h3
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: '18px',
                      fontWeight: '600',
                      lineHeight: '1.3',
                      color: '#111',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {contenido.titulo}
                  </h3>

                  {/* Fecha */}
                  {fecha && (
                    <p
                      style={{
                        margin: '0 0 12px 0',
                        fontSize: '13px',
                        color: '#999',
                        lineHeight: '1.4',
                      }}
                    >
                      {formatearFecha(fecha)}
                    </p>
                  )}

                  {/* Texto Ver más (solo informativo) */}
                  <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                    <span
                      style={{
                        color: '#0066cc',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      Ver más →
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>

      {/* ESTILOS CSS PARA HOVER */}
      <style>{`
        .contenido-card-link article {
          transition: border-color 0.2s ease;
        }
        .contenido-card-link:hover article {
          border-color: #999;
        }
      `}</style>
    </section>
  );
}
