'use client';

interface SafeHtmlProps {
  html: string;
  className?: string;
}

export default function SafeHtml({ html, className = '' }: SafeHtmlProps) {
  // Si el HTML tiene entidades escapadas (&lt; &gt;), las decodificamos UNA sola vez
  let processedHtml = html || '';
  
  // Solo decodificar si detectamos entidades escapadas de etiquetas (no comillas)
  if (processedHtml.includes('&lt;') || processedHtml.includes('&gt;')) {
    processedHtml = processedHtml
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }
  
  return (
    <div
      dangerouslySetInnerHTML={{ __html: processedHtml }}
      className={`safe-html-content ${className}`}
    />
  );
}
