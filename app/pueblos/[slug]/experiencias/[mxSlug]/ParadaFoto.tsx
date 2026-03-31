'use client';

import { useEffect, useRef, useState } from 'react';
import ZoomableImage from '@/app/components/ZoomableImage';

interface ParadaFotoProps {
  src: string;
  alt: string;
}

function isValidImageUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function ParadaFoto({ src, alt }: ParadaFotoProps) {
  const [failed, setFailed] = useState(() => !isValidImageUrl(src));
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (failed) return;
    const el = wrapperRef.current;
    if (!el) return;
    const img = el.querySelector('img');
    if (!img) return;

    const handleError = () => setFailed(true);
    img.addEventListener('error', handleError);

    if (img.complete && img.naturalWidth === 0) {
      setFailed(true);
    }

    return () => img.removeEventListener('error', handleError);
  }, [failed, src]);

  if (failed) return null;

  return (
    <div ref={wrapperRef}>
      <ZoomableImage
        src={src}
        alt={alt}
        fit="contain"
        wrapperClassName="relative aspect-video w-full"
        className="bg-muted"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
