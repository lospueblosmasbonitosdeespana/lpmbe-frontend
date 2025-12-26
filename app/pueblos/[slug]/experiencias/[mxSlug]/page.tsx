import Link from "next/link";
import { getPuebloBySlug, type Pueblo } from "@/lib/api";

type Poi = {
  id: number;
  nombre: string;
  descripcion_corta: string | null;
  descripcion_larga: string | null;
  foto: string | null;
  lat: number | null;
  lng: number | null;
  categoria: string | null;
  orden: number | null;
  puebloId: number;
};

// 🔒 Forzamos render dinámico (no SSG)
export const dynamic = "force-dynamic";

export default async function MultiexperienciaPage({
  params,
}: {
  params: Promise<{ slug: string; mxSlug: string }>;
}) {
  const { slug, mxSlug } = await params;
  const pueblo = await getPuebloBySlug(slug);

  // Buscar la multiexperiencia por slug
  const mx = pueblo.multiexperiencias.find(
    (x: { multiexperiencia: { slug: string } }) => x.multiexperiencia.slug === mxSlug
  );

  if (!mx) {
    throw new Error("Multiexperiencia no encontrada");
  }

  // Obtener paradas (POIs con categoria === "MULTIEXPERIENCIA")
  const paradas = pueblo.pois.filter(
    (p: Poi) => p.categoria === "MULTIEXPERIENCIA"
  );

  // Ordenar paradas: primero por orden ascendente (null al final), luego por id ascendente
  const paradasOrdenadas = [...paradas].sort((a, b) => {
    if (a.orden !== null && b.orden !== null) {
      if (a.orden !== b.orden) {
        return a.orden - b.orden;
      }
      // Tie-breaker: id ascendente
      return a.id - b.id;
    }
    if (a.orden !== null) return -1;
    if (b.orden !== null) return 1;
    // Si ambos tienen orden null, ordenar por id ascendente
    return a.id - b.id;
  });

  return (
    <main style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: "24px" }}>
        <Link
          href={`/pueblos/${pueblo.slug}`}
          style={{ color: "#0066cc", textDecoration: "none" }}
        >
          ← Volver a {pueblo.nombre}
        </Link>
      </div>

      {/* Título */}
      <h1>{mx.multiexperiencia.titulo}</h1>

      {/* Información del pueblo */}
      <p style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
        {pueblo.nombre} · {pueblo.provincia} · {pueblo.comunidad}
      </p>

      {/* Foto padre */}
      {mx.multiexperiencia.foto && (
        <div style={{ marginTop: "24px" }}>
          <img
            src={mx.multiexperiencia.foto}
            alt={mx.multiexperiencia.titulo}
            style={{
              width: "100%",
              maxHeight: "400px",
              objectFit: "cover",
              borderRadius: "8px",
            }}
          />
        </div>
      )}

      {/* Descripción */}
      <section style={{ marginTop: "32px" }}>
        <p>
          {mx.multiexperiencia.descripcion ?? "Descripción próximamente."}
        </p>
      </section>

      {/* Paradas */}
      <section style={{ marginTop: "32px" }}>
        <h2>Paradas</h2>
        {paradasOrdenadas.length > 0 ? (
          <div style={{ marginTop: "24px" }}>
            {paradasOrdenadas.map((parada) => (
              <div
                key={parada.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "16px",
                }}
              >
                <h3 style={{ margin: "0 0 12px 0" }}>{parada.nombre}</h3>

                {/* Foto de parada */}
                {parada.foto ? (
                  <div style={{ marginBottom: "12px" }}>
                    <img
                      src={parada.foto}
                      alt={parada.nombre}
                      style={{
                        width: "100%",
                        maxHeight: "300px",
                        objectFit: "cover",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                ) : (
                  <p
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: "14px",
                      color: "#888",
                      fontStyle: "italic",
                    }}
                  >
                    Foto próximamente
                  </p>
                )}

                {/* Descripción corta */}
                {parada.descripcion_corta && (
                  <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#555" }}>
                    {parada.descripcion_corta}
                  </p>
                )}

                {/* Descripción larga */}
                {parada.descripcion_larga && (
                  <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#555" }}>
                    {parada.descripcion_larga}
                  </p>
                )}

                {/* Link a Google Maps si hay coordenadas */}
                {parada.lat && parada.lng && (
                  <a
                    href={`https://www.google.com/maps?q=${parada.lat},${parada.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      marginTop: "8px",
                      fontSize: "14px",
                      color: "#0066cc",
                      textDecoration: "none",
                    }}
                  >
                    Ver en Google Maps
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ marginTop: "16px", color: "#666" }}>
            No hay paradas disponibles
          </p>
        )}
      </section>
    </main>
  );
}

