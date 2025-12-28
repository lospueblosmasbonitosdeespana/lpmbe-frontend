import Link from "next/link";
import type { Metadata } from "next";
import { getPuebloBySlug, type Pueblo } from "@/lib/api";
import { getMeteo } from "@/lib/meteo/getMeteo";
import PuebloActions from "./PuebloActions";
import FeedSection from "../../components/FeedSection";
import DescripcionPueblo from "./DescripcionPueblo";
import SemaforoBadge from "../../components/pueblos/SemaforoBadge";
import MeteoBlock from "../../components/pueblos/MeteoBlock";

// Helpers para SEO
function cleanText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function cut(input: string, max = 160) {
  const s = cleanText(input);
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

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

type Evento = {
  id: number;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  imagen: string | null;
};

type Noticia = {
  id: number;
  titulo: string;
  contenido: string | null;
  fecha: string | null;
  imagen: string | null;
};

// 🔒 Forzamos render dinámico (no SSG)
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pueblo = await getPuebloBySlug(slug);
  const fotos = Array.isArray(pueblo.fotos) ? pueblo.fotos : [];
  const heroImage = pueblo.foto_destacada ?? fotos[0]?.url ?? null;
  const baseTitle = `${pueblo.nombre} · ${pueblo.provincia} · ${pueblo.comunidad}`;
  const title = `${pueblo.nombre} – Los Pueblos Más Bonitos de España`;
  // Extraer texto plano del HTML para la descripción (sin tags)
  const descText = pueblo.descripcion
    ? cleanText(pueblo.descripcion.replace(/<[^>]*>/g, ""))
    : null;
  const description = descText
    ? cut(descText, 160)
    : "Información, mapa, fotos, puntos de interés y experiencias del pueblo.";
  const path = `/pueblos/${pueblo.slug}`;

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
      images: heroImage ? [{ url: heroImage, alt: baseTitle }] : undefined,
    },
    twitter: {
      card: heroImage ? "summary_large_image" : "summary",
      title,
      description,
      images: heroImage ? [heroImage] : undefined,
    },
  };
}

