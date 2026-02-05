import { headers } from "next/headers";
import { HomePageNew, type NotificationItem, type CategoryCard, type RouteCard, type VillageCard, type NewsItem } from "./_components/home/HomePageNew";
import { getHomeConfig } from "@/lib/homeApi";
import { getRutas, getApiUrl, getPuebloMainPhoto, type Pueblo } from "@/lib/api";

// Forzar render dinámico para evitar que el build falle si el backend no responde
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Helper para formatear fecha corta
function formatShortDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

// Fetch featured pueblos (random 4) con fotos desde bulk API
async function getFeaturedPueblos(): Promise<VillageCard[]> {
  const API_BASE = getApiUrl();
  try {
    const res = await fetch(`${API_BASE}/pueblos`, { cache: "no-store" });
    if (!res.ok) return [];

    const data = (await res.json()) as Pueblo[];
    if (!Array.isArray(data)) return [];

    // Random shuffle + primeros 4
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 4);

    // Obtener fotos desde bulk API (incluye fotos de galería cuando foto_destacada es null)
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
async function getNotifications(): Promise<NotificationItem[]> {
  try {
    const API_BASE = getApiUrl();
    const res = await fetch(
      `${API_BASE}/public/notificaciones/feed?limit=10&tipos=NOTICIA,EVENTO,ALERTA,ALERTA_PUEBLO,SEMAFORO`,
      { cache: "no-store" }
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
      message: item.motivoPublico?.trim() || undefined,
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
async function getNews(): Promise<NewsItem[]> {
  try {
    const API_BASE = getApiUrl();
    const res = await fetch(
      `${API_BASE}/public/notificaciones/feed?limit=4&tipos=NOTICIA,EVENTO`,
      { cache: "no-store" }
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
async function getRoutesForHome(): Promise<RouteCard[]> {
  try {
    const rutas = await getRutas();
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
  // Cargar todos los datos en paralelo
  const [config, villages, notifications, routes, news] = await Promise.all([
    getHomeConfig(),
    getFeaturedPueblos(),
    getNotifications(),
    getRoutesForHome(),
    getNews(),
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
    .map((s) => ({ image: s.image, alt: s.alt }));

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
        mapPreviewImage={config.mapPreviewImage}
        shopBannerImage={config.shopBannerImage}
      />
    </main>
  );
}

