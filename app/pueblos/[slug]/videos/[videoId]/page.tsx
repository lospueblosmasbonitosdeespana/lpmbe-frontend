import Link from "next/link";
import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getApiUrl, getPuebloBySlug } from "@/lib/api";
import {
  getBaseUrl,
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoDescription,
  seoTitle,
  uniqueH1ForLocale,
  type SupportedLocale,
} from "@/lib/seo";
import JsonLd from "@/app/components/seo/JsonLd";
import {
  extractVideoIdFromSegment,
  extractYoutubeId,
  getCanonicalVideoSegment,
} from "@/lib/video-seo";

export const dynamic = "force-dynamic";

type Video = {
  id: number;
  titulo: string;
  url: string;
  thumbnail?: string | null;
};

function getEmbedUrl(url: string): string {
  const id = extractYoutubeId(url);
  if (id) return `https://www.youtube.com/embed/${id}`;
  if (url.includes("/embed/")) return url;
  return url;
}

/** Resuelve por id numérico de BD o por id de YouTube (rutas antiguas). */
function resolveVideo(videos: Video[], segment: string): Video | undefined {
  const idFromSegment = extractVideoIdFromSegment(segment);
  if (idFromSegment !== null) {
    const id = idFromSegment;
    const byId = videos.find((v) => v.id === id);
    if (byId) return byId;
  }
  return videos.find((v) => extractYoutubeId(v.url) === segment);
}

async function fetchPuebloVideos(slug: string, locale: string | undefined) {
  const pueblo = await getPuebloBySlug(slug, locale).catch(() => null);
  if (!pueblo) return { pueblo: null as Awaited<ReturnType<typeof getPuebloBySlug>> | null, videos: [] as Video[] };
  const API_BASE = getApiUrl();
  const videosRes = await fetch(`${API_BASE}/pueblos/${pueblo.id}/videos`, { cache: "no-store" });
  let videos: Video[] = [];
  if (videosRes?.ok) {
    try {
      videos = await videosRes.json();
    } catch {
      // ignore
    }
  }
  return { pueblo, videos };
}

function withPreservedSearch(path: string, sp: Record<string, string | string[] | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string" && v) q.set(k, v);
    else if (Array.isArray(v) && v[0]) q.set(k, v[0]);
  }
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; videoId: string }>;
}): Promise<Metadata> {
  const { slug, videoId } = await params;
  const locale = await getLocale();
  const tSeo = await getTranslations("seo");
  const name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const { pueblo, videos } = await fetchPuebloVideos(slug, locale);
  const video = pueblo ? resolveVideo(videos, videoId) : undefined;
  const canonicalSeg = video ? getCanonicalVideoSegment(video) : videoId;
  const path = `/pueblos/${slug}/videos/${canonicalSeg}`;
  const ytId = video ? extractYoutubeId(video.url) : null;
  const title = video
    ? seoTitle(`${video.titulo} · ${name}`)
    : seoTitle(tSeo("videosTitle", { nombre: name }));
  const description = video
    ? seoDescription(`${video.titulo} · ${name}`)
    : seoDescription(tSeo("videosDesc", { nombre: name }));
  const hasVideoData = Boolean(video);

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale as SupportedLocale),
      locale: getOGLocale(locale as SupportedLocale),
      type: hasVideoData ? "video.other" : "article",
      videos: ytId ? [{ url: `https://www.youtube.com/watch?v=${ytId}` }] : undefined,
    },
    robots: { index: hasVideoData, follow: true },
  };
}

export default async function VideoWatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; videoId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug, videoId } = await params;
  const sp = await searchParams;
  const locale = await getLocale();
  const API_BASE = getApiUrl();
  const base = getBaseUrl();

  const pueblo = await getPuebloBySlug(slug, locale).catch(() => null);
  if (!pueblo) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-bold">{uniqueH1ForLocale("Video", locale)}</h1>
          <p className="mt-2 text-muted-foreground">No se ha podido cargar el pueblo para mostrar el video.</p>
          <Link href="/pueblos" className="mt-4 inline-block text-primary hover:underline">
            Volver a pueblos
          </Link>
        </div>
      </main>
    );
  }

  const videosRes = await fetch(`${API_BASE}/pueblos/${pueblo.id}/videos`, { cache: "no-store" });
  let videos: Video[] = [];
  if (videosRes?.ok) {
    try {
      videos = await videosRes.json();
    } catch {
      // ignore
    }
  }

  const video = resolveVideo(videos, videoId);
  if (!video) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-bold">{uniqueH1ForLocale("Video no disponible", locale)}</h1>
          <p className="mt-2 text-muted-foreground">No se ha encontrado el video solicitado.</p>
          <Link href={`/pueblos/${pueblo.slug}/videos`} className="mt-4 inline-block text-primary hover:underline">
            Ver todos los videos
          </Link>
        </div>
      </main>
    );
  }

  const canonicalSeg = getCanonicalVideoSegment(video);
  if (videoId !== canonicalSeg) {
    permanentRedirect(withPreservedSearch(`/pueblos/${pueblo.slug}/videos/${canonicalSeg}`, sp));
  }

  const embedUrl = getEmbedUrl(video.url);
  const ytId = extractYoutubeId(video.url);
  const watchUrl = ytId ? `https://www.youtube.com/watch?v=${ytId}` : video.url;
  const thumbnailUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : "";
  const path = `/pueblos/${pueblo.slug}/videos/${canonicalSeg}`;
  const pageUrl = getCanonicalUrl(path, locale as SupportedLocale);

  const rawDate = (video as { createdAt?: string }).createdAt;
  const uploadDate = rawDate
    ? new Date(rawDate).toISOString()
    : "2024-01-01T00:00:00Z";

  const videoLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.titulo,
    description: `Video sobre ${pueblo.nombre}: ${video.titulo}.`,
    thumbnailUrl: thumbnailUrl || `${base}/brand/logo-favicon.png`,
    contentUrl: watchUrl,
    embedUrl,
    url: pageUrl,
    uploadDate,
    publisher: {
      "@type": "Organization",
      name: "Los Pueblos Más Bonitos de España",
      url: base,
    },
  };

  const breadcrumbs = [
    { label: "Inicio", href: "/" },
    { label: "Pueblos", href: "/pueblos" },
    { label: pueblo.nombre, href: `/pueblos/${pueblo.slug}` },
    { label: "Videos", href: `/pueblos/${pueblo.slug}/videos` },
    { label: video.titulo, href: path },
  ];

  return (
    <main className="min-h-screen bg-background">
      <JsonLd data={videoLd} />
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            {breadcrumbs.map((b, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-1">/</span>}
                <Link href={b.href} className="hover:text-foreground">
                  {b.label}
                </Link>
              </span>
            ))}
          </nav>
          <h1 className="text-2xl font-bold">{uniqueH1ForLocale(video.titulo, locale)}</h1>
          <p className="mt-1 text-muted-foreground">
            Video de {pueblo.nombre} · Los Pueblos Más Bonitos de España
          </p>
        </div>
      </div>

      <article className="mx-auto max-w-4xl px-4 py-8">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="aspect-video w-full bg-muted">
            <iframe
              src={embedUrl}
              title={video.titulo}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-4">
            <p className="text-muted-foreground">
              <Link href={`/pueblos/${pueblo.slug}`} className="text-primary hover:underline">
                Ver ficha de {pueblo.nombre}
              </Link>
              {" · "}
              <Link href={`/pueblos/${pueblo.slug}/videos`} className="text-primary hover:underline">
                Todos los videos
              </Link>
            </p>
          </div>
        </div>
      </article>
    </main>
  );
}
