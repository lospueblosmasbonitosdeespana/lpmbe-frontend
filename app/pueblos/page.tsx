import PueblosList from "./PueblosList";

// 🔒 Evita SSG / paths raros
export const dynamic = "force-dynamic";

// 🌍 API real (Railway)
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

async function getPueblos() {
  const res = await fetch(`${API_BASE}/pueblos`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Error cargando pueblos");
  }

  return res.json();
}

export default async function PueblosPage() {
  try {
    const pueblos = await getPueblos();
    return <PueblosList pueblos={pueblos} />;
  } catch (error) {
    return (
      <main style={{ padding: "24px" }}>
        <h1>Pueblos</h1>
        <p style={{ marginTop: "24px", color: "#d32f2f" }}>
          Error al cargar los pueblos. Por favor, intenta de nuevo más tarde.
        </p>
      </main>
    );
  }
}