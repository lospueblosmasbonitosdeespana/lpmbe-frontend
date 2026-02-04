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
        'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'a', 'img',
        'blockquote', 'code', 'pre',
        'div', 'span', 'hr',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
      ],
      ALLOWED_ATTR: [
        'href', 'target', 'rel',
        'src', 'alt', 'title', 'width', 'height',
        'class', 'id',
      ],
      ALLOW_DATA_ATTR: false,
    });

    containerRef.current.innerHTML = clean;

    // Añadir target="_blank" a enlaces externos
    const links = containerRef.current.querySelectorAll('a[href]');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={`
        prose prose-lg max-w-none
        prose-headings:font-semibold prose-headings:tracking-tight
        prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4
        prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3
        prose-p:leading-relaxed prose-p:mb-4
        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
        prose-strong:font-semibold prose-strong:text-gray-900
        prose-ul:my-4 prose-ol:my-4
        prose-li:my-1
        prose-img:rounded-lg prose-img:shadow-sm
        ${className}
      `}
    />
  );
}
