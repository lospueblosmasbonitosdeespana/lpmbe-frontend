import Link from "next/link";
import type { Metadata } from "next";
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
import { extractYoutubeId, getCanonicalVideoSegment } from "@/lib/video-seo";

export const revalidate = 60;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const tSeo = await getTranslations("seo");
  const name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const path = `/pueblos/${slug}/videos`;
  const title = seoTitle(tSeo("videosTitle", { nombre: name }));
  const description = seoDescription(tSeo("videosDesc", { nombre: name }));

  // Foto OG: thumbnail del primer vídeo (si existe) o foto_destacada del pueblo
  let ogImage: string | null = null;
  let hasVideos = false;
  try {
    const pueblo = await getPuebloBySlug(slug, locale).catch(() => null);
    if (pueblo) {
      const API_BASE = getApiUrl();
      const res = await fetch(`${API_BASE}/pueblos/${pueblo.id}/videos`, { cache: "no-store" });
      if (res?.ok) {
        const videos: Array<{ url?: string }> = await res.json().catch(() => []);
        hasVideos = Array.isArray(videos) && videos.length > 0;
        const firstYtId = videos.map((v) => extractYoutubeId(v.url || "")).find(Boolean);
        if (firstYtId) {
          ogImage = `https://img.youtube.com/vi/${firstYtId}/hqdefault.jpg`;
        }
      }
      if (!ogImage) {
        ogImage = (pueblo as { foto_destacada?: string | null })?.foto_destacada ?? null;
      }
    }
  } catch {
    // noop
  }
  const ogImages = ogImage ? [{ url: ogImage, alt: title }] : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: hasVideos, follow: true },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale as SupportedLocale),
      locale: getOGLocale(locale as SupportedLocale),
      type: "website",
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

type Video = {
  id: number;
  titulo: string;
  url: string;
  thumbnail?: string | null;
  createdAt?: string;
};

function extractYoutubeEmbedUrl(url: string): string {
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  if (url.includes("/embed/")) return url;
  return url;
}

export default async function VideosPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const tPueblo = await getTranslations("puebloPage");
  const API_BASE = getApiUrl();
  const pueblo = await getPuebloBySlug(slug, locale).catch(() => null);
  if (!pueblo) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-bold">
            {uniqueH1ForLocale(tPueblo("h1Videos", { nombre: slug }), locale)}
          </h1>
          <p className="mt-2 text-muted-foreground">
            No se ha podido cargar el pueblo para mostrar los videos.
          </p>
          <Link href="/pueblos" className="mt-4 inline-block text-primary hover:underline">
            Volver a pueblos
          </Link>
        </div>
      </main>
    );
  }

  const videosRes = await fetch(`${API_BASE}/pueblos/${pueblo.id}/videos`);

  let videos: Video[] = [];
  if (videosRes?.ok) {
    try {
      videos = await videosRes.json();
    } catch {
      // ignorar
    }
  }

  const breadcrumbs = [
    { label: "Inicio", href: "/" },
    { label: "Pueblos", href: "/pueblos" },
    { label: pueblo.nombre, href: `/pueblos/${pueblo.slug}` },
    { label: "Videos", href: `/pueblos/${pueblo.slug}/videos` },
  ];

  const base = getBaseUrl();
  const listPath = `/pueblos/${pueblo.slug}/videos`;
  const listUrl = getCanonicalUrl(listPath, locale as SupportedLocale);
  const firstYtId = videos.map((v) => extractYoutubeId(v.url)).find(Boolean);
  const coverFromYt = firstYtId
    ? `https://img.youtube.com/vi/${firstYtId}/hqdefault.jpg`
    : null;
  const coverImage = coverFromYt ?? pueblo.foto_destacada ?? null;

  const collectionLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Videos · ${pueblo.nombre}`,
    description: `Vídeos sobre ${pueblo.nombre}: rincones, rutas y experiencias.`,
    url: listUrl,
    inLanguage: locale,
    ...(coverImage ? { image: coverImage } : {}),
    isPartOf: {
      "@type": "WebSite",
      name: "Los Pueblos Más Bonitos de España",
      url: base,
    },
    about: {
      "@type": "TouristAttraction",
      name: pueblo.nombre,
      url: `${base}/pueblos/${pueblo.slug}`,
    },
    ...(videos.length > 0
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: videos.length,
            itemListElement: videos.slice(0, 50).map((v, i) => {
              const ytId = extractYoutubeId(v.url);
              const seg = getCanonicalVideoSegment(v);
              return {
                "@type": "ListItem",
                position: i + 1,
                url: `${base}/pueblos/${pueblo.slug}/videos/${seg}`,
                name: v.titulo,
                ...(ytId
                  ? { image: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` }
                  : {}),
              };
            }),
          },
        }
      : {}),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: base },
      { "@type": "ListItem", position: 2, name: "Pueblos", item: `${base}/pueblos` },
      { "@type": "ListItem", position: 3, name: pueblo.nombre, item: `${base}/pueblos/${pueblo.slug}` },
      { "@type": "ListItem", position: 4, name: "Videos", item: `${base}${listPath}` },
    ],
  };

  const videoLds = videos.map((v) => {
    const ytId = extractYoutubeId(v.url);
    const thumbnailUrl = ytId
      ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
      : `${base}/brand/logo-favicon.png`;
    const uploadDate = v.createdAt
      ? new Date(v.createdAt).toISOString()
      : "2024-01-01T00:00:00Z";
    return {
      "@context": "https://schema.org",
      "@type": "VideoObject" as const,
      name: v.titulo,
      description: `Video sobre ${pueblo.nombre}: ${v.titulo}.`,
      thumbnailUrl,
      embedUrl: extractYoutubeEmbedUrl(v.url),
      contentUrl: ytId ? `https://www.youtube.com/watch?v=${ytId}` : v.url,
      uploadDate,
    };
  });

  return (
    <main className="min-h-screen bg-background">
      <JsonLd data={collectionLd} />
      <JsonLd data={breadcrumbLd} />
      {videoLds.map((ld, i) => (
        <JsonLd key={i} data={ld} />
      ))}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            {breadcrumbs.map((b, i) => (
              <span key={b.href}>
                {i > 0 && <span className="mx-1">/</span>}
                <Link href={b.href} className="hover:text-foreground">
                  {b.label}
                </Link>
              </span>
            ))}
          </nav>
          <h1 className="text-2xl font-bold">
            {uniqueH1ForLocale(tPueblo("h1Videos", { nombre: pueblo.nombre }), locale)}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Enlaces a videos de YouTube y otras plataformas sobre el pueblo.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {videos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
            <p className="text-muted-foreground">
              Aún no hay videos enlazados para este pueblo.
            </p>
            <Link
              href={`/pueblos/${pueblo.slug}`}
              className="mt-4 inline-block text-primary hover:underline"
            >
              Volver al pueblo
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {videos.map((video) => {
              const embedUrl = extractYoutubeEmbedUrl(video.url);
              const watchHref = `/pueblos/${pueblo.slug}/videos/${getCanonicalVideoSegment(video)}`;
              const card = (
                <>
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
                    <h2 className="font-semibold">{video.titulo}</h2>
                  </div>
                </>
              );
              return (
                <div
                  key={video.id}
                  className="overflow-hidden rounded-lg border border-border bg-card"
                >
                  <Link href={watchHref} className="block">
                    {card}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
