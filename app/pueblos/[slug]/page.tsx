import Link from "next/link";
import type { Metadata } from "next";
import { getPuebloBySlug, getPueblosLite, getApiUrl, type Pueblo } from "@/lib/api";
import PuebloActions from "./PuebloActions";
import FeedSection from "../../components/FeedSection";
import DescripcionPueblo from "./DescripcionPueblo";
import SemaforoBadge from "../../components/pueblos/SemaforoBadge";
import MeteoPanel from "./_components/MeteoPanel";
import { getComunidadFlagSrc } from "@/lib/flags";
import GaleriaGrid from "./GaleriaGrid";
import TematicasPuebloTabs from "./TematicasPuebloTabs";
import PueblosCercanosSection from "./_components/PueblosCercanosSection";
import EnCifrasSection from "./_components/EnCifrasSection";
import RotatedImage from "@/app/components/RotatedImage";

/** Distancia Haversine en km */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
  orden?: number; // Orden de la foto (1, 2, 3...)
  rotation?: number; // Grados de rotación (0, 90, 180, 270)
};

type Poi = {
  id: number;
  nombre: string;
  descripcion_corta: string | null;
  descripcion_larga: string | null;
  foto: string | null;
  rotation?: number | null;
  lat: number | null;
  lng: number | null;
  categoria: string | null;
  categoriaTematica: string | null;
  orden: number | null;
  puebloId: number;
};

