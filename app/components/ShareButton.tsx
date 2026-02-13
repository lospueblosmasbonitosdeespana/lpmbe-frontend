"use client";

import { useState, useEffect, useRef } from "react";

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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

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
    { label: "WhatsApp", href: `https://wa.me/?text=${encodedText}` },
    { label: "X (Twitter)", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodedUrl}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
  ];

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-md transition hover:bg-muted ${
          variant === "button"
            ? "px-3 py-2 text-sm font-medium"
            : "p-2"
        }`}
        aria-label="Compartir en redes sociales"
      >
        <ShareIcon className={variant === "button" ? "h-4 w-4" : "h-4 w-4"} />
        {variant === "button" && (copied ? "¡Enlace copiado!" : "Compartir")}
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card py-1 shadow-lg"
          role="menu"
          aria-label="Compartir en redes sociales"
        >
          {links.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
          <button
            type="button"
            onClick={handleInstagram}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
            role="menuitem"
          >
            Instagram
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
            role="menuitem"
          >
            Copiar enlace
          </button>
        </div>
      )}
    </div>
  );
}
