type Foto = {
  id: number;
  url: string;
  alt: string | null;
  orden: number | null;
  puebloId: number;
};

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

type Multiexperiencia = {
  id: number;
  titulo: string;
  descripcion: string | null;
  foto: string | null;
  slug: string;
  categoria: string | null;
  tipo: string;
  programa: string | null;
  qr: string | null;
  puntos: number | null;
  activo: boolean;
};

type PuebloMultiexperiencia = {
  puebloId: number;
  multiexperienciaId: number;
  orden: number | null;
  multiexperiencia: Multiexperiencia;
};

type Pueblo = {
  id: number;
  nombre: string;
  slug: string;
  provincia: string;
  comunidad: string;
  lat: number | null;
  lng: number | null;
  descripcion_corta: string | null;
  descripcion_larga: string | null;
  foto_destacada: string | null;
  puntosVisita?: number | null;
  boldestMapId?: string | null;
  fotos: Foto[];
  pois: Poi[];
  multiexperiencias: PuebloMultiexperiencia[];
};

import Link from "next/link";

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

export default async function MultiexperienciaPage({
  params,
}: {
  params: Promise<{ slug: string; mxSlug: string }>;
}) {
  const { slug, mxSlug } = await params;
  const pueblo = await getPuebloBySlug(slug);

  // Buscar la multiexperiencia por slug
  const mx = pueblo.multiexperiencias.find(
    (x) => x.multiexperiencia.slug === mxSlug
  );

  if (!mx) {
    throw new Error("Multiexperiencia no encontrada");
  }

  // Obtener paradas (POIs con categoria === "MULTIEXPERIENCIA")
  const paradas = pueblo.pois.filter(
    (p) => p.categoria === "MULTIEXPERIENCIA"
  );

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
        {paradas.length > 0 ? (
          <div style={{ marginTop: "24px" }}>
            {paradas.map((parada) => (
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
                  <p style={{ margin: 0, fontSize: "14px", color: "#555" }}>
                    {parada.descripcion_larga}
                  </p>
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

