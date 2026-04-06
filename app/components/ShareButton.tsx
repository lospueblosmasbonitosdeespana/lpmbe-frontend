"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

type ShareButtonProps = {
  url: string;
  title: string;
  variant?: "icon" | "button";
  className?: string;
};

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16,6 12,2 8,6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

export default function ShareButton({ url, title, variant = "icon", className = "" }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const updatePos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const dropH = 260;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < dropH && rect.top > dropH;
    setPos({
      top: openAbove ? rect.top + window.scrollY - dropH - 4 : rect.bottom + window.scrollY + 4,
      left: Math.max(8, Math.min(rect.right + window.scrollX - 208, window.innerWidth - 216)),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        btnRef.current && !btnRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open, updatePos]);

  const fullUrl =
    typeof window !== "undefined" && url.startsWith("/")
      ? `${window.location.origin}${url}`
      : url;
  const encodedUrl = encodeURIComponent(fullUrl);
  const shareText = `${title} ${fullUrl}`;
  const encodedText = encodeURIComponent(shareText);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setOpen(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (typeof window !== "undefined") prompt("Copia esta URL:", fullUrl);
    }
  };

  const handleInstagram = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      setOpen(false);
    } catch {
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    }
  };

  const links = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedText}`,
      icon: (
        <svg className="h-4 w-4 shrink-0 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.103 1.508 5.83L0 24l6.335-1.483A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.65-.5-5.18-1.373l-.37-.22-3.762.882.918-3.666-.242-.38A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
      ),
    },
    {
      label: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodedUrl}`,
      icon: (
        <svg className="h-4 w-4 shrink-0 text-stone-800 dark:text-neutral-200" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: (
        <svg className="h-4 w-4 shrink-0 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
    },
  ];

  const dropdown = open && pos && createPortal(
    <div
      ref={dropdownRef}
      style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999 }}
      className="w-52 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
      role="menu"
      aria-label="Compartir en redes sociales"
    >
      {links.map(({ label, href, icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 transition hover:bg-stone-50 dark:text-neutral-200 dark:hover:bg-neutral-700"
          role="menuitem"
          onClick={() => setOpen(false)}
        >
          {icon}
          {label}
        </a>
      ))}
      <button
        type="button"
        onClick={handleInstagram}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-stone-700 transition hover:bg-stone-50 dark:text-neutral-200 dark:hover:bg-neutral-700"
        role="menuitem"
      >
        <svg className="h-4 w-4 shrink-0 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
        Instagram
      </button>
      <div className="my-1 border-t border-stone-100 dark:border-neutral-700" />
      <button
        type="button"
        onClick={handleCopy}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-stone-700 transition hover:bg-stone-50 dark:text-neutral-200 dark:hover:bg-neutral-700"
        role="menuitem"
      >
        <svg className="h-4 w-4 shrink-0 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        {copied ? '¡Enlace copiado!' : 'Copiar enlace'}
      </button>
    </div>,
    document.body,
  );

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-md text-stone-600 transition hover:bg-stone-100 dark:text-neutral-300 dark:hover:bg-neutral-700 ${
          variant === "button"
            ? "px-3 py-2 text-sm font-medium"
            : "p-2"
        }`}
        aria-label="Compartir en redes sociales"
      >
        <ShareIcon className="h-4 w-4" />
        {variant === "button" && (copied ? "¡Enlace copiado!" : "Compartir")}
      </button>
      {dropdown}
    </div>
  );
}
