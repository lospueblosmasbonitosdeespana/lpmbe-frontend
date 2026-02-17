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
    const res = await fetch(
      `${API_BASE}/public/notificaciones/feed?limit=10&tipos=NOTICIA,EVENTO,ALERTA,SEMAFORO${qs}`,
      { cache: "no-store", headers: locale ? { "Accept-Language": locale } : undefined }
    );
    if (!res.ok) return [];

    const json = await res.json();
    const items = Array.isArray(json) ? json : (json?.items ?? []);

    return items.slice(0, 8).map((item: any) => ({
      id: item.id ?? item.refId ?? Math.random(),
      date: formatShortDate(item.fecha),
      title: item.titulo ?? "(sin título)",
      type: mapNotificationType(item.tipo),
      href: item.contenidoSlug
        ? `/c/${item.contenidoSlug}`
        : item.url || item.href || "/notificaciones",
      message: (item.motivoPublico?.trim() || item.contenido?.trim()) || undefined,
    }));
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

// Fetch news for actualidad section
async function getNews(locale?: string): Promise<NewsItem[]> {
  try {
    const API_BASE = getApiUrl();
    const qs = locale ? `&lang=${encodeURIComponent(locale)}` : "";
    const res = await fetch(
      `${API_BASE}/public/notificaciones/feed?limit=4&tipos=NOTICIA,EVENTO${qs}`,
      { cache: "no-store", headers: locale ? { "Accept-Language": locale } : undefined }
    );
    if (!res.ok) return [];

    const json = await res.json();
    const items = Array.isArray(json) ? json : (json?.items ?? []);

    return items.slice(0, 4).map((item: any) => {
      // Prioridad: contenido enlazado (artículo completo) > anchor en listado
      const contenidoSlug = item.contenidoSlug ?? item.contenido_slug;
      const href = contenidoSlug
        ? `/c/${contenidoSlug}`
        : item.url || item.href || (item.id ? `/notificaciones#notif-${item.id}` : "/notificaciones");

      return {
        id: item.id ?? item.refId ?? Math.random(),
        title: item.titulo ?? "(sin título)",
        type: item.tipo ?? "NOTICIA",
        href,
        image: item.coverUrl ?? item.imagen ?? item.image ?? null,
        date: item.fecha ?? item.createdAt,
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
  const [config, villages, notifications, routes, news, videos] = await Promise.all([
    getHomeConfig(locale),
    getFeaturedPueblos(locale),
    getNotifications(locale),
    getRoutesForHome(locale),
    getNews(locale),
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
        villages={villages}
        news={news}
        videos={videos}
        mapPreviewImage={config.mapPreviewImage}
        shopBannerImage={config.shopBannerImage}
      />
    </main>
  );
}

