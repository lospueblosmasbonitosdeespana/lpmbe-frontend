import Link from "next/link";
import { notFound } from "next/navigation";
import { getApiUrl, getPuebloBySlug } from "@/lib/api";

export const dynamic = "force-dynamic";

type Video = {
  id: number;
  titulo: string;
  url: string;
  thumbnail?: string | null;
};

function extractYoutubeEmbedUrl(url: string): string {
  // youtube.com/watch?v=ID
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }
  // youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }
  // Ya es embed
  if (url.includes("/embed/")) {
    return url;
  }
  return url;
}

export default async function VideosPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const API_BASE = getApiUrl();

  const pueblo = await getPuebloBySlug(slug).catch(() => null);
  if (!pueblo) {
    notFound();
  }

  const videosRes = await fetch(`${API_BASE}/pueblos/${pueblo.id}/videos`, {
    cache: "no-store",
  });

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

  return (
    <main className="min-h-screen bg-background">
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
          <h1 className="text-2xl font-bold">Videos de {pueblo.nombre}</h1>
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
              return (
                <div
                  key={video.id}
                  className="overflow-hidden rounded-lg border border-border bg-card"
                >
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
