import Link from "next/link";
import type { Metadata } from "next";
import { getLugarLegacyBySlug, getApiUrl, type Pueblo } from "@/lib/api";
import ParadasMap from "@/app/_components/ParadasMap";

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

  // Obtener paradas fusionadas (legacy + overrides + custom) desde el endpoint público del backend
  let paradas: any[] = [];
  
  if (mx.id) {
    try {
      const apiBase = getApiUrl();
      const res = await fetch(`${apiBase}/multiexperiencias/${mx.id}/paradas`, {
        cache: "no-store",
      });
      
      if (res.ok) {
        paradas = await res.json();
        console.log(`[MX ${mx.id}] Paradas fusionadas:`, paradas.length);
      } else {
        console.error(`[MX ${mx.id}] Error cargando paradas:`, res.status);
      }
    } catch (err) {
      console.error(`[MX ${mx.id}] Error fetching paradas:`, err);
    }
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

        {/* Mapa de paradas */}
        <div style={{ marginTop: "20px" }}>
          <h3 style={{ marginBottom: "12px", fontSize: "16px", fontWeight: 500 }}>
            Mapa de la ruta
          </h3>
          <ParadasMap paradas={paradas} puebloNombre={pueblo.nombre} />
        </div>
      </section>

      {/* Paradas */}
      <section style={{ marginTop: "32px" }}>
        <h2 style={{ marginBottom: "8px" }}>Paradas</h2>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "24px" }}>
          {paradas.length} {paradas.length === 1 ? "parada" : "paradas"} en esta experiencia
        </p>
        {paradas.length === 0 ? (
          <p>No hay paradas disponibles</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {paradas.map((p: any, idx: number) => {
              const key = p.kind === 'LEGACY' 
                ? `L-${p.legacyLugarId}` 
                : `C-${p.customId ?? idx}`;
              const num = idx + 1;
              
              return (
                <article
                  key={key}
                  style={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                  }}
                >
                  {/* Foto */}
                  {p.foto ? (
                    <div
                      style={{
                        position: "relative",
                        aspectRatio: "16/9",
                        maxWidth: "100%",
                        overflow: "hidden",
                        backgroundColor: "#f0f0f0",
                      }}
                    >
                      <img
                        src={p.foto}
                        alt={p.titulo ?? "Parada"}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        loading="lazy"
                      />
                      {/* Badge número sobre la foto */}
                      <div
                        style={{
                          position: "absolute",
                          top: "12px",
                          left: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          background: "rgba(30, 64, 175, 0.9)",
                          backdropFilter: "blur(4px)",
                          borderRadius: "20px",
                          padding: "6px 14px 6px 6px",
                          color: "white",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: "white",
                            color: "#1e40af",
                            fontSize: "14px",
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {num}
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: 600 }}>
                          Parada {num}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* Contenido */}
                  <div style={{ padding: "20px" }}>
                    {/* Número + Título */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {!p.foto && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                            color: "white",
                            fontSize: "16px",
                            fontWeight: 800,
                            flexShrink: 0,
                            boxShadow: "0 2px 6px rgba(59,130,246,0.3)",
                          }}
                        >
                          {num}
                        </span>
                      )}
                      {p.titulo ? (
                        <h3 style={{ fontSize: "20px", fontWeight: 600, margin: 0, lineHeight: 1.3 }}>
                          {p.foto && (
                            <span style={{ color: "#1e40af", fontWeight: 700 }}>{num}. </span>
                          )}
                          {p.titulo}
                        </h3>
                      ) : (
                        <h3 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "#9ca3af" }}>
                          Parada {num}
                        </h3>
                      )}
                    </div>

                    {/* Descripción */}
                    {p.descripcion ? (
                      <div
                        style={{
                          marginTop: "12px",
                          fontSize: "15px",
                          lineHeight: 1.7,
                          color: "#374151",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {p.descripcion}
                      </div>
                    ) : (
                      <p style={{ marginTop: "12px", color: "#9ca3af", fontSize: "14px", fontStyle: "italic" }}>
                        Descripción próximamente.
                      </p>
                    )}

                    {/* Enlace Google Maps */}
                    {typeof p.lat === "number" && typeof p.lng === "number" ? (
                      <div style={{ marginTop: "12px" }}>
                        <a
                          href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "13px",
                            color: "#2563eb",
                            textDecoration: "none",
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          Ver en Google Maps
                        </a>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