// Mapeo de categorías temáticas a labels en español
const CATEGORIA_TEMATICA_LABELS: Record<string, string> = {
  GASTRONOMIA: 'Gastronomía',
  NATURALEZA: 'Naturaleza',
  CULTURA: 'Cultura',
  PATRIMONIO: 'Patrimonio',
  EN_FAMILIA: 'En familia',
  PETFRIENDLY: 'Petfriendly',
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
  lead?: string | null;
  highlights?: Array<{ orden: number; valor: string; etiqueta: string }>;
  boldestMapId?: string | null;
  foto_destacada?: string | null;
  fotosPueblo?: Array<{ id: number; url: string }>;
  pois: any[];
  eventos: any[];
  noticias: any[];
  multiexperiencias: any[];
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
  const [pueblo, pueblosLite] = await Promise.all([
    getPuebloBySlug(slug),
    getPueblosLite(),
  ]);

  const puebloSafe: PuebloSafe = {
    id: pueblo.id,
    nombre: pueblo.nombre,
    slug: pueblo.slug,
    provincia: pueblo.provincia,
    comunidad: pueblo.comunidad,
    lat: pueblo.lat ?? null,
    lng: pueblo.lng ?? null,
    descripcion: pueblo.descripcion ?? null,
    lead: (pueblo as any).lead ?? null,
    highlights: (pueblo as any).highlights ?? [],
    boldestMapId: pueblo.boldestMapId ?? null,
    foto_destacada: (pueblo as any).foto_destacada ?? null,
    fotosPueblo: Array.isArray(pueblo.fotosPueblo) ? pueblo.fotosPueblo : [],
    pois: pueblo.pois ?? [],
    eventos: pueblo.eventos ?? [],
    noticias: pueblo.noticias ?? [],
    multiexperiencias: (pueblo as any).multiexperiencias ?? [],
  };

  // Función para deduplicar por URL (no por ID)
  function dedupeByUrl<T extends { url: string }>(arr: T[]) {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const item of arr) {
      const key = (item.url || "").trim().toLowerCase();
      if (!key) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    return out;
  }

  // Obtener fotos del backend
  const fotosRaw = Array.isArray(puebloSafe.fotosPueblo) ? puebloSafe.fotosPueblo : [];
  
  // DEDUPLICAR POR URL (canónica + legacy pueden tener mismo URL)
  const fotos = dedupeByUrl(fotosRaw);

  // Separar POIs por categoría
  const pois = puebloSafe.pois;

  // POIs normales (todos para filtrar por categoría)
  const allPoisPOI = pois.filter((poi: Poi) => poi.categoria === "POI");
  // Mostrar solo los primeros 6 en la sección principal
  const poisPOI = allPoisPOI.slice(0, 6);
  // Flag para indicar si hay más POIs
  const hayMasPois = allPoisPOI.length > 6;

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

  // Ordenar por orden antes del slice
  const fotosSorted = [...fotosParaGalería].sort(
    (a, b) => ((a as FotoPueblo)?.orden ?? 999999) - ((b as FotoPueblo)?.orden ?? 999999)
  );
  
  // Limitar a 24 fotos
  const fotosGalería = fotosSorted.slice(0, 24);

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

  // Fotos para Pueblos Cercanos (4 más próximos por coordenadas)
  let pueblosCercanosPhotos: Record<string, { url: string } | null> = {};
  if (puebloSafe.lat != null && puebloSafe.lng != null) {
    const otros = pueblosLite.filter((p) => p.id !== puebloSafe.id && p.lat != null && p.lng != null);
    const conDistancia = otros
      .map((p) => ({ ...p, km: haversineKm(puebloSafe.lat!, puebloSafe.lng!, p.lat!, p.lng!) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 4);
    const ids = conDistancia.map((p) => p.id);
    if (ids.length > 0) {
      try {
        const API_BASE = getApiUrl();
        const res = await fetch(`${API_BASE}/public/pueblos/photos?ids=${ids.join(",")}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = (await res.json()) as Record<string, { url?: string } | null>;
          pueblosCercanosPhotos = {};
          for (const id of ids) {
            const v = data[String(id)];
            pueblosCercanosPhotos[String(id)] = v?.url ? { url: v.url } : null;
          }
        }
      } catch {
        // ignorar errores de fetch
      }
    }
  }

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
        puebloSlug={puebloSafe.slug}
        lat={puebloSafe.lat}
        lng={puebloSafe.lng}
        semaforoEstado={semaforoPueblo.estado ?? "VERDE"}
        semaforoMensaje={semaforoPueblo.mensaje ?? null}
        semaforoUpdatedAt={semaforoPueblo.ultima_actualizacion ?? null}
      />

      {/* EN CIFRAS - Patrimonio y Tradición */}
      <EnCifrasSection highlights={puebloSafe.highlights ?? []} />

      {/* METEO (sin semáforo) */}
      <section style={{ marginTop: "16px" }}>
        <MeteoPanel puebloId={puebloSafe.id} />
      </section>

      {/* TEXTO: Enunciado + Descripción */}
      <section
        style={{
          marginTop: "32px",
          padding: "24px 0",
          backgroundColor: "var(--color-bg-section)",
        }}
      >
        <div className="mx-auto max-w-3xl px-4">
          {puebloSafe.lead && (
            <p className="mb-6 text-xl font-medium leading-relaxed text-gray-800 md:text-2xl">
              {puebloSafe.lead}
            </p>
          )}
          <DescripcionPueblo descripcion={puebloSafe.descripcion} />
        </div>
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
                    style={{ border: 0, marginTop: '16px' }}
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
                key={`${puebloSafe.id}-poi-${poi.id}`}
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
                  <RotatedImage
                    src={poi.foto}
                    alt={poi.nombre}
                    rotation={poi.rotation}
                    height={200}
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
                  {poi.categoriaTematica && (
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "12px",
                        color: "#8b5e34",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        fontWeight: "600",
                      }}
                    >
                      {CATEGORIA_TEMATICA_LABELS[poi.categoriaTematica] || poi.categoriaTematica}
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
          {hayMasPois && (
            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <p style={{ fontSize: "14px", color: "#666" }}>
                Mostrando 6 de {allPoisPOI.length} puntos de interés.
                Explora las categorías temáticas para ver todos.
              </p>
            </div>
          )}
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
                key={`${puebloSafe.id}-mx-${poi.id}`}
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
                  <RotatedImage
                    src={poi.foto}
                    alt={poi.nombre}
                    rotation={poi.rotation}
                    height={200}
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
                key={`${puebloSafe.id}-otros-${poi.id}`}
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
                  <RotatedImage
                    src={poi.foto}
                    alt={poi.nombre}
                    rotation={poi.rotation}
                    height={200}
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

      {/* CATEGORÍAS TEMÁTICAS (Gastronomía, Naturaleza, etc.) - antes de Pueblos cercanos */}
      <TematicasPuebloTabs
        puebloSlug={puebloSafe.slug}
        pois={allPoisPOI.map((poi: Poi) => ({
          id: poi.id,
          nombre: poi.nombre,
          descripcion_corta: poi.descripcion_corta,
          descripcion_larga: poi.descripcion_larga,
          foto: poi.foto,
          categoriaTematica: poi.categoriaTematica,
        }))}
      />

      {/* PUEBLOS CERCANOS */}
      <PueblosCercanosSection
        puebloActual={{
          id: puebloSafe.id,
          lat: puebloSafe.lat,
          lng: puebloSafe.lng,
        }}
        pueblos={pueblosLite}
        photosByPuebloId={pueblosCercanosPhotos}
      />

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