export default async function PuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pueblo = await getPuebloBySlug(slug);

  // Proteger fotos con Array.isArray
  const fotos = Array.isArray(pueblo.fotos) ? pueblo.fotos : [];

  // Separar POIs por categoría
  const poisPOI = pueblo.pois.filter((poi: Poi) => poi.categoria === "POI");
  const poisMultiexperiencia = pueblo.pois.filter(
    (poi: Poi) => poi.categoria === "MULTIEXPERIENCIA"
  );
  const poisOtros = pueblo.pois.filter(
    (poi: Poi) => poi.categoria !== "POI" && poi.categoria !== "MULTIEXPERIENCIA"
  );

  const heroImage = pueblo.foto_destacada ?? fotos[0]?.url ?? null;

  // Filtrar fotos para galería: excluir la foto usada en hero si viene de fotos[]
  const fotoHeroUrl =
    heroImage && !pueblo.foto_destacada ? heroImage : null;
  const fotosParaGalería = fotoHeroUrl
    ? fotos.filter((f: Foto) => f.url !== fotoHeroUrl)
    : fotos;

  // Limitar a 24 fotos (sin orden adicional, tal cual viene del backend)
  const fotosGalería = fotosParaGalería.slice(0, 24);

  // Ordenar eventos: por fecha_inicio ascendente (próximos primero), sin fecha al final
  const eventosOrdenados = [...pueblo.eventos].sort((a, b) => {
    if (!a.fecha_inicio && !b.fecha_inicio) return 0;
    if (!a.fecha_inicio) return 1;
    if (!b.fecha_inicio) return -1;
    return a.fecha_inicio.localeCompare(b.fecha_inicio);
  });

  // Ordenar noticias: por fecha descendente (más recientes primero), sin fecha al final
  const noticiasOrdenadas = [...pueblo.noticias].sort((a, b) => {
    if (!a.fecha && !b.fecha) return 0;
    if (!a.fecha) return 1;
    if (!b.fecha) return -1;
    return b.fecha.localeCompare(a.fecha);
  });

  // Preparar datos para FeedSection
  const eventosFeed = eventosOrdenados.map((e) => ({
    id: e.id,
    titulo: e.titulo,
    fecha: e.fecha_inicio,
    imagen: e.imagen ?? null,
    excerpt: e.descripcion
      ? e.descripcion.length > 140
        ? e.descripcion.substring(0, 140) + "..."
        : e.descripcion
      : null,
    href: `/eventos/${e.id}`,
  }));

  const noticiasFeed = noticiasOrdenadas.map((n) => ({
    id: n.id,
    titulo: n.titulo,
    fecha: n.fecha,
    imagen: n.imagen ?? null,
    excerpt: n.contenido
      ? n.contenido.length > 140
        ? n.contenido.substring(0, 140) + "..."
        : n.contenido
      : null,
    href: `/noticias/${n.id}`,
  }));

  // Definir semáforo por defecto (VERDE si no existe)
  const semaforoPueblo = (pueblo as any).semaforo ?? {
    estado: "VERDE" as const,
    mensaje: null,
    ultima_actualizacion: null,
  };

  // Obtener meteo si hay coordenadas
  const meteo =
    pueblo.lat && pueblo.lng ? await getMeteo(pueblo.lat, pueblo.lng) : null;

  return (
    <main>
      {/* HERO */}
      <section>
        <h1>{pueblo.nombre}</h1>
        <p>
          {pueblo.provincia} · {pueblo.comunidad}
        </p>
        {heroImage && (
          <img
            src={heroImage}
            alt={pueblo.nombre}
            style={{ width: "100%", maxHeight: "400px", objectFit: "cover" }}
          />
        )}
      </section>

      {/* BARRA DE ACCIONES */}
      <PuebloActions
        nombre={pueblo.nombre}
        lat={pueblo.lat}
        lng={pueblo.lng}
      />

      {/* SEMÁFORO Y METEO */}
      <section style={{ marginTop: "32px" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <SemaforoBadge
            estado={semaforoPueblo.estado ?? "VERDE"}
            mensaje={semaforoPueblo.mensaje ?? null}
            updatedAt={semaforoPueblo.ultima_actualizacion ?? null}
            variant="panel"
          />
          {meteo && (
            <MeteoBlock
              temp={meteo.temp}
              code={meteo.code}
              wind={meteo.wind}
              variant="panel"
            />
          )}
        </div>
      </section>

      {/* TEXTO */}
      <section style={{ marginTop: "32px" }}>
        <DescripcionPueblo descripcion={pueblo.descripcion} />
      </section>

      {/* GALERÍA */}
      {fotosGalería.length > 0 && (
        <section style={{ marginTop: "32px" }}>
          <h2>Galería</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "16px",
              marginTop: "16px",
            }}
          >
            {fotosGalería.map((foto: Foto, index: number) => (
              <img
                key={foto.id}
                src={foto.url}
                alt={foto.alt ?? `${pueblo.nombre} - Foto ${index + 1}`}
                loading="lazy"
                style={{ width: "100%", height: "auto", borderRadius: "8px" }}
              />
            ))}
          </div>
        </section>
      )}

      {/* MAPA */}
      <section id="mapa" style={{ marginTop: "32px" }}>
        <h2>Mapa</h2>
        {pueblo.boldestMapId ? (
          <>
            <iframe
              src={`https://maps.lospueblosmasbonitosdeespana.org/es/mapas/${pueblo.boldestMapId}`}
              width="100%"
              height="480"
              frameBorder="0"
              style={{ border: 0 }}
              title={`Mapa de ${pueblo.nombre}`}
            />
            <div style={{ marginTop: "16px" }}>
              <a
                href={`https://maps.lospueblosmasbonitosdeespana.org/es/mapas/${pueblo.boldestMapId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver en Boldest Maps
              </a>
            </div>
          </>
        ) : pueblo.lat && pueblo.lng ? (
          <a
            href={`https://www.google.com/maps?q=${pueblo.lat},${pueblo.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-block", marginTop: "16px" }}
          >
            Ver en Google Maps
          </a>
        ) : (
          <p style={{ marginTop: "16px" }}>Mapa próximamente</p>
        )}
      </section>

      {/* POIs - Puntos de interés */}
      {poisPOI.length > 0 && (
        <section style={{ marginTop: "32px" }}>
          <h2>Puntos de interés</h2>
          <ul>
            {poisPOI.map((poi: Poi) => (
              <li key={poi.id}>
                <Link
                  href={`/pueblos/${pueblo.slug}/pois/${poi.id}`}
                  style={{ color: "#0066cc", textDecoration: "none" }}
                >
                  {poi.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* POIs - Paradas de la experiencia */}
      {poisMultiexperiencia.length > 0 && (
        <section style={{ marginTop: "32px" }}>
          <h2>Paradas de la experiencia</h2>
          <ul>
            {poisMultiexperiencia.map((poi: Poi) => (
              <li key={poi.id}>
                <Link
                  href={`/pueblos/${pueblo.slug}/pois/${poi.id}`}
                  style={{ color: "#0066cc", textDecoration: "none" }}
                >
                  {poi.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* POIs - Otros */}
      {poisOtros.length > 0 && (
        <section style={{ marginTop: "32px" }}>
          <h2>Otros</h2>
          <ul>
            {poisOtros.map((poi: Poi) => (
              <li key={poi.id}>
                <Link
                  href={`/pueblos/${pueblo.slug}/pois/${poi.id}`}
                  style={{ color: "#0066cc", textDecoration: "none" }}
                >
                  {poi.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* MULTIEXPERIENCIAS */}
      {pueblo.multiexperiencias.length > 0 && (
        <section style={{ marginTop: "32px" }}>
          <h2>Multiexperiencias</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "16px",
              marginTop: "16px",
            }}
          >
            {pueblo.multiexperiencias.map((mx: PuebloMultiexperiencia) => (
              <Link
                key={mx.multiexperiencia.id}
                href={`/pueblos/${pueblo.slug}/experiencias/${mx.multiexperiencia.slug}`}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "16px",
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                {mx.multiexperiencia.foto && (
                  <img
                    src={mx.multiexperiencia.foto}
                    alt={mx.multiexperiencia.titulo}
                    style={{
                      width: "100%",
                      height: "auto",
                      borderRadius: "4px",
                      marginBottom: "12px",
                    }}
                  />
                )}
                <h3 style={{ margin: "0 0 8px 0" }}>
                  {mx.multiexperiencia.titulo}
                </h3>
                {mx.multiexperiencia.descripcion && (
                  <p style={{ margin: 0, fontSize: "14px", color: "#555" }}>
                    {mx.multiexperiencia.descripcion.length > 150
                      ? mx.multiexperiencia.descripcion.substring(0, 150) +
                        "..."
                      : mx.multiexperiencia.descripcion}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* EVENTOS */}
      <FeedSection
        title="Eventos"
        items={eventosFeed}
        emptyText="No hay eventos publicados"
      />

      {/* NOTICIAS */}
      <FeedSection
        title="Noticias"
        items={noticiasFeed}
        emptyText="No hay noticias publicadas"
      />
    </main>
  );
}