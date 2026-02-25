import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { HomePageNew, type NotificationItem, type CategoryCard, type RouteCard, type VillageCard, type NewsItem } from "./_components/home/HomePageNew";
import { getHomeConfig, getHomeVideos } from "@/lib/homeApi";
import { getRutas, getApiUrl, getPueblosLite, getPuebloMainPhoto, type Pueblo } from "@/lib/api";
import { getCanonicalUrl, getLocaleAlternates, DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo";

// Forzar render dinámico para evitar que el build falle si el backend no responde
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const path = "/";
  return {
    title: `${SITE_NAME} – Pueblos, rutas y experiencias`,
    description: DEFAULT_DESCRIPTION,
    alternates: {
      canonical: getCanonicalUrl(path),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title: `${SITE_NAME} – Pueblos, rutas y experiencias`,
      description: DEFAULT_DESCRIPTION,
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
      fetch(`${API_BASE}/public/notificaciones/feed?limit=5&tipos=ALERTA,SEMAFORO${qs}`, { cache: "no-store", headers }),
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
        return item.url || "/notificaciones";
      })(),
      message: (item.motivoPublico?.trim() || item.contenido?.trim()) || undefined,
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
      const da = new Date(a.fechaInicio ?? a.createdAt ?? 0).getTime();
      const db = new Date(b.fechaInicio ?? b.createdAt ?? 0).getTime();
      return db - da;
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

// Fetch galería de asociación: noticias + eventos + artículos, mezclados por fecha, máx 6
async function getGaleriaAsociacion(locale?: string): Promise<NewsItem[]> {
  try {
    const API_BASE = getApiUrl();
    const qs = locale ? `&lang=${encodeURIComponent(locale)}` : "";
    const headers = locale ? { "Accept-Language": locale } : undefined;

    const [resNoticias, resEventos, resArticulos] = await Promise.all([
      fetch(`${API_BASE}/public/noticias?limit=6${qs}`, { cache: "no-store", headers }),
      fetch(`${API_BASE}/public/eventos?limit=6${qs}`, { cache: "no-store", headers }),
      fetch(`${API_BASE}/public/contenidos?scope=ASOCIACION&tipo=ARTICULO&limit=6${qs}`, { cache: "no-store", headers }),
    ]);

    const noticias: any[] = resNoticias.ok ? await resNoticias.json().catch(() => []) : [];
    const eventos: any[] = resEventos.ok ? await resEventos.json().catch(() => []) : [];
    const articulosRaw = resArticulos.ok ? await resArticulos.json().catch(() => []) : [];
    const articulos: any[] = Array.isArray(articulosRaw) ? articulosRaw : (articulosRaw?.items ?? []);

    const all = [
      ...noticias.map((i: any) => ({ ...i, _tipo: "NOTICIA" })),
      ...eventos.map((i: any) => ({ ...i, _tipo: "EVENTO" })),
      ...articulos.map((i: any) => ({ ...i, _tipo: "ARTICULO" })),
    ];

    // Deduplicar por slug
    const seen = new Set<string>();
    const deduped = all.filter((i) => {
      const key = i.slug ?? `id-${i.id}`;
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
      if (item.contenidoSlug) {
        href = `/c/${item.contenidoSlug}`;
      } else if (item.slug) {
        if (tipo === "EVENTO") href = `/eventos/${item.slug}`;
        else if (tipo === "ARTICULO") href = `/c/${item.slug}`;
        else href = `/noticias/${item.slug}`;
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

  return (
    <main>
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

