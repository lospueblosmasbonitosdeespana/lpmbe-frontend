import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { HomePageNew, type NotificationItem, type CategoryCard, type RouteCard, type VillageCard, type NewsItem } from "./_components/home/HomePageNew";
import AppDownloadBanner from "./_components/home/AppDownloadBanner";
import { getHomeConfig, getHomeVideos } from "@/lib/homeApi";
import { getRutas, getApiUrl, getPueblosLite, getPuebloMainPhoto, type Pueblo } from "@/lib/api";
import {
  getCanonicalUrl,
  getLocaleAlternates,
  getBaseUrl,
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  type SupportedLocale,
} from "@/lib/seo";
import JsonLd from "./components/seo/JsonLd";

// Forzar render dinámico para evitar que el build falle si el backend no responde
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const path = "/";
  const homeTitleByLocale: Record<string, string> = {
    es: "Los Pueblos Más Bonitos de España — Rutas, experiencias y turismo rural",
    en: "The Most Beautiful Villages of Spain — Routes, experiences and rural tourism",
    fr: "Les Plus Beaux Villages d'Espagne — Routes, expériences et tourisme rural",
    de: "Die Schönsten Dörfer Spaniens — Routen, Erlebnisse und ländlicher Tourismus",
    pt: "As Aldeias Mais Bonitas de Espanha — Rotas, experiências e turismo rural",
    it: "I Borghi Più Belli della Spagna — Itinerari, esperienze e turismo rurale",
    ca: "Els Pobles Més Bonics d'Espanya — Rutes, experiències i turisme rural",
  };
  const homeDescriptionByLocale: Record<string, string> = {
    es: DEFAULT_DESCRIPTION,
    en: "Discover the most beautiful villages in Spain: maps, routes, experiences and travel inspiration.",
    fr: "Decouvrez les plus beaux villages d'Espagne: cartes, routes et experiences pour planifier votre voyage.",
    de: "Entdecken Sie die schonsten Dorfer Spaniens: Karten, Routen und Erlebnisse fur Ihre Reiseplanung.",
    pt: "Descubra as aldeias mais bonitas de Espanha: mapas, rotas e experiencias para planear a sua viagem.",
    it: "Scopri i borghi piu belli della Spagna: mappe, itinerari ed esperienze per il tuo viaggio.",
    ca: "Descobreix els pobles mes bonics d'Espanya: mapes, rutes i experiencies per planificar el viatge.",
  };
  const homeTitle = homeTitleByLocale[locale] ?? homeTitleByLocale.es;
  const homeDescription = homeDescriptionByLocale[locale] ?? homeDescriptionByLocale.es;
  return {
    title: { absolute: homeTitle },
    description: homeDescription,
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title: homeTitle,
      description: homeDescription,
    },
  };
}

// Helper para formatear fecha corta
function formatShortDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

// Fetch featured pueblos (random 4) con fotos desde bulk API
async function getFeaturedPueblos(locale?: string): Promise<VillageCard[]> {
  try {
    const data = await getPueblosLite(locale);
    if (!Array.isArray(data)) return [];

    const API_BASE = getApiUrl();
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 4);

    let photosById: Record<string, { url?: string }> = {};
    if (selected.length > 0) {
      const ids = selected.map((p) => p.id).join(",");
      const photosRes = await fetch(
        `${API_BASE}/public/pueblos/photos?ids=${ids}`,
        { cache: "no-store" }
      );
      if (photosRes.ok) {
        const parsed = (await photosRes.json()) as Record<string, { url?: string }>;
        photosById = parsed;
      }
    }

    return selected.map((p) => {
      const bulkPhoto = photosById[String(p.id)]?.url;
      const image = bulkPhoto || getPuebloMainPhoto(p) || "";
      return {
        slug: p.slug,
        name: p.nombre,
        province: p.provincia,
        image,
        href: `/pueblos/${p.slug}`,
      };
    });
  } catch {
    return [];
  }
}

