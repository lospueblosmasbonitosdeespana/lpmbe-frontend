'use client';

interface SafeHtmlProps {
  html: string;
  className?: string;
}

export default function SafeHtml({ html, className = '' }: SafeHtmlProps) {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      className={`safe-html-content ${className}`}
    />
  );
}
