type Pueblo = {
  id: number;
  nombre: string;
  slug: string;
  provincia?: string;
  comunidad?: string;
  descripcion_corta?: string;
  descripcion_larga?: string;
};

// 🔒 Forzamos render dinámico (no SSG)
export const dynamic = "force-dynamic";

// 🌍 Base de la API (Railway o local backend)
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

async function getPuebloBySlug(slug: string): Promise<Pueblo> {
  // 1️⃣ Listado de pueblos DESDE LA API
  const listRes = await fetch(`${API_BASE}/pueblos`, {
    cache: "no-store",
  });

  if (!listRes.ok) {
    throw new Error("No se pudo cargar el listado de pueblos");
  }

  const pueblos: Pueblo[] = await listRes.json();

  // 2️⃣ Buscar por slug
  const pueblo = pueblos.find((p) => p.slug === slug);

  if (!pueblo) {
    throw new Error("Pueblo no encontrado");
  }

  // 3️⃣ Detalle por ID
  const res = await fetch(`${API_BASE}/pueblos/${pueblo.id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Error cargando el pueblo");
  }

  return res.json();
}

export default async function PuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pueblo = await getPuebloBySlug(slug);

  return (
    <main>
      <h1>{pueblo.nombre}</h1>

      <p>
        {pueblo.provincia} · {pueblo.comunidad}
      </p>

      {pueblo.descripcion_corta && (
        <section>
          <h2>Descripción</h2>
          <p>{pueblo.descripcion_corta}</p>
        </section>
      )}

      {pueblo.descripcion_larga && (
        <section>
          <h2>Historia</h2>
          <p>{pueblo.descripcion_larga}</p>
        </section>
      )}
    </main>
  );
}