// Fetch notifications
async function getNotifications(locale?: string): Promise<NotificationItem[]> {
  try {
    const API_BASE = getApiUrl();
    const qs = locale ? `&lang=${encodeURIComponent(locale)}` : "";
    const headers = locale ? { "Accept-Language": locale } : undefined;

    // Noticias y eventos: solo de la asociación (puebloId=null) desde sus endpoints dedicados
    // Alertas y semáforos: del feed general (incluyen los de pueblos)
    const [resNoticias, resEventos, resFeed] = await Promise.all([
      fetch(`${API_BASE}/public/noticias?limit=5${qs}`, { cache: "no-store", headers }),
      fetch(`${API_BASE}/public/eventos?limit=5${qs}`, { cache: "no-store", headers }),
      fetch(`${API_BASE}/public/notificaciones/feed?limit=8&tipos=ALERTA,ALERTA_PUEBLO,SEMAFORO${qs}`, { cache: "no-store", headers }),
    ]);

    const noticias: any[] = resNoticias.ok ? await resNoticias.json().catch(() => []) : [];
    const eventos: any[] = resEventos.ok ? await resEventos.json().catch(() => []) : [];
    const feedItems: any[] = resFeed.ok
      ? await resFeed.json().then((d: any) => (Array.isArray(d) ? d : d?.items ?? [])).catch(() => [])
      : [];

    const mapItem = (item: any, tipo: string): NotificationItem => ({
      id: item.id ?? item.refId ?? Math.random(),
      date: formatShortDate(item.fechaInicio ?? item.fecha ?? item.createdAt),
      title: item.titulo ?? "(sin título)",
      type: mapNotificationType(tipo),
      href: (() => {
        if (item.contenidoSlug) return `/c/${item.contenidoSlug}`;
        if (item.slug) {
          const t = (tipo || '').toUpperCase();
          if (t === 'NOTICIA') return `/noticias/${item.slug}`;
          if (t === 'EVENTO') return `/eventos/${item.slug}`;
          return `/c/${item.slug}`;
        }
        return item.url || "/actualidad";
      })(),
      message: (item.motivoPublico?.trim() || item.contenido?.trim()) || undefined,
      createdAt: item.fechaInicio ?? item.fecha ?? item.createdAt ?? new Date().toISOString(),
    });

    const all: NotificationItem[] = [
      ...noticias.map((i: any) => mapItem(i, "NOTICIA")),
      ...eventos.map((i: any) => mapItem(i, "EVENTO")),
      ...feedItems.map((i: any) => mapItem(i, i.tipo ?? "ALERTA")),
    ].sort((a, b) => {
      // Mantener el orden: primero alertas/semáforos, luego noticias/eventos
      const order: Record<string, number> = { alerta: 0, semaforo: 1, meteo: 2, noticia: 3 };
      return (order[a.type] ?? 3) - (order[b.type] ?? 3);
    });

    return all.slice(0, 8);
  } catch {
    return [];
  }
}

function mapNotificationType(tipo?: string): "noticia" | "semaforo" | "alerta" | "meteo" {
  const t = (tipo || "").toUpperCase();
  if (t === "SEMAFORO") return "semaforo";
  if (t === "ALERTA" || t === "ALERTA_PUEBLO") return "alerta";
  if (t === "METEO") return "meteo";
  return "noticia";
}

