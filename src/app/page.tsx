export default function HomePage() {
  return (
    <main style={{ padding: 48, maxWidth: 900 }}>
      <h1 style={{ fontSize: 48, marginBottom: 16 }}>
        Los Pueblos Más Bonitos de España
      </h1>

      <p style={{ fontSize: 20, marginBottom: 40 }}>
        Plataforma oficial de la asociación.
      </p>

      <nav style={{ display: 'flex', gap: 24 }}>
        <a href="/pueblos">Pueblos</a>
        <a href="/notificaciones">Noticias</a>
        <a href="/rutas">Rutas</a>
      </nav>
    </main>
  );
}