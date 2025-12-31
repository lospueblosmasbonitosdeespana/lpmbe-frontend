import NotificacionesFeed from "./NotificacionesFeed.client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function NotificacionesPage() {
  return (
    <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
        Centro de notificaciones
      </h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Noticias, alertas y estado de semáforos.
      </p>

      <NotificacionesFeed />
    </main>
  );
}
