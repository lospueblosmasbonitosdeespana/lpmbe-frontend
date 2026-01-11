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

  // Obtener paradas desde paradasLegacy
  const paradas = (pueblo as any).paradasLegacy ?? [];

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
        {paradas.length === 0 ? (
          <p>No hay paradas disponibles</p>
        ) : (
          <div className="space-y-6">
            {paradas.map((p: any, idx: number) => (
              <article key={p.legacyId ?? idx} className="space-y-3">
                {p.fotoUrl ? (
                  <img
                    src={p.fotoUrl}
                    alt={p.nombre ?? "Parada"}
                    className="w-full max-w-3xl rounded-lg"
                    loading="lazy"
                  />
                ) : null}

                {p.nombre ? (
                  <h3 className="text-xl font-semibold">{p.nombre}</h3>
                ) : null}

                {p.descripcionHtml ? (
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: p.descripcionHtml }}
                  />
                ) : (
                  <p>Descripción próximamente.</p>
                )}

                {typeof p.lat === "number" && typeof p.lng === "number" ? (
                  <p className="text-sm text-gray-600">
                    Coordenadas: {p.lat}, {p.lng}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

