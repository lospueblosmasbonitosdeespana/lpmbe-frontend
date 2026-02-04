'use client';

import { useMemo } from 'react';

interface SafeHtmlProps {
  html: string;
  className?: string;
}

// Decodifica entidades HTML escapadas (puede estar doblemente escapado)
function decodeHtmlEntities(html: string): string {
  if (!html) return '';
  
  let result = html;
  let prevResult = '';
  
  // Aplicar hasta 3 veces por si está múltiplemente escapado
  for (let i = 0; i < 3 && result !== prevResult; i++) {
    prevResult = result;
    result = result
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
  }
  
  return result;
}

export default function SafeHtml({ html, className = '' }: SafeHtmlProps) {
  const processedHtml = useMemo(() => decodeHtmlEntities(html), [html]);
  
  return (
    <div
      dangerouslySetInnerHTML={{ __html: processedHtml }}
      className={`safe-html-content ${className}`}
    />
  );
}
