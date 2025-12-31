import Link from "next/link";
import type { Metadata } from "next";
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

// Helpers para SEO
function cleanText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function cut(input: string, max = 160) {
  const s = cleanText(input);
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; poiId: string }>;
}): Promise<Metadata> {
  const { slug, poiId } = await params;
  const pueblo = await getPuebloBySlug(slug);
  const poi = (pueblo.pois ?? []).find((p) => p.id === Number(poiId));

  if (!poi) {
    return {
      title: "POI no encontrado",
      description: "El punto de interés no existe",
    };
  }

  const title = `${poi.nombre} – ${pueblo.nombre} – Los Pueblos Más Bonitos de España`;
  const descSource =
    poi.descripcion_corta ??
    (poi.descripcion_larga ? cut(poi.descripcion_larga, 180) : null);
  const description = descSource
    ? cut(descSource, 160)
    : `Información sobre ${poi.nombre} en ${pueblo.nombre}.`;
  const path = `/pueblos/${pueblo.slug}/pois/${poiId}`;

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
      images: poi.foto
        ? [{ url: poi.foto, alt: `${poi.nombre} – ${pueblo.nombre}` }]
        : undefined,
    },
    twitter: {
      card: poi.foto ? "summary_large_image" : "summary",
      title,
      description,
      images: poi.foto ? [poi.foto] : undefined,
    },
  };
}

export default async function PoiPage({
  params,
}: {
  params: Promise<{ slug: string; poiId: string }>;
}) {
  const { slug, poiId } = await params;
  const pueblo = await getPuebloBySlug(slug);

  // Buscar POI por ID
  const poi = (pueblo.pois ?? []).find((p) => p.id === Number(poiId));

  if (!poi) {
    throw new Error("POI no encontrado");
  }

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
      <h1>{poi.nombre}</h1>

      {/* Información del pueblo */}
      <p style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
        {pueblo.nombre} · {pueblo.provincia} · {pueblo.comunidad}
      </p>

      {/* Categoría si existe */}
      {poi.categoria && (
        <p style={{ marginTop: "8px", fontSize: "14px", color: "#888" }}>
          Categoría: {poi.categoria}
        </p>
      )}

      {/* Foto */}
      {poi.foto && (
        <div style={{ marginTop: "24px" }}>
          <img
            src={poi.foto}
            alt={poi.nombre}
            style={{
              width: "100%",
              maxHeight: "400px",
              objectFit: "cover",
              borderRadius: "8px",
            }}
          />
        </div>
      )}

      {/* Descripción corta */}
      {poi.descripcion_corta && (
        <section style={{ marginTop: "32px" }}>
          <p>{poi.descripcion_corta}</p>
        </section>
      )}

      {/* Descripción larga */}
      {poi.descripcion_larga && (
        <section style={{ marginTop: "32px" }}>
          <p>{poi.descripcion_larga}</p>
        </section>
      )}

      {/* Coordenadas y Google Maps */}
      {poi.lat && poi.lng && (
        <section style={{ marginTop: "32px" }}>
          <h2>Ubicación</h2>
          <p style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
            Coordenadas: {poi.lat}, {poi.lng}
          </p>
          <a
            href={`https://www.google.com/maps?q=${poi.lat},${poi.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: "12px",
              padding: "10px 16px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              backgroundColor: "#fff",
              textDecoration: "none",
              color: "#333",
            }}
          >
            Ver en Google Maps
          </a>
        </section>
      )}

      {/* Si no hay descripciones */}
      {!poi.descripcion_corta && !poi.descripcion_larga && (
        <section style={{ marginTop: "32px" }}>
          <p>Descripción próximamente.</p>
        </section>
      )}
    </main>
  );
}