// Fetch news for actualidad section — solo contenidos de la asociación (puebloId=null)
async function getNews(locale?: string): Promise<NewsItem[]> {
  try {
    const API_BASE = getApiUrl();
    const qs = locale ? `&lang=${encodeURIComponent(locale)}` : "";

    // Cargamos noticias y eventos de la asociación en paralelo desde sus endpoints dedicados
    const [resNoticias, resEventos] = await Promise.all([
      fetch(`${API_BASE}/public/noticias?limit=4${qs}`, {
        cache: "no-store",
        headers: locale ? { "Accept-Language": locale } : undefined,
      }),
      fetch(`${API_BASE}/public/eventos?limit=4${qs}`, {
        cache: "no-store",
        headers: locale ? { "Accept-Language": locale } : undefined,
      }),
    ]);

    const noticias: any[] = resNoticias.ok ? await resNoticias.json().catch(() => []) : [];
    const eventos: any[] = resEventos.ok ? await resEventos.json().catch(() => []) : [];

    // Mezclar y ordenar por fecha descendente, mostrar máximo 4
    const all = [
      ...noticias.map((item: any) => ({ ...item, _tipo: "NOTICIA" })),
      ...eventos.map((item: any) => ({ ...item, _tipo: "EVENTO" })),
    ].sort((a, b) => {
      const isEventoA = (a._tipo ?? '').toUpperCase() === 'EVENTO';
      const isEventoB = (b._tipo ?? '').toUpperCase() === 'EVENTO';
      if (isEventoA && isEventoB) {
        return new Date(a.fechaInicio ?? a.createdAt ?? 0).getTime() - new Date(b.fechaInicio ?? b.createdAt ?? 0).getTime();
      }
      if (isEventoA) return -1;
      if (isEventoB) return 1;
      return new Date(b.fechaInicio ?? b.createdAt ?? 0).getTime() - new Date(a.fechaInicio ?? a.createdAt ?? 0).getTime();
    });

    return all.slice(0, 4).map((item: any) => {
      const tipo = (item._tipo ?? 'NOTICIA').toUpperCase();
      let href: string;
      if (item.contenidoSlug) {
        href = `/c/${item.contenidoSlug}`;
      } else if (item.slug) {
        href = tipo === 'EVENTO' ? `/eventos/${item.slug}` : `/noticias/${item.slug}`;
      } else {
        href = "/actualidad";
      }

      return {
        id: item.id ?? Math.random(),
        title: item.titulo ?? "(sin título)",
        type: tipo,
        href,
        image: item.coverUrl ?? item.imagen ?? null,
        date: item.fechaInicio ?? item.createdAt,
      };
    });
  } catch {
    return [];
  }
}

