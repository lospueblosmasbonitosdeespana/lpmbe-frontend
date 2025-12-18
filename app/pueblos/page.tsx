import Link from "next/link";

type Pueblo = {
  id: number;
  nombre: string;
  slug: string;
  provincia: string;
  comunidad: string;
};

async function getPueblos(): Promise<Pueblo[]> {
  const res = await fetch("http://localhost:3000/pueblos", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Error cargando pueblos");
  }

  return res.json();
}

export default async function PueblosPage() {
  const pueblos = await getPueblos();

  return (
    <main>
      <h1>Pueblos</h1>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "16px",
          marginTop: "24px",
        }}
      >
        {pueblos.map((pueblo) => (
          <Link
            key={pueblo.id}
            href={`/pueblos/${pueblo.slug}`}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "16px",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <h3 style={{ margin: "0 0 8px 0" }}>{pueblo.nombre}</h3>
            <p style={{ margin: 0, fontSize: "14px", color: "#555" }}>
              {pueblo.provincia}
              <br />
              {pueblo.comunidad}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
