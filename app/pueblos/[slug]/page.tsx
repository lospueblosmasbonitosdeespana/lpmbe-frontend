type Pueblo = {
  id: number;
  nombre: string;
  slug: string;
  provincia?: string;
  comunidad?: string;
  descripcion_corta?: string;
  descripcion_larga?: string;
};

async function getPuebloBySlug(slug: string): Promise<Pueblo> {
  // 1. Obtener todos los pueblos
  const listRes = await fetch("http://localhost:3000/pueblos", {
    cache: "no-store",
  });

  if (!listRes.ok) {
    throw new Error("No se pudo cargar el listado de pueblos");
  }

  const pueblos: Pueblo[] = await listRes.json();

  // 2. Buscar el pueblo por slug
  const pueblo = pueblos.find((p) => p.slug === slug);

  if (!pueblo) {
    throw new Error("Pueblo no encontrado");
  }

  // 3. Pedir el detalle por ID (lo que el backend espera)
  const res = await fetch(`http://localhost:3000/pueblos/${pueblo.id}`, {
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
