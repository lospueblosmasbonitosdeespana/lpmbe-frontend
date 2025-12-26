import Link from "next/link";

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

                <Link href={item.href} style={{ fontSize: "14px", color: "#0066cc" }}>
                  Ver más
                </Link>
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

