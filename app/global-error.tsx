'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
            Algo salió mal
          </h1>
          <p style={{ color: '#666', marginBottom: '2rem', maxWidth: '28rem' }}>
            Ha ocurrido un error inesperado. Puedes intentar de nuevo o volver al inicio.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={reset}
              style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              Reintentar
            </button>
            <a
              href="/"
              style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', background: '#111', color: 'white', textDecoration: 'none', fontSize: '0.875rem' }}
            >
              Ir al inicio
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
