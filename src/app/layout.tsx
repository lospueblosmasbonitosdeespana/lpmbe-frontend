import Link from 'next/link';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont',
        }}
      >
        {/* HEADER */}
        <header
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <strong>LPBME</strong>

          <nav style={{ display: 'flex', gap: 16 }}>
            <Link href="/">Inicio</Link>
            <Link href="/pueblos">Pueblos</Link>
            <Link href="/notificaciones">Notificaciones</Link>
            <Link href="/rutas">Rutas</Link>
          </nav>
        </header>

        {/* CONTENIDO */}
        <main style={{ padding: 24 }}>{children}</main>
      </body>
    </html>
  );
}