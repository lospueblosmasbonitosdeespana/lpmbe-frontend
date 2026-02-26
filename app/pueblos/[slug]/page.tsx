import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getPuebloBySlug, getPueblosLite, getApiUrl } from "@/lib/api";
import { getBaseUrl, getCanonicalUrl, getLocaleAlternates, type SupportedLocale } from "@/lib/seo";
import JsonLd from "@/app/components/seo/JsonLd";
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
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Title, Lead } from "@/app/components/ui/typography";
import ParadasMap from "@/app/_components/ParadasMap";
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

/** Normaliza etiqueta para lookup: mayúsculas, sin acentos, espacios simples */
function normalizeStatEtiqueta(s: string): string {
  return (s ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ");
}

/** Mapeo etiqueta normalizada (ES) → clave i18n puebloPage.stats.* (para traducir en cada idioma) */
const STAT_ETIQUETA_TO_KEY: Record<string, string> = {
  ALTITUD: "altitud",
  HABITANTES: "habitantes",
  PUENTE: "puente",
  "IGLESIA ROMANICA": "iglesiaRomanica",
  IGLESIA: "iglesia",
  IGLESIAS: "iglesias",
  FUNDACION: "fundacion",
  CASTILLO: "castillo",
  MURALLAS: "murallas",
  COLEGIATA: "colegiata",
  "PLAZA MAYOR": "plazaMayor",
  AYUNTAMIENTO: "ayuntamiento",
  ROMANICO: "romanico",
  PALACIOS: "palacios",
  "CONJUNTO HISTORICO": "conjuntoHistorico",
  "PLAZAS MEDIEVALES": "plazasMedievales",
  "MONUMENTO NACIONAL": "monumentoNacional",
  MEZQUITA: "mezquita",
  "TORRES MEDIEVALES": "torresMedievales",
  CATEDRAL: "catedral",
  VALLES: "valles",
  "CORRAL COMEDIAS": "corralComedias",
  "CUEVAS EXCAVADAS": "cuevasExcavadas",
  TORREON: "torreon",
  CASONAS: "casonas",
  COMARCA: "comarca",
  FUNICULAR: "funicular",
  "STO. DOMINGO": "stoDomingo",
  "CASAS TIPICAS": "casasTipicas",
  BATANES: "batanes",
  TEMPLARIOS: "templarios",
  SANTIAGO: "santiago",
  UNESCO: "unesco",
  PATRIMONIO: "patrimonio",
  UNIVERSIDAD: "universidad",
  "CAPRICHO GAUDI": "caprichoGaudi",
  NATURAL: "natural",
  TRAZADO: "trazado",
  ERUPCION: "erupcion",
  CONVENTO: "convento",
  VALLE: "valle",
  "AL AIRE LIBRE": "museoAireLibre",
  "LLUVIA/AÑO": "lluviaAno",
  "LLUVIA/ANO": "lluviaAno",
  MONASTERIO: "monasterio",
  ARCIPRESTE: "arcipreste",
  "MONUMENTO NAC.": "monumentoNac",
  PLAZA: "plaza",
  BODEGAS: "bodegas",
  "TERMAS ROMANAS": "termasRomanas",
  "PALACIO DUCAL": "palacioDucal",
  CONVENTOS: "conventos",
  "FABRICA CAÑONES": "fabricaCanones",
  "FABRICA CANONES": "fabricaCanones",
  CIUDAD: "ciudad",
  PALACIO: "palacio",
  ARQUITECTURA: "arquitectura",
  CULTURA: "cultura",
  "PUERTO PESQUERO": "pesquero",
  PESQUERO: "pesquero",
  MUSEOS: "museos",
  "UNESCO TRAMUNTANA": "tramuntana",
  "MUSEO ETH CORRAU": "museos",
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
  rutas?: Array<{ ruta: { id: number; titulo: string; slug: string; foto_portada?: string | null } }>;
  semaforo?: any;
  videos?: Array<{ id: number; titulo: string; url: string; thumbnail?: string | null }>;
};

// 🔒 Forzamos render dinámico (no SSG)
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const pueblo = await getPuebloBySlug(slug, locale);
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
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale as SupportedLocale),
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
  const locale = await getLocale();
  const t = await getTranslations("puebloPage");
  const API_BASE = getApiUrl();
  const langQs = locale ? `?lang=${encodeURIComponent(locale)}` : "";
  const [pueblo, pueblosLite, pagesRes] = await Promise.all([
    getPuebloBySlug(slug, locale),
    getPueblosLite(locale),
    fetch(`${API_BASE}/public/pueblos/${slug}/pages${langQs}`, { cache: "no-store" }).catch(() => null),
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

  const rawSemaforo = (pueblo as any).semaforo;
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
    rutas: (pueblo as any).rutas ?? [],
    semaforo: rawSemaforo,
    videos: (pueblo as any).videos ?? [],
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

  // Semáforo: usar datos del API (estado, mensaje_publico, fechas)
  const s = (puebloSafe as any).semaforo;
  const semaforoPueblo = s
    ? {
        estado: (s.estado ?? "VERDE") as "VERDE" | "AMARILLO" | "ROJO",
        mensaje: s.mensaje_publico ?? s.mensaje ?? null,
        ultima_actualizacion: s.ultima_actualizacion ?? null,
        programado_inicio: s.programado_inicio ?? null,
        programado_fin: s.programado_fin ?? null,
        caduca_en: s.caduca_en ?? null,
      }
    : {
        estado: "VERDE" as const,
        mensaje: null,
        ultima_actualizacion: null,
        programado_inicio: null,
        programado_fin: null,
        caduca_en: null,
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
    { label: t("breadcrumbHome"), href: "/" },
    { label: t("breadcrumbPueblos"), href: "/pueblos" },
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

  const puebloLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: puebloSafe.nombre,
    description: puebloSafe.descripcion
      ? puebloSafe.descripcion.replace(/<[^>]*>/g, "").slice(0, 300)
      : undefined,
    url: `${getBaseUrl()}/pueblos/${puebloSafe.slug}`,
    image: heroImage || undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: puebloSafe.nombre,
      addressRegion: puebloSafe.provincia,
      addressCountry: "ES",
    },
    ...(puebloSafe.lat && puebloSafe.lng
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: puebloSafe.lat,
            longitude: puebloSafe.lng,
          },
        }
      : {}),
  };

  return (
    <main className="bg-background">
      <JsonLd data={puebloLd} />
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
        semaforoProgramadoInicio={semaforoPueblo.programado_inicio ?? null}
        semaforoProgramadoFin={semaforoPueblo.programado_fin ?? null}
        semaforoCaducaEn={semaforoPueblo.caduca_en ?? null}
      />

      {/* RRSS DEL PUEBLO */}
      {(() => {
        const rrssLinks: { label: string; href: string; icon: React.ReactNode }[] = [];
        const p = pueblo as any;
        if (p.rrssInstagram) rrssLinks.push({
          label: "Instagram", href: p.rrssInstagram,
          icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />,
        });
        if (p.rrssFacebook) rrssLinks.push({
          label: "Facebook", href: p.rrssFacebook,
          icon: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />,
        });
        if (p.rrssTwitter) rrssLinks.push({
          label: "X", href: p.rrssTwitter,
          icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
        });
        if (p.rrssYoutube) rrssLinks.push({
          label: "YouTube", href: p.rrssYoutube,
          icon: <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />,
        });
        if (p.rrssTiktok) rrssLinks.push({
          label: "TikTok", href: p.rrssTiktok,
          icon: <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />,
        });
        if (p.rrssWeb) rrssLinks.push({
          label: "Web", href: p.rrssWeb,
          icon: <><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.75" /><line x1="2" y1="12" x2="22" y2="12" fill="none" stroke="currentColor" strokeWidth="1.75" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" fill="none" stroke="currentColor" strokeWidth="1.75" /></>,
        });

        if (rrssLinks.length === 0) return null;

        return (
          <div className="flex justify-center gap-4 py-4">
            {rrssLinks.map((r) => (
              <a
                key={r.label}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label={r.label}
                title={r.label}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  {r.icon}
                </svg>
              </a>
            ))}
          </div>
        );
      })()}

      {/* EN CIFRAS - Patrimonio y Tradición (V0 - como captura 1) */}
      <DetailStatsBlock
        eyebrow={t("statsEyebrow")}
        title={t("statsTitle")}
        stats={(puebloSafe.highlights ?? []).slice(0, 4).map((h) => {
          const key = STAT_ETIQUETA_TO_KEY[normalizeStatEtiqueta(h.etiqueta)];
          const label = key ? t(`stats.${key}`) : h.etiqueta;
          return { value: h.valor, label };
        })}
        columns={4}
        background="default"
      />

      {/* METEO - Diseño imagen referencia */}
      <MeteoPanel puebloId={puebloSafe.id} />

      {/* TEXTO: Enunciado + Descripción - Diseño tourism-website-design */}
      {(puebloSafe.lead || puebloSafe.descripcion) && (() => {
        const introLead = puebloSafe.lead?.trim() || t("leadFallback");
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
          eyebrow={t("gallery")}
          title={t("galleryTitle", { nombre: puebloSafe.nombre })}
          images={fotosGalería.map((f: FotoPueblo) => ({
            src: f.url,
            alt: `${puebloSafe.nombre} - foto ${f.id}`,
            rotation: f.rotation ?? 0,
          }))}
          layout="featured"
          background="card"
        />
      )}

      {/* Qué ver - Lugares de interés (POIs) - LOS BONITOS Y PERFECTOS */}
      {poisPOI.length > 0 && (
        <PointsOfInterest
          id="lugares-de-interes"
          allHref={`/pueblos/${puebloSafe.slug}/lugares-de-interes`}
          points={poisPOI.map((poi: Poi) => ({
            id: poi.id,
            name: poi.nombre,
            type: (CATEGORIA_TEMATICA_LABELS[poi.categoriaTematica ?? ""] ?? poi.categoria ?? t("pointOfInterest")),
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
          <h2>{t("experienceStops")}</h2>
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
                    {t("noImage")}
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
                    {t("seeDetail")} →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* POIs - Otros */}
      {poisOtros.length > 0 && (
        <section className="mt-8">
          <h2 className="text-foreground font-semibold">{t("others")}</h2>
          <div className="grid gap-5 mt-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
            {poisOtros.map((poi: Poi) => (
              <Link
                key={`${puebloSafe.id}-otros-${poi.id}`}
                href={`/pueblos/${puebloSafe.slug}/pois/${poi.id}`}
                className="flex flex-col overflow-hidden rounded-lg border border-border dark:border-border bg-card no-underline text-inherit transition-shadow hover:shadow-md"
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
                  <div className="w-full h-[200px] flex items-center justify-center bg-muted text-muted-foreground text-sm">
                    {t("noImage")}
                  </div>
                )}

                <div className="p-4">
                  {poi.categoria && (
                    <p className="m-0 mb-2 text-xs text-muted-foreground uppercase tracking-wider">
                      {poi.categoria}
                    </p>
                  )}

                  <h3 className="m-0 text-lg font-semibold leading-snug text-foreground">
                    {poi.nombre}
                  </h3>

                  <p className="mt-3 text-sm text-primary font-medium">
                    {t("seeDetail")} →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Qué hacer en [Pueblo] - Multiexperiencias + Rutas que pasan por el pueblo */}
      <QueHacerSection
        puebloNombre={puebloSafe.nombre}
        puebloSlug={puebloSafe.slug}
        multiexperiencias={puebloSafe.multiexperiencias ?? []}
        rutas={puebloSafe.rutas ?? []}
      />

      {/* Experiencias por categoría - 6 categorías, colores V0 - enlazan a página de categoría */}
      <CategoryHighlights
        id="experiencias-por-categoria"
        categories={[
          {
            type: "nature",
            title: t("categoryNature"),
            description: t("categoryNatureDesc"),
            items: [
              ...(poisPOI.filter((p: Poi) => (p.categoriaTematica ?? "").toUpperCase() === "NATURALEZA").map((p: Poi) => ({ title: p.nombre, href: `/pueblos/${puebloSafe.slug}/pois/${p.id}` }))),
              ...(puebloSafe.multiexperiencias ?? []).filter((m) => (m.multiexperiencia?.categoria ?? "").toUpperCase() === "NATURALEZA").map((m) => ({ title: m.multiexperiencia.titulo, href: `/pueblos/${puebloSafe.slug}/experiencias/${m.multiexperiencia.slug}` })),
              ...(paginasPorCategoria["NATURALEZA"] ?? []).map((p) => ({ title: p.titulo, href: `/pueblos/${puebloSafe.slug}/categoria/naturaleza` })),
            ],
            href: `/pueblos/${puebloSafe.slug}/categoria/naturaleza`,
          },
          {
            type: "culture",
            title: t("categoryCulture"),
            description: t("categoryCultureDesc"),
            items: [
              ...(poisPOI.filter((p: Poi) => (p.categoriaTematica ?? "").toUpperCase() === "CULTURA").map((p: Poi) => ({ title: p.nombre, href: `/pueblos/${puebloSafe.slug}/pois/${p.id}` }))),
              ...(puebloSafe.multiexperiencias ?? []).filter((m) => (m.multiexperiencia?.categoria ?? "").toUpperCase() === "CULTURA").map((m) => ({ title: m.multiexperiencia.titulo, href: `/pueblos/${puebloSafe.slug}/experiencias/${m.multiexperiencia.slug}` })),
              ...(paginasPorCategoria["CULTURA"] ?? []).map((p) => ({ title: p.titulo, href: `/pueblos/${puebloSafe.slug}/categoria/cultura` })),
            ],
            href: `/pueblos/${puebloSafe.slug}/categoria/cultura`,
          },
          {
            type: "family",
            title: t("categoryFamily"),
            description: t("categoryFamilyDesc"),
            items: [
              ...(poisPOI.filter((p: Poi) => (p.categoriaTematica ?? "").toUpperCase() === "EN_FAMILIA").map((p: Poi) => ({ title: p.nombre, href: `/pueblos/${puebloSafe.slug}/pois/${p.id}` }))),
              ...(puebloSafe.multiexperiencias ?? []).filter((m) => (m.multiexperiencia?.categoria ?? "").toUpperCase() === "EN_FAMILIA").map((m) => ({ title: m.multiexperiencia.titulo, href: `/pueblos/${puebloSafe.slug}/experiencias/${m.multiexperiencia.slug}` })),
              ...(paginasPorCategoria["EN_FAMILIA"] ?? []).map((p) => ({ title: p.titulo, href: `/pueblos/${puebloSafe.slug}/categoria/en-familia` })),
            ],
            href: `/pueblos/${puebloSafe.slug}/categoria/en-familia`,
          },
          {
            type: "heritage",
            title: t("categoryHeritage"),
            description: t("categoryHeritageDesc"),
            items: [
              ...(poisPOI.filter((p: Poi) => (p.categoriaTematica ?? "").toUpperCase() === "PATRIMONIO").map((p: Poi) => ({ title: p.nombre, href: `/pueblos/${puebloSafe.slug}/pois/${p.id}` }))),
              ...(puebloSafe.multiexperiencias ?? []).filter((m) => (m.multiexperiencia?.categoria ?? "").toUpperCase() === "PATRIMONIO").map((m) => ({ title: m.multiexperiencia.titulo, href: `/pueblos/${puebloSafe.slug}/experiencias/${m.multiexperiencia.slug}` })),
              ...(paginasPorCategoria["PATRIMONIO"] ?? []).map((p) => ({ title: p.titulo, href: `/pueblos/${puebloSafe.slug}/categoria/patrimonio` })),
            ],
            href: `/pueblos/${puebloSafe.slug}/categoria/patrimonio`,
          },
          {
            type: "petfriendly",
            title: t("categoryPetfriendly"),
            description: t("categoryPetfriendlyDesc"),
            items: [
              ...(poisPOI.filter((p: Poi) => (p.categoriaTematica ?? "").toUpperCase() === "PETFRIENDLY").map((p: Poi) => ({ title: p.nombre, href: `/pueblos/${puebloSafe.slug}/pois/${p.id}` }))),
              ...(puebloSafe.multiexperiencias ?? []).filter((m) => (m.multiexperiencia?.categoria ?? "").toUpperCase() === "PETFRIENDLY").map((m) => ({ title: m.multiexperiencia.titulo, href: `/pueblos/${puebloSafe.slug}/experiencias/${m.multiexperiencia.slug}` })),
              ...(paginasPorCategoria["PETFRIENDLY"] ?? []).map((p) => ({ title: p.titulo, href: `/pueblos/${puebloSafe.slug}/categoria/petfriendly` })),
            ],
            href: `/pueblos/${puebloSafe.slug}/categoria/petfriendly`,
          },
          {
            type: "gastronomy",
            title: t("categoryGastronomy"),
            description: t("categoryGastronomyDesc"),
            items: [
              ...(poisPOI.filter((p: Poi) => (p.categoriaTematica ?? "").toUpperCase() === "GASTRONOMIA").map((p: Poi) => ({ title: p.nombre, href: `/pueblos/${puebloSafe.slug}/pois/${p.id}` }))),
              ...(puebloSafe.multiexperiencias ?? []).filter((m) => (m.multiexperiencia?.categoria ?? "").toUpperCase() === "GASTRONOMIA").map((m) => ({ title: m.multiexperiencia.titulo, href: `/pueblos/${puebloSafe.slug}/experiencias/${m.multiexperiencia.slug}` })),
              ...(paginasPorCategoria["GASTRONOMIA"] ?? []).map((p) => ({ title: p.titulo, href: `/pueblos/${puebloSafe.slug}/categoria/gastronomia` })),
            ],
            href: `/pueblos/${puebloSafe.slug}/categoria/gastronomia`,
          },
        ]}
      />

      {/* MAPA - POIs del pueblo (Leaflet, mismo que lugares-de-interes) */}
      {puebloSafe.lat != null && puebloSafe.lng != null && (
        <div id="mapa">
          <Section spacing="md">
            <Container>
              <div className="mb-6">
                <Title>{t("location")}</Title>
                <Lead className="mt-2">
                  {t("locationIn", { nombre: puebloSafe.nombre, provincia: puebloSafe.provincia, comunidad: puebloSafe.comunidad })}
                </Lead>
              </div>
              <ParadasMap
                paradas={
                  poisPOI.filter((p: Poi) => p.lat != null && p.lng != null).length > 0
                    ? poisPOI
                        .filter((p: Poi) => p.lat != null && p.lng != null)
                        .map((p: Poi) => ({
                          titulo: p.nombre,
                          lat: p.lat!,
                          lng: p.lng!,
                        }))
                    : [{ titulo: puebloSafe.nombre, lat: puebloSafe.lat!, lng: puebloSafe.lng! }]
                }
                puebloNombre={puebloSafe.nombre}
              />
            </Container>
          </Section>
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

      {/* VIDEOS DEL PUEBLO */}
      {(puebloSafe.videos ?? []).length > 0 && (
        <Section spacing="md">
          <Container>
            <Title as="h2" size="xl" className="mb-6">
              {t("videos")}
            </Title>
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
              {(puebloSafe.videos ?? []).map((v) => {
                const embedUrl = (() => {
                  const watchMatch = v.url.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
                  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
                  const shortMatch = v.url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
                  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
                  if (v.url.includes("/embed/")) return v.url;
                  return v.url;
                })();
                return (
                  <div key={v.id} className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="aspect-video w-full bg-muted">
                      <iframe
                        src={embedUrl}
                        title={v.titulo}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold">{v.titulo}</h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </Container>
        </Section>
      )}

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