// Fetch galería de asociación: busca en AMBAS tablas (Contenido + Notificacion)
async function getGaleriaAsociacion(locale?: string): Promise<NewsItem[]> {
  try {
    const API_BASE = getApiUrl();
    const qs = locale ? `&lang=${encodeURIComponent(locale)}` : "";
    const headers = locale ? { "Accept-Language": locale } : undefined;
    const opts = { cache: "no-store" as const, headers };

    // Buscar en ambas tablas para cada tipo
    const [resContNot, resContEv, resContArt, resNotif, resEvt] = await Promise.all([
      fetch(`${API_BASE}/public/contenidos?scope=ASOCIACION&tipo=NOTICIA&limit=6${qs}`, opts),
      fetch(`${API_BASE}/public/contenidos?scope=ASOCIACION&tipo=EVENTO&limit=6${qs}`, opts),
      fetch(`${API_BASE}/public/contenidos?scope=ASOCIACION&tipo=ARTICULO&limit=6${qs}`, opts),
      fetch(`${API_BASE}/public/noticias?limit=6${qs}`, opts),
      fetch(`${API_BASE}/public/eventos?limit=6${qs}`, opts),
    ]);

    const parse = async (r: Response) => {
      if (!r.ok) return [];
      const j = await r.json().catch(() => []);
      return Array.isArray(j) ? j : (j?.items ?? []);
    };

    // source:'contenido' → /c/slug, source:'notificacion' → /noticias/slug o /eventos/slug
    const all: any[] = [
      ...(await parse(resContNot)).map((i: any) => ({ ...i, _tipo: "NOTICIA", _src: "contenido" })),
      ...(await parse(resContEv)).map((i: any) => ({ ...i, _tipo: "EVENTO", _src: "contenido" })),
      ...(await parse(resContArt)).map((i: any) => ({ ...i, _tipo: "ARTICULO", _src: "contenido" })),
      ...(await parse(resNotif)).map((i: any) => ({ ...i, _tipo: "NOTICIA", _src: "notificacion" })),
      ...(await parse(resEvt)).map((i: any) => ({ ...i, _tipo: "EVENTO", _src: "notificacion" })),
    ];

    // Deduplicar por slug, priorizar contenido (tiene texto completo)
    const seen = new Set<string>();
    const deduped = all.filter((i) => {
      const key = i.slug ?? `${i._src}-${i.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    deduped.sort((a, b) => {
      const da = new Date(a.publishedAt ?? a.fechaInicio ?? a.createdAt ?? 0).getTime();
      const db = new Date(b.publishedAt ?? b.fechaInicio ?? b.createdAt ?? 0).getTime();
      return db - da;
    });

    return deduped.slice(0, 6).map((item: any) => {
      const tipo = (item._tipo ?? "NOTICIA").toUpperCase();
      let href: string;
      if (item._src === "contenido") {
        href = `/c/${item.slug}`;
      } else if (item.slug) {
        href = tipo === "EVENTO" ? `/eventos/${item.slug}` : `/noticias/${item.slug}`;
      } else {
        href = "/actualidad";
      }
      return {
        id: item.id ?? Math.random(),
        title: item.titulo ?? "(sin título)",
        type: tipo,
        href,
        image: item.coverUrl ?? null,
        date: item.publishedAt ?? item.fechaInicio ?? item.createdAt,
      };
    });
  } catch {
    return [];
  }
}

// Fetch routes
async function getRoutesForHome(locale?: string): Promise<RouteCard[]> {
  try {
    const rutas = await getRutas(locale);
    const activas = rutas.filter((r) => r.activo);
    const shuffled = [...activas].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 4);

    return selected.map((r) => ({
      slug: r.slug,
      name: r.titulo,
      image: r.foto_portada || "",
      href: `/rutas/${r.slug}`,
    }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const locale = await getLocale();
  const [config, villages, notifications, routes, news, galeriaNews, videos] = await Promise.all([
    getHomeConfig(locale),
    getFeaturedPueblos(locale),
    getNotifications(locale),
    getRoutesForHome(locale),
    getNews(locale),
    getGaleriaAsociacion(locale),
    getHomeVideos(locale),
  ]);

  // Mapear themes a categories
  const categories: CategoryCard[] = config.themes.map((t) => ({
    slug: t.key,
    name: t.title,
    image: t.image,
    href: t.href,
  }));

  // Slides visibles del hero (máx 4) para el carrusel
  const heroSlides = (config.hero.slides ?? [])
    .filter((s) => s?.image?.trim() && !s?.hidden)
    .slice(0, 4)
    .map((s) => ({ image: s.image, alt: s.alt, link: s?.link }));

  // VideoObject para cada vídeo YouTube en home (asociación) — ayuda a GSC "vídeo en página de visualización"
  const base = getBaseUrl();
  function getEmbedUrlAndId(url: string): { embedUrl: string; videoId: string | null } {
    const watchMatch = (url || "").match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return { embedUrl: `https://www.youtube.com/embed/${watchMatch[1]}`, videoId: watchMatch[1] };
    const shortMatch = (url || "").match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return { embedUrl: `https://www.youtube.com/embed/${shortMatch[1]}`, videoId: shortMatch[1] };
    const embedMatch = (url || "").match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return { embedUrl: url, videoId: embedMatch[1] };
    return { embedUrl: url, videoId: null };
  }
  const homeVideoLds = (videos ?? [])
    .filter((v: { tipo?: string }) => (v.tipo ?? "").toUpperCase() !== "R2")
    .slice(0, 2) // Solo los 2 que se muestran en la sección de vídeos
    .map((v: { id: number; titulo?: string; url?: string }) => {
      const { embedUrl, videoId } = getEmbedUrlAndId(v.url || "");
      if (!embedUrl || !embedUrl.includes("youtube")) return null;
      return {
        "@context": "https://schema.org",
        "@type": "VideoObject" as const,
        name: (v.titulo || "Vídeo – Los Pueblos Más Bonitos de España").slice(0, 200),
        embedUrl,
        thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : undefined,
      };
    })
    .filter(Boolean) as Record<string, unknown>[];

  return (
    <main>
      {homeVideoLds.map((ld, i) => (
        <JsonLd key={i} data={ld} />
      ))}
      <AppDownloadBanner />
      <HomePageNew
        heroSlides={heroSlides}
        heroIntervalMs={config.hero.intervalMs ?? 4000}
        heroTitle={config.hero.title}
        heroSubtitle={config.hero.subtitle}
        notifications={notifications}
        categories={categories}
        routes={routes}
        galeriaNews={galeriaNews}
        villages={villages}
        news={news}
        videos={videos}
        mapPreviewImage={config.mapPreviewImage}
        shopBannerImage={config.shopBannerImage}
      />
    </main>
  );
}

