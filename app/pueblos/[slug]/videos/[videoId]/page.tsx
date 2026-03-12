import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getApiUrl, getPuebloBySlug } from "@/lib/api";
import { getBaseUrl, getCanonicalUrl } from "@/lib/seo";
import JsonLd from "@/app/components/seo/JsonLd";

export const dynamic = "force-dynamic";

type Video = {
  id: number;
  titulo: string;
  url: string;
  thumbnail?: string | null;
};

function extractYoutubeId(url: string): string | null {
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return null;
}

function getEmbedUrl(url: string): string {
  const id = extractYoutubeId(url);
  if (id) return `https://www.youtube.com/embed/${id}`;
  if (url.includes("/embed/")) return url;
  return url;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; videoId: string }>;
}): Promise<Metadata> {
  const { slug, videoId } = await params;
  const locale = await getLocale();
  const API_BASE = getApiUrl();
  const pueblo = await getPuebloBySlug(slug, locale).catch(() => null);
  if (!pueblo) return { title: "Pueblo no encontrado" };

  const videosRes = await fetch(`${API_BASE}/pueblos/${pueblo.id}/videos`, { cache: "no-store" });
  let videos: Video[] = [];
  if (videosRes?.ok) {
    try {
      videos = await videosRes.json();
    } catch {
      // ignore
    }
  }
  const video = videos.find((v) => extractYoutubeId(v.url) === videoId);
  if (!video) return { title: "Video no encontrado" };

  const path = `/pueblos/${pueblo.slug}/videos/${videoId}`;
  const title = `Video: ${video.titulo} | ${pueblo.nombre} | Los Pueblos Más Bonitos de España`;
  const description = `Video sobre ${pueblo.nombre}: ${video.titulo}.`;

  return {
    title,
    description,
    alternates: { canonical: getCanonicalUrl(path) },
    openGraph: {
      title: video.titulo,
      description,
      url: getCanonicalUrl(path),
      type: "video.other",
      videos: videoId
        ? [{ url: `https://www.youtube.com/watch?v=${videoId}` }]
        : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default async function VideoWatchPage({
  params,
}: {
  params: Promise<{ slug: string; videoId: string }>;
}) {
  const { slug, videoId } = await params;
  const locale = await getLocale();
  const API_BASE = getApiUrl();
  const base = getBaseUrl();

  const pueblo = await getPuebloBySlug(slug, locale).catch(() => null);
  if (!pueblo) notFound();

  const videosRes = await fetch(`${API_BASE}/pueblos/${pueblo.id}/videos`, { cache: "no-store" });
  let videos: Video[] = [];
  if (videosRes?.ok) {
    try {
      videos = await videosRes.json();
    } catch {
      // ignore
    }
  }

  const video = videos.find((v) => extractYoutubeId(v.url) === videoId);
  if (!video) notFound();

  const embedUrl = getEmbedUrl(video.url);
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const path = `/pueblos/${pueblo.slug}/videos/${videoId}`;
  const pageUrl = getCanonicalUrl(path);

  const videoLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.titulo,
    description: `Video sobre ${pueblo.nombre}: ${video.titulo}.`,
    thumbnailUrl,
    contentUrl: watchUrl,
    embedUrl,
    url: pageUrl,
    uploadDate: (video as { createdAt?: string }).createdAt ?? "2024-01-01",
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
          <h1 className="text-2xl font-bold">{video.titulo}</h1>
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
