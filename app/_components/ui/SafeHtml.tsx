'use client';

import { useEffect, useRef } from 'react';

interface SafeHtmlProps {
  html: string;
  className?: string;
}

// Lista blanca de tags permitidos
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'img',
  'blockquote', 'code', 'pre',
  'div', 'span', 'hr',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
]);

// Lista blanca de atributos permitidos
const ALLOWED_ATTRS = new Set([
  'href', 'target', 'rel',
  'src', 'alt', 'title', 'width', 'height',
  'class', 'style',
]);

function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    // En servidor, devolver el HTML tal cual (se sanitizará en cliente)
    return html;
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');
  
  // Función recursiva para limpiar nodos
  function cleanNode(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.cloneNode();
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }
    
    const el = node as Element;
    const tagName = el.tagName.toLowerCase();
    
    if (!ALLOWED_TAGS.has(tagName)) {
      // Si el tag no está permitido, solo devolver su contenido
      const fragment = document.createDocumentFragment();
      el.childNodes.forEach(child => {
        const cleaned = cleanNode(child);
        if (cleaned) fragment.appendChild(cleaned);
      });
      return fragment;
    }
    
    // Crear elemento limpio
    const cleanEl = document.createElement(tagName);
    
    // Copiar solo atributos permitidos
    Array.from(el.attributes).forEach(attr => {
      if (ALLOWED_ATTRS.has(attr.name.toLowerCase())) {
        cleanEl.setAttribute(attr.name, attr.value);
      }
    });
    
    // Limpiar hijos recursivamente
    el.childNodes.forEach(child => {
      const cleaned = cleanNode(child);
      if (cleaned) cleanEl.appendChild(cleaned);
    });
    
    return cleanEl;
  }
  
  const fragment = document.createDocumentFragment();
  doc.body.childNodes.forEach(child => {
    const cleaned = cleanNode(child);
    if (cleaned) fragment.appendChild(cleaned);
  });
  
  const temp = document.createElement('div');
  temp.appendChild(fragment);
  return temp.innerHTML;
}

export default function SafeHtml({ html, className = '' }: SafeHtmlProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    // Sanitizar y asignar HTML
    const clean = sanitizeHtml(html);
    containerRef.current.innerHTML = clean;

    // Post-procesamiento
    const links = containerRef.current.querySelectorAll('a[href]');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });

    // Estilos a imágenes
    const images = containerRef.current.querySelectorAll('img');
    images.forEach((img) => {
      img.classList.add('editor-image');
      if (!img.style.maxWidth) {
        img.style.maxWidth = '800px';
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.borderRadius = '0.5rem';
        img.style.margin = '1rem 0';
        img.style.display = 'block';
      }
    });
  }, [html]);

  // Renderizado inicial con HTML sin procesar (se procesará en useEffect)
  return (
    <div
      ref={containerRef}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
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
        ${className}
      `}
    />
  );
}
