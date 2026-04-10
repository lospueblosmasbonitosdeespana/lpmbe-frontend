export type PuebloVideoSeo = {
  id: number;
  titulo: string;
  url?: string | null;
};

function normalizeSlugText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\\s-]/g, "")
    .replace(/\\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getVideoSeoSlug(title: string): string {
  const normalized = normalizeSlugText(title || "");
  return normalized ? normalized.slice(0, 80) : "video";
}

/**
 * Canonical segment for public URLs:
 *   /pueblos/{slug}/videos/{seo-slug}-{id}
 */
export function getCanonicalVideoSegment(video: PuebloVideoSeo): string {
  return `${getVideoSeoSlug(video.titulo)}-${video.id}`;
}

/**
 * Extract a numeric id from route segments:
 *  - "123" (legacy)
 *  - "mi-video-123" (canonical SEO)
 */
export function extractVideoIdFromSegment(segment: string): number | null {
  if (!segment) return null;
  if (/^\\d+$/.test(segment)) return Number(segment);
  const m = segment.match(/-(\\d+)$/);
  if (!m) return null;
  return Number(m[1]);
}

export function extractYoutubeId(url: string): string | null {
  const watchMatch = (url || "").match(/(?:youtube\\.com\\/watch\\?v=)([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = (url || "").match(/youtu\\.be\\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const embedMatch = (url || "").match(/youtube\\.com\\/embed\\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return null;
}
