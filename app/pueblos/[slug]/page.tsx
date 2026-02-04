import Link from "next/link";
import type { Metadata } from "next";
import { getPuebloBySlug, getPueblosLite, getApiUrl } from "@/lib/api";
import PuebloActions from "./PuebloActions";
import DescripcionPueblo from "./DescripcionPueblo";
import MeteoPanel from "./_components/MeteoPanel";
import { getComunidadFlagSrc } from "@/lib/flags";
import TematicasPuebloTabs from "./TematicasPuebloTabs";
import PueblosCercanosSection from "./_components/PueblosCercanosSection";
import { QueHacerSection } from "./_components/QueHacerSection";
import { DetailPageHero } from "@/app/components/ui/detail-page-hero";
import { DetailIntroSection } from "@/app/components/ui/detail-section";
import { DetailStatsBlock } from "@/app/components/village/detail-stats-block";
import { CategoryHighlights } from "@/app/components/village/category-highlights";
import { MapSection } from "@/app/components/village/map-section";
import { DetailGallerySection } from "@/app/components/ui/detail-gallery-section";
import { PointsOfInterest } from "@/app/components/pueblos/PointsOfInterest";
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
  const API_BASE = getApiUrl();
  const [pueblo, pueblosLite, pagesRes] = await Promise.all([
    getPuebloBySlug(slug),
    getPueblosLite(),
    fetch(`${API_BASE}/public/pueblos/${slug}/pages`, { cache: "no-store" }).catch(() => null),
  ]);

  // Páginas temáticas del pueblo (contenidos temáticos) - ahora son arrays por categoría
  let paginasTematicas: Array<{ id: number; titulo: string; coverUrl: string | null; category: string }> = [];
  let paginasPorCategoria: Record<string, Array<{ id: number; titulo: string; coverUrl: string | null; category: string }>> = {};
  if (pagesRes?.ok) {
    try {
      const pagesData = await pagesRes.json();
      // pagesData es un objeto { CATEGORIA: [array de páginas] }
      paginasPorCategoria = pagesData;
      paginasTematicas = Object.entries(pagesData)
        .flatMap(([cat, pages]) => {
          if (!Array.isArray(pages)) return [];
          return pages.map((page: any) => ({
            id: page.id,
            titulo: page.titulo,
            coverUrl: page.coverUrl ?? null,
            category: cat,
          }));
        });
    } catch {
      // ignorar
    }
  }

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

  const breadcrumbs = [
    { label: "Inicio", href: "/" },
    { label: "Pueblos", href: "/pueblos" },
    { label: puebloSafe.nombre, href: `/pueblos/${puebloSafe.slug}` },
  ];

  const heroMetadata = (
    <div className="flex items-center gap-2">
      {comunidadFlagSrc && (
        <img
          src={comunidadFlagSrc}
          alt={`Bandera de ${puebloSafe.comunidad}`}
          className="h-5 w-8 rounded-sm object-cover"
        />
      )}
      <span>{puebloSafe.provincia}</span>
      <span aria-hidden="true">·</span>
      <span>{puebloSafe.comunidad}</span>
    </div>
  );

  return (
    <main className="bg-background">
      {/* HERO - Diseño tourism-website-design */}
      <DetailPageHero
        title={puebloSafe.nombre}
        eyebrow={`${puebloSafe.comunidad} / ${puebloSafe.provincia}`}
        metadata={heroMetadata}
        image={heroImage}
        imageAlt={puebloSafe.nombre}
        breadcrumbs={breadcrumbs}
        variant="fullscreen"
        overlay="gradient"
      />

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

      {/* EN CIFRAS - Patrimonio y Tradición (V0 - como captura 1) */}
      <DetailStatsBlock
        eyebrow="EN CIFRAS"
        title="Patrimonio y Tradición"
        stats={(puebloSafe.highlights ?? []).slice(0, 4).map((h) => ({
          value: h.valor,
          label: h.etiqueta,
        }))}
        columns={4}
        background="default"
      />

      {/* METEO - Diseño imagen referencia */}
      <MeteoPanel puebloId={puebloSafe.id} />

      {/* TEXTO: Enunciado + Descripción - Diseño tourism-website-design */}
      {(puebloSafe.lead || puebloSafe.descripcion) && (() => {
        const plainDesc = puebloSafe.descripcion?.replace(/<[^>]*>/g, "").trim() ?? "";
        const introLead = puebloSafe.lead ?? (plainDesc ? plainDesc.slice(0, 250) + (plainDesc.length > 250 ? "…" : "") : "Descubre este pueblo.");
        return (
          <DetailIntroSection
            lead={introLead}
            body={puebloSafe.descripcion ? <DescripcionPueblo descripcion={puebloSafe.descripcion} /> : undefined}
            background="default"
          />
        );
      })()}

      {/* GALERÍA - Diseño tourism-website-design */}
      {fotosGalería.length > 0 && (
        <DetailGallerySection
          eyebrow="Galería"
          title={`Imágenes de ${puebloSafe.nombre}`}
          images={fotosGalería.map((f: FotoPueblo) => ({
            src: f.url,
            alt: `${puebloSafe.nombre} - foto ${f.id}`,
          }))}
          layout="featured"
          background="card"
        />
      )}

      {/* Qué ver - Lugares de interés (POIs) - LOS BONITOS Y PERFECTOS */}
      {poisPOI.length > 0 && (
        <PointsOfInterest
          id="lugares-de-interes"
          points={poisPOI.map((poi: Poi) => ({
            id: poi.id,
            name: poi.nombre,
            type: (CATEGORIA_TEMATICA_LABELS[poi.categoriaTematica ?? ""] ?? poi.categoria ?? "Punto de interés"),
            description: poi.descripcion_corta ?? poi.descripcion_larga?.replace(/<[^>]*>/g, "").slice(0, 120) ?? "",
            image: poi.foto,
            rotation: poi.rotation,
            href: `/pueblos/${puebloSafe.slug}/pois/${poi.id}`,
          }))}
        />
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

      {/* Qué hacer en [Pueblo] - Solo Multiexperiencias */}
      <QueHacerSection
        puebloNombre={puebloSafe.nombre}
        puebloSlug={puebloSafe.slug}
        multiexperiencias={puebloSafe.multiexperiencias ?? []}
      />

      {/* Experiencias por categoría - 6 categorías, colores V0 - enlazan a página de categoría */}
      <CategoryHighlights
        id="experiencias-por-categoria"
        categories={[
          {
            type: "nature",
            title: "Naturaleza",
            description: "Senderismo, paisajes y espacios naturales",
            items: [
              ...(poisPOI.filter((p: Poi) => (p.categoriaTematica ?? "").toUpperCase() === "NATURALEZA").map((p: Poi) => ({ title: p.nombre, href: `/pueblos/${puebloSafe.slug}/pois/${p.id}` }))),
              ...(puebloSafe.multiexperiencias ?? []).filter((m) => (m.multiexperiencia?.categoria ?? "").toUpperCase() === "NATURALEZA").map((m) => ({ title: m.multiexperiencia.titulo, href: `/pueblos/${puebloSafe.slug}/experiencias/${m.multiexperiencia.slug}` })),
              ...(paginasPorCategoria["NATURALEZA"] ?? []).map((p) => ({ title: p.titulo, href: `/pueblos/${puebloSafe.slug}/categoria/naturaleza` })),
            ],
            href: `/pueblos/${puebloSafe.slug}/categoria/naturaleza`,
          },
          {
            type: "culture",
            title: "Cultura",
            description: "Monumentos, museos y patrimonio histórico",
            items: [
              ...(poisPOI.filter((p: Poi) => (p.categoriaTematica ?? "").toUpperCase() === "CULTURA").map((p: Poi) => ({ title: p.nombre, href: `/pueblos/${puebloSafe.slug}/pois/${p.id}` }))),
              ...(puebloSafe.multiexperiencias ?? []).filter((m) => (m.multiexperiencia?.categoria ?? "").toUpperCase() === "CULTURA").map((m) => ({ title: m.multiexperiencia.titulo, href: `/pueblos/${puebloSafe.slug}/experiencias/${m.multiexperiencia.slug}` })),
              ...(paginasPorCategoria["CULTURA"] ?? []).map((p) => ({ title: p.titulo, href: `/pueblos/${puebloSafe.slug}/categoria/cultura` })),
            ],
            href: `/pueblos/${puebloSafe.slug}/categoria/cultura`,
          },
          {
            type: "family",
            title: "En familia",
            description: "Actividades para todas las edades",
            items: [
              ...(poisPOI.filter((p: Poi) => (p.categoriaTematica ?? "").toUpperCase() === "EN_FAMILIA").map((p: Poi) => ({ title: p.nombre, href: `/pueblos/${puebloSafe.slug}/pois/${p.id}` }))),
              ...(puebloSafe.multiexperiencias ?? []).filter((m) => (m.multiexperiencia?.categoria ?? "").toUpperCase() === "EN_FAMILIA").map((m) => ({ title: m.multiexperiencia.titulo, href: `/pueblos/${puebloSafe.slug}/experiencias/${m.multiexperiencia.slug}` })),
              ...(paginasPorCategoria["EN_FAMILIA"] ?? []).map((p) => ({ title: p.titulo, href: `/pueblos/${puebloSafe.slug}/categoria/en-familia` })),
            ],
            href: `/pueblos/${puebloSafe.slug}/categoria/en-familia`,
          },
          {
            type: "heritage",
            title: "Patrimonio",
            description: "Bienes de interés cultural y arquitectura histórica",
            items: [
              ...(poisPOI.filter((p: Poi) => (p.categoriaTematica ?? "").toUpperCase() === "PATRIMONIO").map((p: Poi) => ({ title: p.nombre, href: `/pueblos/${puebloSafe.slug}/pois/${p.id}` }))),
              ...(puebloSafe.multiexperiencias ?? []).filter((m) => (m.multiexperiencia?.categoria ?? "").toUpperCase() === "PATRIMONIO").map((m) => ({ title: m.multiexperiencia.titulo, href: `/pueblos/${puebloSafe.slug}/experiencias/${m.multiexperiencia.slug}` })),
              ...(paginasPorCategoria["PATRIMONIO"] ?? []).map((p) => ({ title: p.titulo, href: `/pueblos/${puebloSafe.slug}/categoria/patrimonio` })),
            ],
            href: `/pueblos/${puebloSafe.slug}/categoria/patrimonio`,
          },
          {
            type: "petfriendly",
            title: "Petfriendly",
            description: "Espacios y actividades para ir con tu mascota",
            items: [
              ...(poisPOI.filter((p: Poi) => (p.categoriaTematica ?? "").toUpperCase() === "PETFRIENDLY").map((p: Poi) => ({ title: p.nombre, href: `/pueblos/${puebloSafe.slug}/pois/${p.id}` }))),
              ...(puebloSafe.multiexperiencias ?? []).filter((m) => (m.multiexperiencia?.categoria ?? "").toUpperCase() === "PETFRIENDLY").map((m) => ({ title: m.multiexperiencia.titulo, href: `/pueblos/${puebloSafe.slug}/experiencias/${m.multiexperiencia.slug}` })),
              ...(paginasPorCategoria["PETFRIENDLY"] ?? []).map((p) => ({ title: p.titulo, href: `/pueblos/${puebloSafe.slug}/categoria/petfriendly` })),
            ],
            href: `/pueblos/${puebloSafe.slug}/categoria/petfriendly`,
          },
          {
            type: "gastronomy",
            title: "Gastronomía",
            description: "Restaurantes, productos locales y tradición culinaria",
            items: [
              ...(poisPOI.filter((p: Poi) => (p.categoriaTematica ?? "").toUpperCase() === "GASTRONOMIA").map((p: Poi) => ({ title: p.nombre, href: `/pueblos/${puebloSafe.slug}/pois/${p.id}` }))),
              ...(puebloSafe.multiexperiencias ?? []).filter((m) => (m.multiexperiencia?.categoria ?? "").toUpperCase() === "GASTRONOMIA").map((m) => ({ title: m.multiexperiencia.titulo, href: `/pueblos/${puebloSafe.slug}/experiencias/${m.multiexperiencia.slug}` })),
              ...(paginasPorCategoria["GASTRONOMIA"] ?? []).map((p) => ({ title: p.titulo, href: `/pueblos/${puebloSafe.slug}/categoria/gastronomia` })),
            ],
            href: `/pueblos/${puebloSafe.slug}/categoria/gastronomia`,
          },
        ]}
      />

      {/* MAPA (Ubicación) - Boldest, encima de pueblos cercanos */}
      {puebloSafe.lat != null && puebloSafe.lng != null && (
        <div id="mapa">
          <MapSection
            title="Ubicación"
            description={
              puebloSafe.lat && puebloSafe.lng
                ? `${puebloSafe.nombre} se encuentra en ${puebloSafe.provincia}, ${puebloSafe.comunidad}.`
                : undefined
            }
            center={{ lat: puebloSafe.lat, lng: puebloSafe.lng }}
            markers={poisPOI
              .filter((p: Poi) => p.lat != null && p.lng != null)
              .slice(0, 10)
              .map((p: Poi) => ({
                id: String(p.id),
                lat: p.lat!,
                lng: p.lng!,
                label: p.nombre,
              }))}
            boldestMapUrl={
              puebloSafe.boldestMapId || puebloSafe.slug
                ? puebloSafe.boldestMapId?.startsWith("PB-")
                  ? `https://maps.lospueblosmasbonitosdeespana.org/es/mapas/${puebloSafe.boldestMapId}`
                  : `https://maps.lospueblosmasbonitosdeespana.org/es/pueblos/resource/${puebloSafe.slug}`
                : undefined
            }
            boldestMapId={puebloSafe.boldestMapId ?? undefined}
          />
        </div>
      )}

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