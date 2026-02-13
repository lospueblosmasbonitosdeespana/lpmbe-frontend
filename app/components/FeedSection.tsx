import Link from "next/link";
import ShareButton from "@/app/components/ShareButton";

type FeedItem = {
  id: number | string;
  titulo: string;
  fecha?: string | null;
  imagen?: string | null;
  excerpt?: string | null;
  href: string;
};

function fmtDateES(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function FeedSection({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: FeedItem[];
  emptyText: string;
}) {
  return (
    <section style={{ marginTop: "32px" }}>
      <h2>{title}</h2>

      {items.length > 0 ? (
        <div style={{ marginTop: "16px" }}>
          {items.map((item) => {
            const fecha = fmtDateES(item.fecha);
            return (
              <div
                key={item.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "16px",
                  position: "relative",
                }}
              >
                {item.imagen && (
                  <img
                    src={item.imagen}
                    alt={item.titulo}
                    style={{
                      width: "100%",
                      height: "auto",
                      borderRadius: "4px",
                      marginBottom: "12px",
                    }}
                  />
                )}

                <h3 style={{ margin: "0 0 8px 0" }}>
                  <Link
                    href={item.href}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    {item.titulo}
                  </Link>
                </h3>

                {fecha && (
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "14px",
                      color: "#666",
                    }}
                  >
                    {fecha}
                  </p>
                )}

                {item.excerpt && (
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "14px",
                      color: "#555",
                    }}
                  >
                    {item.excerpt}
                  </p>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "12px" }}>
                  <Link href={item.href} style={{ fontSize: "14px", color: "#0066cc" }}>
                    Ver más
                  </Link>
                  <ShareButton url={item.href} title={item.titulo} variant="icon" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ marginTop: "16px" }}>{emptyText}</p>
      )}
    </section>
  );
}

