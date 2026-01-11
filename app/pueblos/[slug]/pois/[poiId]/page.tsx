import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPuebloBySlug, getPoiById, type Pueblo } from "@/lib/api";

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
  const poi = await getPoiById(poiId);

  if (!poi || Number(poi.puebloId) !== Number(pueblo.id)) {
    return {
      title: "POI no encontrado",
      description: "El punto de interés no existe",
    };
  }

  const title = `${poi.nombre} – ${pueblo.nombre} – Los Pueblos Más Bonitos de España`;
  const descripcionHtml = (poi as any).descripcionHtml ?? null;
  const description = descripcionHtml
    ? cut(descripcionHtml.replace(/<[^>]*>/g, ''), 160)
    : `Información sobre ${poi.nombre} en ${pueblo.nombre}.`;
  const path = `/pueblos/${pueblo.slug}/pois/${poiId}`;

  const fotoUrl = (poi as any).fotoUrl ?? (poi as any).foto ?? null;

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
      images: fotoUrl
        ? [{ url: fotoUrl, alt: `${poi.nombre} – ${pueblo.nombre}` }]
        : undefined,
    },
    twitter: {
      card: fotoUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: fotoUrl ? [fotoUrl] : undefined,
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
  const poi = await getPoiById(poiId);

  // Seguridad: si el POI no pertenece a ese pueblo, 404
  if (!poi || Number(poi.puebloId) !== Number(pueblo.id)) notFound();

  const fotoUrl =
    poi?.fotoUrl && poi.fotoUrl.trim() !== ""
      ? poi.fotoUrl
      : poi?.foto && poi.foto.trim() !== ""
      ? poi.foto
      : null;

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <Link style={{ color: "#0066cc", textDecoration: "none" }} href={`/pueblos/${pueblo.slug}`}>
          ← Volver a {pueblo.nombre}
        </Link>
      </div>

      <h1>{poi.nombre}</h1>

      <p style={{ marginTop: 8, fontSize: 14, color: "#666" }}>
        {pueblo.nombre} · {pueblo.provincia} · {pueblo.comunidad}
      </p>

      <p style={{ marginTop: 8, fontSize: 14, color: "#888" }}>
        Categoría: {poi.categoria}
      </p>

      {/* FOTO */}
      {fotoUrl && (
        <section style={{ marginTop: 32 }}>
          <img
            src={fotoUrl}
            alt={poi.nombre}
            style={{
              width: "100%",
              maxWidth: 900,
              borderRadius: 8,
            }}
            loading="lazy"
          />
        </section>
      )}

      {/* DESCRIPCIÓN */}
      <section style={{ marginTop: 32 }}>
        {poi.descripcionHtml ? (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: poi.descripcionHtml }}
          />
        ) : (
          <p>Descripción próximamente.</p>
        )}
      </section>

      {/* UBICACIÓN */}
      {poi.lat && poi.lng && (
        <section style={{ marginTop: 32 }}>
          <h2>Ubicación</h2>
          <p style={{ marginTop: 8, fontSize: 14, color: "#666" }}>
            Coordenadas: {poi.lat}, {poi.lng}
          </p>
          <a
            href={`https://www.google.com/maps?q=${poi.lat},${poi.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: 12,
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

