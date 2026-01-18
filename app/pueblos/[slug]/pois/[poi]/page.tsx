import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

function isNumeric(s: string) {
  return /^\d+$/.test(s);
}

function pickDescripcionHtml(poi: any): string | null {
  return (
    poi?.descripcion_larga ??
    poi?.descripcionLarga ??
    poi?.descripcion ??
    poi?.descripcionHtml ??
    null
  );
}

function pickFotoPrincipal(poi: any): string | null {
  const fotos = Array.isArray(poi?.fotosPoi) ? poi.fotosPoi : [];
  if (fotos.length > 0) {
    const principal = fotos.find((f: any) => f?.orden === 1) ?? fotos[0];
    if (principal?.url) return principal.url;
  }
  return poi?.fotoUrl ?? poi?.foto ?? poi?.imagen ?? null;
}

async function fetchPoi(puebloSlug: string, poiParam: string) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const url = isNumeric(poiParam)
    ? `${API_BASE}/pueblos/${puebloSlug}/pois/${poiParam}`
    : `${API_BASE}/pueblos/${puebloSlug}/pois/slug/${poiParam}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; poi: string }>;
}): Promise<Metadata> {
  const { slug, poi } = await params;
  const data = await fetchPoi(slug, poi);
  if (!data) return {};

  const foto = pickFotoPrincipal(data);
  const descripcionHtml = pickDescripcionHtml(data);
  const puebloNombre = data.pueblo?.nombre ?? "";
  const title = `${data.nombre}${puebloNombre ? ` · ${puebloNombre}` : ""} – Los Pueblos Más Bonitos de España`;
  const path = `/pueblos/${slug}/pois/${data.slug ?? poi}`;

  return {
    title,
    description: descripcionHtml
      ? descripcionHtml.replace(/<[^>]*>/g, "").slice(0, 160)
      : `Información sobre ${data.nombre}${puebloNombre ? ` en ${puebloNombre}` : ""}.`,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      url: path,
      type: "article",
      images: foto ? [{ url: foto, alt: data.nombre }] : undefined,
    },
    twitter: {
      card: foto ? "summary_large_image" : "summary",
      title,
      images: foto ? [foto] : undefined,
    },
  };
}

export default async function PoiPage({
  params,
}: {
  params: Promise<{ slug: string; poi: string }>;
}) {
  const { slug: puebloSlug, poi } = await params;

  const data = await fetchPoi(puebloSlug, poi);
  if (!data) notFound();

  // Redirect 301 desde URL legacy numérica a URL SEO
  if (isNumeric(poi) && data.slug) {
    redirect(`/pueblos/${puebloSlug}/pois/${data.slug}`);
  }

  const foto = pickFotoPrincipal(data);
  const descripcionHtml = pickDescripcionHtml(data);
  const puebloNombre = data.pueblo?.nombre ?? "Pueblo";
  const puebloProvincia = data.pueblo?.provincia ?? null;
  const puebloComunidad = data.pueblo?.comunidad ?? null;

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Link
          href={`/pueblos/${puebloSlug}`}
          style={{ color: "#0066cc", textDecoration: "none" }}
        >
          ← Volver a {puebloNombre}
        </Link>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 700, margin: "16px 0" }}>
        {data.nombre}
      </h1>

      <p style={{ fontSize: 14, color: "#666", margin: "8px 0" }}>
        {puebloNombre}
        {puebloProvincia ? ` · ${puebloProvincia}` : ""}
        {puebloComunidad ? ` · ${puebloComunidad}` : ""}
      </p>

      {data.categoria && (
        <p style={{ fontSize: 14, color: "#888", margin: "8px 0" }}>
          Categoría: {data.categoria}
        </p>
      )}

      {/* FOTO */}
      {foto ? (
        <section style={{ marginTop: 32 }}>
          <img
            src={foto}
            alt={data?.nombre ?? "POI"}
            style={{
              maxWidth: 900,
              width: "100%",
              height: "auto",
              borderRadius: 8,
            }}
            loading="eager"
          />
        </section>
      ) : null}

      {/* DESCRIPCIÓN */}
      {descripcionHtml ? (
        <section style={{ marginTop: 32 }}>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: descripcionHtml }}
          />
        </section>
      ) : (
        <section style={{ marginTop: 32 }}>
          <p style={{ color: "#666", fontSize: 14 }}>
            Descripción próximamente.
          </p>
        </section>
      )}

      {/* UBICACIÓN */}
      {data.lat && data.lng && (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>
            Ubicación
          </h2>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
            Coordenadas: {data.lat}, {data.lng}
          </p>
          <a
            href={`https://www.google.com/maps?q=${data.lat},${data.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "10px 16px",
              fontSize: 14,
              border: "1px solid #ddd",
              borderRadius: 6,
              backgroundColor: "#fff",
              textDecoration: "none",
              color: "#333",
            }}
          >
            Ver en Google Maps
          </a>
        </section>
      )}
    </main>
  );
}
