'use client';

interface SafeHtmlProps {
  html: string;
  className?: string;
}

export default function SafeHtml({ html, className = '' }: SafeHtmlProps) {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      className={`
        prose prose-lg max-w-none
        prose-headings:font-semibold prose-headings:tracking-tight
        prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4
        prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3
        prose-p:leading-relaxed prose-p:mb-4
        prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800
        prose-strong:font-semibold prose-strong:text-gray-900
        prose-ul:my-4 prose-ol:my-4
        prose-li:my-1
        prose-img:rounded-lg prose-img:shadow-sm prose-img:max-w-full
        ${className}
      `}
    />
  );
}
