'use client';

function getYoutubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const patterns = [
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function YoutubeEmbed({ url, title }: { url: string; title?: string }) {
  const videoId = getYoutubeVideoId(url);
  if (!videoId) return null;
  return (
    <div className="relative overflow-hidden rounded-lg border bg-black" style={{ paddingBottom: '56.25%' }}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title ?? 'Vídeo de YouTube'}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
