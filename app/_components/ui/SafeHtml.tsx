'use client';

import DOMPurify from 'dompurify';
import { useEffect, useRef } from 'react';

interface SafeHtmlProps {
  html: string;
  className?: string;
}

export default function SafeHtml({ html, className = '' }: SafeHtmlProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Configuración de DOMPurify
    const clean = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'b', 'i', 'u',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'a', 'img',
        'blockquote', 'code', 'pre',
        'div', 'span',
      ],
      ALLOWED_ATTR: [
        'href', 'target', 'rel',
        'src', 'alt', 'title', 'width', 'height',
        'class',
      ],
      ALLOW_DATA_ATTR: false,
    });

    containerRef.current.innerHTML = clean;
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={`prose prose-lg max-w-none ${className}`}
    />
  );
}
