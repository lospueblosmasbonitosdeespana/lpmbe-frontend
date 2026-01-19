import Link from "next/link";
import type { Metadata } from "next";
import { getPuebloBySlug, type Pueblo } from "@/lib/api";
import PuebloActions from "./PuebloActions";
import FeedSection from "../../components/FeedSection";
import DescripcionPueblo from "./DescripcionPueblo";
import SemaforoBadge from "../../components/pueblos/SemaforoBadge";
import MeteoPanel from "./_components/MeteoPanel";
import { getComunidadFlagSrc } from "@/lib/flags";
import ContenidosPuebloSection from "./ContenidosPuebloSection";
import GaleriaGrid from "./GaleriaGrid";
import TematicasPuebloTabs from "./TematicasPuebloTabs";
import { headers } from "next/headers";

// Helpers para SEO
function cleanText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function cut(input: string, max = 160) {
  const s = cleanText(input);
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

type FotoPueblo = {
  id: number;
  url: string;
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

type PuebloSafe = {
  id: number;
  nombre: string;
  slug: string;
  provincia: string;
  comunidad: string;
  lat: number | null;
  lng: number | null;
  descripcion: string | null;
  boldestMapId?: string | null;
  foto_destacada?: string | null;
  fotosPueblo?: Array<{ id: number; url: string }>;
  pois: any[];
  eventos: any[];
  noticias: any[];
  multiexperiencias: any[];
};

type Contenido = {
  id: number;
  titulo: string;
  tipo: 'EVENTO' | 'NOTICIA' | 'ARTICULO' | 'PAGINA';
  coverUrl: string | null;
  slug: string;
  publishedAt: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
};

// Función para obtener contenidos del CMS del pueblo
async function fetchContenidosPueblo(puebloId: number): Promise<Contenido[]> {
  try {
    const h = await headers();
    const host = h.get('host');
    const proto = h.get('x-forwarded-proto') ?? 'http';
    const baseUrl = `${proto}://${host}`;

    const res = await fetch(
      `${baseUrl}/api/public/contenidos?puebloId=${puebloId}&limit=20`,
      { cache: 'no-store' }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const items = Array.isArray(data) ? data : data?.items ?? [];

    return items;
  } catch (error) {
    console.error('Error fetching contenidos:', error);
    return [];
  }
}

// Función para ordenar y limitar contenidos según reglas
function procesarContenidos(contenidos: Contenido[]): Contenido[] {
  const ahora = new Date();

  // Separar por tipo
  const eventos = contenidos.filter((c) => c.tipo === 'EVENTO');
  const noticias = contenidos.filter((c) => c.tipo === 'NOTICIA');
  const articulos = contenidos.filter((c) => c.tipo === 'ARTICULO');
  const paginas = contenidos.filter((c) => c.tipo === 'PAGINA');

  // Eventos: solo futuros, ordenar por fechaInicio asc, máximo 3
  const eventosFuturos = eventos
    .filter((e) => {
      if (!e.fechaInicio) return false;
      return new Date(e.fechaInicio) >= ahora;
    })
    .sort((a, b) => {
      if (!a.fechaInicio || !b.fechaInicio) return 0;
      return new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime();
    })
    .slice(0, 3);

  // Noticias: ordenar por publishedAt desc, máximo 3
  const noticiasRecientes = noticias
    .sort((a, b) => {
      if (!a.publishedAt || !b.publishedAt) return 0;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, 3);

  // Artículos y páginas: máximo 2 cada uno
  const articulosLimitados = articulos.slice(0, 2);
  const paginasLimitadas = paginas.slice(0, 2);

  // Concatenar en orden
  return [
    ...eventosFuturos,
    ...noticiasRecientes,
    ...articulosLimitados,
    ...paginasLimitadas,
  ];
}

// 🔒 Forzamos render dinámico (no SSG)
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pueblo = await getPuebloBySlug(slug);
  const fotos = Array.isArray(pueblo.fotosPueblo) ? pueblo.fotosPueblo : [];
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

  const puebloSafe: PuebloSafe = {
    id: pueblo.id,
    nombre: pueblo.nombre,
    slug: pueblo.slug,
    provincia: pueblo.provincia,
    comunidad: pueblo.comunidad,
    lat: pueblo.lat ?? null,
    lng: pueblo.lng ?? null,
    descripcion: pueblo.descripcion ?? null,
    boldestMapId: pueblo.boldestMapId ?? null,
    foto_destacada: (pueblo as any).foto_destacada ?? null,
    fotosPueblo: Array.isArray(pueblo.fotosPueblo) ? pueblo.fotosPueblo : [],
    pois: pueblo.pois ?? [],
    eventos: pueblo.eventos ?? [],
    noticias: pueblo.noticias ?? [],
    multiexperiencias: (pueblo as any).multiexperiencias ?? [],
  };

  // Obtener contenidos del CMS
  const contenidosCMS = await fetchContenidosPueblo(puebloSafe.id);
  const contenidosProcesados = procesarContenidos(contenidosCMS);

  // Proteger fotos con Array.isArray
  const fotos = Array.isArray(puebloSafe.fotosPueblo) ? puebloSafe.fotosPueblo : [];

  // Separar POIs por categoría
  const pois = puebloSafe.pois;

  const poisPOI = pois.filter((poi: Poi) => poi.categoria === "POI");

  const poisMultiexperiencia = pois.filter(
    (poi: Poi) => poi.categoria === "MULTIEXPERIENCIA"
  );

  const poisOtros = pois.filter(
    (poi: Poi) =>
      poi.categoria !== "POI" && poi.categoria !== "MULTIEXPERIENCIA"
  );

  const heroImage = puebloSafe.foto_destacada ?? fotos[0]?.url ?? null;

  // Filtrar fotos para galería: excluir la foto usada en hero si viene de fotosPueblo[]
  const fotoHeroUrl =
    heroImage && !puebloSafe.foto_destacada ? heroImage : null;
  const fotosParaGalería = fotoHeroUrl
    ? fotos.filter((f: FotoPueblo) => f.url !== fotoHeroUrl)
    : fotos;

  // Limitar a 24 fotos (sin orden adicional, tal cual viene del backend)
  const fotosGalería = fotosParaGalería.slice(0, 24);

  // Ordenar eventos: por fecha_inicio ascendente (próximos primero), sin fecha al final
  const eventos = puebloSafe.eventos;

  const eventosOrdenados = [...eventos].sort((a, b) => {
    if (!a.fecha_inicio && !b.fecha_inicio) return 0;
    if (!a.fecha_inicio) return 1;
    if (!b.fecha_inicio) return -1;
    return new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime();
  });

  // Ordenar noticias: por fecha descendente (más recientes primero), sin fecha al final
  const noticias = puebloSafe.noticias;

  const noticiasOrdenadas = [...noticias].sort((a, b) => {
    if (!a.fecha && !b.fecha) return 0;
    if (!a.fecha) return 1;
    if (!b.fecha) return -1;
    return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
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
  const semaforoPueblo = (puebloSafe as any).semaforo ?? {
    estado: "VERDE" as const,
    mensaje: null,
    ultima_actualizacion: null,
  };

  // Obtener bandera de la comunidad
  const comunidadFlagSrc = getComunidadFlagSrc(puebloSafe.comunidad);

  return (
    <main>
      {/* Estilos para galería responsive */}
      <style>{`
        .galeria-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 1024px) {
          .galeria-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .galeria-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* HEADER CON BANDERA */}
      <header className="mb-6">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
          {puebloSafe.nombre}
        </h1>

        <div className="mt-2 flex items-center gap-2 text-base md:text-lg text-neutral-600">
          {comunidadFlagSrc ? (
            <img
              src={comunidadFlagSrc}
              alt={`Bandera de ${puebloSafe.comunidad}`}
              className="h-5 w-8 rounded-sm object-cover"
            />
          ) : null}

          <span>{puebloSafe.provincia}</span>
          <span aria-hidden="true">·</span>
          <span>{puebloSafe.comunidad}</span>
        </div>
      </header>

      {/* HERO */}
      <section>
        {heroImage && (
          <img
            src={heroImage}
            alt={puebloSafe.nombre}
            style={{ width: "100%", maxHeight: "400px", objectFit: "cover" }}
          />
        )}
      </section>

      {/* BARRA DE ACCIONES CON SEMÁFORO */}
      <PuebloActions
        nombre={puebloSafe.nombre}
        lat={puebloSafe.lat}
        lng={puebloSafe.lng}
        semaforoEstado={semaforoPueblo.estado ?? "VERDE"}
        semaforoMensaje={semaforoPueblo.mensaje ?? null}
        semaforoUpdatedAt={semaforoPueblo.ultima_actualizacion ?? null}
      />

      {/* METEO (sin semáforo) */}
      <section style={{ marginTop: "16px" }}>
        <MeteoPanel puebloId={puebloSafe.id} />
      </section>

      {/* TEXTO */}
      <section style={{ marginTop: "32px" }}>
        <DescripcionPueblo descripcion={puebloSafe.descripcion} />
      </section>

      {/* GALERÍA */}
      {fotosGalería.length > 0 && (
        <section
          style={{
            marginTop: "48px",
            padding: "32px 0",
            backgroundColor: "#fff",
          }}
        >
          <h2 style={{ marginBottom: "24px" }}>Galería</h2>
          <GaleriaGrid
            fotos={fotosGalería}
            puebloNombre={puebloSafe.nombre}
          />
        </section>
      )}

      {/* MAPA */}
      <section id="mapa" style={{ marginTop: "32px" }}>
        <h2>Mapa</h2>
        {puebloSafe.boldestMapId || puebloSafe.slug ? (
          <>
            {(() => {
              const boldestSrc =
                puebloSafe.boldestMapId?.startsWith('PB-')
                  ? `https://maps.lospueblosmasbonitosdeespana.org/es/mapas/${puebloSafe.boldestMapId}`
                  : `https://maps.lospueblosmasbonitosdeespana.org/es/pueblos/resource/${puebloSafe.slug}`;

              return (
                <>
                  <iframe
                    src={boldestSrc}
                    width="100%"
                    height="480"
                    frameBorder="0"
                    style={{ border: 0 }}
                    title={`Mapa de ${puebloSafe.nombre}`}
                  />
                  <div style={{ marginTop: "16px" }}>
                    <a
                      href={boldestSrc}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver en Boldest Maps
                    </a>
                  </div>
                </>
              );
            })()}
          </>
        ) : puebloSafe.lat && puebloSafe.lng ? (
          <a
            href={`https://www.google.com/maps?q=${puebloSafe.lat},${puebloSafe.lng}`}
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px",
              marginTop: "16px",
            }}
          >
            {poisPOI.map((poi: Poi) => (
              <Link
                key={poi.id}
                href={`/pueblos/${puebloSafe.slug}/pois/${poi.id}`}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  overflow: "hidden",
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  transition: "box-shadow 0.2s",
                }}
              >
                {poi.foto ? (
                  <img
                    src={poi.foto}
                    alt={poi.nombre}
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover",
                    }}
                    loading="lazy"
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "200px",
                      backgroundColor: "#f0f0f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#999",
                      fontSize: "14px",
                    }}
                  >
                    Sin imagen
                  </div>
                )}

                <div style={{ padding: "16px" }}>
                  {poi.categoria && (
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "12px",
                        color: "#666",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {poi.categoria}
                    </p>
                  )}

                  <h3
                    style={{
                      margin: "0",
                      fontSize: "18px",
                      fontWeight: "600",
                      lineHeight: "1.4",
                    }}
                  >
                    {poi.nombre}
                  </h3>

                  <p
                    style={{
                      margin: "12px 0 0 0",
                      fontSize: "14px",
                      color: "#0066cc",
                      fontWeight: "500",
                    }}
                  >
                    Ver detalle →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* POIs - Paradas de la experiencia */}
      {poisMultiexperiencia.length > 0 && (
        <section style={{ marginTop: "32px" }}>
          <h2>Paradas de la experiencia</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px",
              marginTop: "16px",
            }}
          >
            {poisMultiexperiencia.map((poi: Poi) => (
              <Link
                key={poi.id}
                href={`/pueblos/${puebloSafe.slug}/pois/${poi.id}`}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  overflow: "hidden",
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  transition: "box-shadow 0.2s",
                }}
              >
                {poi.foto ? (
                  <img
                    src={poi.foto}
                    alt={poi.nombre}
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover",
                    }}
                    loading="lazy"
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "200px",
                      backgroundColor: "#f0f0f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#999",
                      fontSize: "14px",
                    }}
                  >
                    Sin imagen
                  </div>
                )}

                <div style={{ padding: "16px" }}>
                  {poi.categoria && (
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "12px",
                        color: "#666",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {poi.categoria}
                    </p>
                  )}

                  <h3
                    style={{
                      margin: "0",
                      fontSize: "18px",
                      fontWeight: "600",
                      lineHeight: "1.4",
                    }}
                  >
                    {poi.nombre}
                  </h3>

                  <p
                    style={{
                      margin: "12px 0 0 0",
                      fontSize: "14px",
                      color: "#0066cc",
                      fontWeight: "500",
                    }}
                  >
                    Ver detalle →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* POIs - Otros */}
      {poisOtros.length > 0 && (
        <section style={{ marginTop: "32px" }}>
          <h2>Otros</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px",
              marginTop: "16px",
            }}
          >
            {poisOtros.map((poi: Poi) => (
              <Link
                key={poi.id}
                href={`/pueblos/${puebloSafe.slug}/pois/${poi.id}`}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  overflow: "hidden",
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  transition: "box-shadow 0.2s",
                }}
              >
                {poi.foto ? (
                  <img
                    src={poi.foto}
                    alt={poi.nombre}
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover",
                    }}
                    loading="lazy"
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "200px",
                      backgroundColor: "#f0f0f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#999",
                      fontSize: "14px",
                    }}
                  >
                    Sin imagen
                  </div>
                )}

                <div style={{ padding: "16px" }}>
                  {poi.categoria && (
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "12px",
                        color: "#666",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {poi.categoria}
                    </p>
                  )}

                  <h3
                    style={{
                      margin: "0",
                      fontSize: "18px",
                      fontWeight: "600",
                      lineHeight: "1.4",
                    }}
                  >
                    {poi.nombre}
                  </h3>

                  <p
                    style={{
                      margin: "12px 0 0 0",
                      fontSize: "14px",
                      color: "#0066cc",
                      fontWeight: "500",
                    }}
                  >
                    Ver detalle →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* MULTIEXPERIENCIAS */}
      {puebloSafe.multiexperiencias.length > 0 && (
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
            {puebloSafe.multiexperiencias.map((mx: PuebloMultiexperiencia) => (
              <Link
                key={mx.multiexperiencia.id}
                href={`/pueblos/${puebloSafe.slug}/experiencias/${mx.multiexperiencia.slug}`}
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

      {/* CONTENIDOS DEL PUEBLO (CMS) */}
      <ContenidosPuebloSection contenidos={contenidosProcesados} />

      {/* TEMÁTICAS DEL PUEBLO (Gastronomía, Naturaleza, etc.) */}
      <TematicasPuebloTabs puebloSlug={puebloSafe.slug} />

      {/* EVENTOS Y NOTICIAS LEGACY - COMENTADO
      <FeedSection
        title="Eventos"
        items={eventosFeed}
        emptyText="No hay eventos publicados"
      />

      <FeedSection
        title="Noticias"
        items={noticiasFeed}
        emptyText="No hay noticias publicadas"
      />
      */}
    </main>
  );
}