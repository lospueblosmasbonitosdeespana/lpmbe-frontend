import Link from "next/link";
import type { Metadata } from "next";
import { getLugarLegacyBySlug, type Pueblo } from "@/lib/api";

// Helpers para SEO
function cleanText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function cut(input: string, max = 160) {
  const s = cleanText(input);
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

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
  categoria?: string | null;
  tipo?: "LOCAL" | "NACIONAL" | string;
  programa?: string | null;
  qr?: string | null;
  puntos?: number | null;
  activo?: boolean | null;
  legacyId?: number | null;
};

// 🔒 Forzamos render dinámico (no SSG)
export const dynamic = "force-dynamic";

// Helper para renderizar foto de parada
// CONTRATO: El backend legacy devuelve poi.fotos[] (array)
// Usar poi.fotos?.[0]?.url, NO usar poi.foto ni pueblo.fotos
function renderParadaFoto(parada: Poi) {
  // Obtener imagen desde poi.fotos[] (legacy)
  const image = (parada as any).fotos?.[0]?.url ?? null;

  if (image) {
    return (
      <div style={{ marginBottom: "12px" }}>
        <img
          src={image}
          alt={parada.nombre}
          style={{
            width: "100%",
            maxHeight: "300px",
            objectFit: "cover",
            borderRadius: "4px",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        marginBottom: "12px",
        padding: "40px",
        backgroundColor: "#f5f5f5",
        borderRadius: "4px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "12px",
          color: "#888",
          fontStyle: "italic",
        }}
      >
        Foto próximamente
      </p>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; mxSlug: string }>;
}): Promise<Metadata> {
  const { slug, mxSlug } = await params;
  const pueblo = await getLugarLegacyBySlug(slug);
  
  // Buscar la multiexperiencia por slug (soportar formato plano y anidado)
  const mxItem = (pueblo.multiexperiencias ?? []).find((x: any) => {
    const s = x?.slug ?? x?.multiexperiencia?.slug ?? null;
    return s === mxSlug;
  });
  
  // Normalizar: si viene anidada, usa x.multiexperiencia; si viene plana, usa x
  const mx = (mxItem?.multiexperiencia ?? mxItem ?? null) as Multiexperiencia | null;
  
  const expTitle = mx?.titulo ?? "Experiencia";
  const title = `${expTitle} – ${pueblo.nombre} – Los Pueblos Más Bonitos de España`;
  const heroImage =
    mx?.foto ??
    pueblo.foto_destacada ??
    pueblo.fotos?.[0]?.url ??
    null;
  const descSource = mx?.descripcion ?? null;
  const description = descSource
    ? cut(descSource, 160)
    : "Detalle de la experiencia y sus paradas.";
  const path = `/pueblos/${pueblo.slug}/experiencias/${mxSlug}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: path,
      type: "article",
      images: heroImage
        ? [{ url: heroImage, alt: `${expTitle} – ${pueblo.nombre}` }]
        : undefined,
    },
    twitter: {
      card: heroImage ? "summary_large_image" : "summary",
      title,
      description,
      images: heroImage ? [heroImage] : undefined,
    },
  };
}

export default async function MultiexperienciaPage({
  params,
}: {
  params: Promise<{ slug: string; mxSlug: string }>;
}) {
  const { slug, mxSlug } = await params;
  const pueblo = await getLugarLegacyBySlug(slug);

  // Buscar la multiexperiencia por slug (soportar formato plano y anidado)
  const mxItem = (pueblo.multiexperiencias ?? []).find((x: any) => {
    const s = x?.slug ?? x?.multiexperiencia?.slug ?? null;
    return s === mxSlug;
  });

  // Normalizar: si viene anidada, usa x.multiexperiencia; si viene plana, usa x
  const mx = (mxItem?.multiexperiencia ?? mxItem ?? null) as Multiexperiencia | null;

  if (!mx) {
    throw new Error("Multiexperiencia no encontrada");
  }

  // Obtener paradas desde POIs legacy: filtrar por categoría MULTIEXPERIENCIA
  // En el endpoint legacy, las paradas ya vienen filtradas por la multiexperiencia
  const paradas = (pueblo.pois ?? []).filter(
    (p) => p.categoria === "MULTIEXPERIENCIA"
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
      <h1>{mx.titulo}</h1>

      {/* Información del pueblo */}
      <p style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
        {pueblo.nombre} · {pueblo.provincia} · {pueblo.comunidad}
      </p>

      {/* Foto padre */}
      {mx.foto && (
        <div style={{ marginTop: "24px" }}>
          <img
            src={mx.foto}
            alt={mx.titulo}
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
          {mx.descripcion ?? "Descripción próximamente."}
        </p>
      </section>

      {/* Resumen de la experiencia */}
      <section
        style={{
          marginTop: "32px",
          padding: "20px",
          backgroundColor: "#f9f9f9",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "16px" }}>
          Resumen de la experiencia
        </h2>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link
            href={`/pueblos/${pueblo.slug}`}
            style={{
              padding: "10px 16px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              backgroundColor: "#fff",
              textDecoration: "none",
              color: "#333",
              display: "inline-block",
            }}
          >
            Volver al pueblo
          </Link>
          <Link
            href={`/pueblos/${pueblo.slug}#mapa`}
            style={{
              padding: "10px 16px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              backgroundColor: "#fff",
              textDecoration: "none",
              color: "#333",
              display: "inline-block",
            }}
          >
            Ver mapa del pueblo
          </Link>
          {pueblo.lat && pueblo.lng ? (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${pueblo.lat},${pueblo.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "10px 16px",
                fontSize: "14px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                backgroundColor: "#fff",
                textDecoration: "none",
                color: "#333",
                display: "inline-block",
              }}
            >
              Cómo llegar
            </a>
          ) : (
            <button
              disabled
              style={{
                padding: "10px 16px",
                fontSize: "14px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                backgroundColor: "#f5f5f5",
                cursor: "not-allowed",
                color: "#999",
              }}
            >
              Cómo llegar
            </button>
          )}
        </div>
      </section>

      {/* Paradas */}
      <section style={{ marginTop: "32px" }}>
        <h2>Paradas</h2>
        {paradasOrdenadas.length > 0 ? (
          <>
            {/* Mini-índice de paradas */}
            <div
              style={{
                marginTop: "16px",
                padding: "16px",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px",
                marginBottom: "24px",
              }}
            >
              <h3 style={{ margin: "0 0 12px 0", fontSize: "16px" }}>
                Índice de paradas
              </h3>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {paradasOrdenadas.map((parada, index) => (
                  <li key={parada.id} style={{ marginBottom: "8px" }}>
                    <a
                      href={`#parada-${parada.id}`}
                      style={{
                        color: "#0066cc",
                        textDecoration: "none",
                        fontSize: "14px",
                      }}
                    >
                      {index + 1}. {parada.nombre}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Lista de paradas */}
            <div style={{ marginTop: "24px" }}>
              {paradasOrdenadas.map((parada, index) => (
                <div
                  id={`parada-${parada.id}`}
                  key={parada.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "16px",
                    marginBottom: "16px",
                    scrollMarginTop: "80px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: "#0066cc",
                        color: "#fff",
                        fontSize: "14px",
                        fontWeight: "bold",
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </span>
                    <h3 style={{ margin: 0 }}>{parada.nombre}</h3>
                  </div>

                  {/* Foto de parada */}
                  {renderParadaFoto(parada)}

                  {/* Descripción corta */}
                  {parada.descripcion_corta && (
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "14px",
                        color: "#555",
                      }}
                    >
                      {parada.descripcion_corta}
                    </p>
                  )}

                  {/* Descripción larga */}
                  {parada.descripcion_larga && (
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "14px",
                        color: "#555",
                      }}
                    >
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
          </>
        ) : (
          <p style={{ marginTop: "16px", color: "#666" }}>
            No hay paradas disponibles
          </p>
        )}
      </section>
    </main>
  );
}

