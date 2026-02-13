'use client';

import Link from 'next/link';
import ShareButton from '@/app/components/ShareButton';
import { formatEventoRangeEs, formatDateTimeEs } from '@/app/_lib/dates';

type Contenido = {
  id: number;
  titulo: string;
  tipo: 'EVENTO' | 'NOTICIA' | 'ARTICULO' | 'PAGINA';
  coverUrl: string | null;
  slug: string;
  publishedAt: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
};

type ContenidosPuebloSectionProps = {
  contenidos: Contenido[];
};

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
          const esEvento = contenido.tipo === 'EVENTO';
          const labelFecha = esEvento && contenido.fechaInicio 
            ? formatEventoRangeEs(contenido.fechaInicio, contenido.fechaFin)
            : contenido.publishedAt 
            ? formatDateTimeEs(contenido.publishedAt)
            : '';

          return (
            <div key={contenido.id} style={{ position: 'relative' }} className="contenido-card-link">
            <Link
              href={`/c/${contenido.slug}`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
                cursor: 'pointer',
              }}
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
                {contenido.coverUrl && contenido.coverUrl.trim() && (
                  <div
                    style={{
                      width: '100%',
                      height: '180px',
                      overflow: 'hidden',
                      backgroundColor: '#f5f5f5',
                    }}
                  >
                    <img
                      src={contenido.coverUrl.trim()}
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
                  {labelFecha && (
                    <p
                      style={{
                        margin: '0 0 12px 0',
                        fontSize: '13px',
                        color: '#999',
                        lineHeight: '1.4',
                      }}
                    >
                      {labelFecha}
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
            <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
              <ShareButton url={`/c/${contenido.slug}`} title={contenido.titulo} variant="icon" />
            </div>
            </div>
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
