"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";

type PuebloActionsProps = {
  nombre: string;
  puebloSlug: string;
  lat: number | null;
  lng: number | null;
  mapAnchorId?: string;
  semaforoEstado?: "VERDE" | "AMARILLO" | "ROJO" | null;
  semaforoMensaje?: string | null;
  semaforoUpdatedAt?: string | Date | null;
  semaforoProgramadoInicio?: string | Date | null;
  semaforoProgramadoFin?: string | Date | null;
  semaforoCaducaEn?: string | Date | null;
};

type ActionBarState = "idle" | "loading" | "success" | "error";

function getSemaforoConfig(estado: string | null) {
  switch (estado) {
    case "VERDE":
      return {
        label: "Baja afluencia",
        mensajeDefault: "Momento ideal para visitar. Poca afluencia turística prevista.",
        color: "text-green-700",
        dotClass: "bg-green-500",
      };
    case "AMARILLO":
      return {
        label: "Afluencia moderada",
        mensajeDefault: "Afluencia turística moderada. Conviene planificar la visita.",
        color: "text-amber-700",
        dotClass: "bg-amber-500",
      };
    case "ROJO":
      return {
        label: "Alta afluencia",
        mensajeDefault: "Alta afluencia turística. Se recomienda evitar horas punta.",
        color: "text-red-700",
        dotClass: "bg-red-500",
      };
    default:
      return null;
  }
}

function formatActualizado(updatedAt: string | Date | null | undefined): string | null {
  if (!updatedAt) return null;
  const d = typeof updatedAt === "string" ? new Date(updatedAt) : updatedAt;
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Actualizado: Ahora mismo";
  if (diffMins < 60) return `Actualizado: Hace ${diffMins} min`;
  if (diffHours < 24) return `Actualizado: Hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
  if (diffDays < 7) return `Actualizado: Hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
  return `Actualizado: ${d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`;
}

function formatFecha(fecha: string | Date | null | undefined): string | null {
  if (!fecha) return null;
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ----- ICONS ----- */
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16,6 12,2 8,6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function MapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2 1,6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

function VideosIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23,7 16,12 23,17 23,7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function WebcamIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="8" />
      <circle cx="12" cy="10" r="3" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

function DirectionsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

function NewsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="1" />
    </svg>
  );
}

/* ----- ACTION BUTTON ----- */
interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  state?: ActionBarState;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  highlighted?: boolean;
}

function ActionButton({ icon, label, state = "idle", onClick, href, external, highlighted = false }: ActionButtonProps) {
  const isLoading = state === "loading";
  const isSuccess = state === "success";

  const iconClasses = highlighted
    ? "flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors group-hover:bg-primary/90"
    : "flex h-10 w-10 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary group-hover:text-primary-foreground";

  const labelClasses = highlighted
    ? "mt-1.5 text-xs font-semibold text-primary transition-colors group-hover:text-primary/80"
    : "mt-1.5 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground";

  const buttonContent = (
    <>
      <span className={iconClasses}>
        {isLoading ? (
          <SpinnerIcon className="h-5 w-5" />
        ) : isSuccess ? (
          <CheckIcon className="h-5 w-5" />
        ) : (
          icon
        )}
      </span>
      <span className={labelClasses}>
        {isSuccess ? "Hecho" : label}
      </span>
    </>
  );

  const baseClasses = "group flex flex-col items-center";

  if (href) {
    return (
      <Link
        href={href}
        className={baseClasses}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {buttonContent}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={baseClasses} disabled={isLoading}>
      {buttonContent}
    </button>
  );
}

export default function PuebloActions({
  nombre,
  puebloSlug,
  lat,
  lng,
  mapAnchorId = "mapa",
  semaforoEstado,
  semaforoMensaje,
  semaforoUpdatedAt,
  semaforoProgramadoInicio,
  semaforoProgramadoFin,
  semaforoCaducaEn,
}: PuebloActionsProps) {
  const [shareState, setShareState] = useState<ActionBarState>("idle");
  const [shareDropdownOpen, setShareDropdownOpen] = useState(false);
  const shareDropdownRef = useRef<HTMLDivElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showSuscribirseModal, setShowSuscribirseModal] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target as Node)) {
        setShareDropdownOpen(false);
      }
    }
    if (shareDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [shareDropdownOpen]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (mounted) setIsLoggedIn(res.ok);
      } catch {
        if (mounted) setIsLoggedIn(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `Descubre ${nombre}`;

  const handleShareClick = () => {
    setShareDropdownOpen((open) => !open);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareState("success");
      setShareDropdownOpen(false);
      setTimeout(() => setShareState("idle"), 2000);
    } catch {
      if (typeof window !== "undefined") prompt("Copia esta URL:", shareUrl);
    }
  };

  const encodedUrl = typeof window !== "undefined" ? encodeURIComponent(shareUrl) : "";
  const encodedText = encodeURIComponent(`${shareText} ${shareUrl}`);
  const shareLinks = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodedText}` },
    { label: "X (Twitter)", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodedUrl}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
  ];

  const tieneCoords = lat !== null && lng !== null;
  const directionsUrl = tieneCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : undefined;
  const mapUrl = `#${mapAnchorId}`;

  const semaforoConfig = semaforoEstado ? getSemaforoConfig(semaforoEstado) : null;

  return (
    <>
      <Section spacing="none" className={cn("border-b border-border")}>
        <Container>
          <div className="flex items-center justify-center gap-8 py-4 sm:gap-12">
            <div className="relative flex flex-col items-center" ref={shareDropdownRef}>
              <ActionButton
                icon={<ShareIcon className="h-5 w-5" />}
                label="Compartir"
                state={shareState}
                onClick={handleShareClick}
              />
              {shareDropdownOpen && (
                <div
                  className="absolute top-full left-1/2 z-50 mt-2 w-48 -translate-x-1/2 rounded-lg border border-border bg-card py-1 shadow-lg"
                  role="menu"
                  aria-label="Compartir en redes sociales"
                >
                  {shareLinks.map(({ label, href }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                      role="menuitem"
                      onClick={() => setShareDropdownOpen(false)}
                    >
                      {label}
                    </a>
                  ))}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                    role="menuitem"
                  >
                    Copiar enlace
                  </button>
                </div>
              )}
            </div>
            <ActionButton
              icon={<VideosIcon className="h-5 w-5" />}
              label="Videos"
              href={`/pueblos/${puebloSlug}/videos`}
            />
            <ActionButton
              icon={<WebcamIcon className="h-5 w-5" />}
              label="Webcam"
              href={`/pueblos/${puebloSlug}/webcam`}
            />
            <ActionButton
              icon={<MapIcon className="h-5 w-5" />}
              label="Ver en mapa"
              href={mapUrl}
            />
            <ActionButton
              icon={<DirectionsIcon className="h-5 w-5" />}
              label="Cómo llegar"
              href={directionsUrl ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nombre)}`}
              external
            />
            {isLoggedIn !== true && (
              <ActionButton
                icon={<BellIcon className="h-5 w-5" />}
                label="Suscribirse"
                onClick={() => setShowSuscribirseModal(true)}
              />
            )}
            <ActionButton
              icon={<NewsIcon className="h-5 w-5" />}
              label="Actualidad"
              href={`/pueblos/${puebloSlug}/actualidad`}
              highlighted
            />
          </div>

          {/* Semáforo turístico - V0: label + mensaje + actualizado */}
          {semaforoConfig && (
            <div className="mt-4 flex items-start justify-center gap-4 rounded-lg border border-border bg-card px-4 py-4">
              {/* Indicador visual del semáforo */}
              <div className="flex flex-col gap-1 rounded-full bg-foreground/90 p-1.5 shrink-0">
                <div className={cn(
                  "h-3 w-3 rounded-full transition-opacity",
                  semaforoEstado === "ROJO" ? "bg-red-500" : "bg-red-500/20"
                )} />
                <div className={cn(
                  "h-3 w-3 rounded-full transition-opacity",
                  semaforoEstado === "AMARILLO" ? "bg-amber-500" : "bg-amber-500/20"
                )} />
                <div className={cn(
                  "h-3 w-3 rounded-full transition-opacity",
                  semaforoEstado === "VERDE" ? "bg-green-500" : "bg-green-500/20"
                )} />
              </div>
              {/* Texto: label + mensaje + actualizado */}
              <div className="flex-1 min-w-0 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-semibold", semaforoConfig.color)}>
                    {semaforoConfig.label}
                  </span>
                  <span className={cn("h-2 w-2 rounded-full shrink-0", semaforoConfig.dotClass)} />
                </div>
                <p className="mt-0.5 text-sm text-foreground/80">
                  {semaforoMensaje?.trim() || semaforoConfig.mensajeDefault}
                </p>
                {(semaforoProgramadoInicio && semaforoProgramadoFin) && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Programado: {formatFecha(semaforoProgramadoInicio)} – {formatFecha(semaforoProgramadoFin)}
                  </span>
                )}
                {!semaforoProgramadoInicio && semaforoCaducaEn && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Vigente hasta: {formatFecha(semaforoCaducaEn)}
                  </span>
                )}
                {formatActualizado(semaforoUpdatedAt) && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {formatActualizado(semaforoUpdatedAt)}
                  </span>
                )}
              </div>
            </div>
          )}
        </Container>
      </Section>

      {/* Modal Suscribirse */}
      {showSuscribirseModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
          onClick={() => setShowSuscribirseModal(false)}
        >
          <div
            className="mx-4 max-w-md rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-5 text-base leading-relaxed text-gray-800">
              Si quieres recibir noticias, alertas o eventos de {nombre}, has de crear una cuenta.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSuscribirseModal(false)}
                className="rounded-lg border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Cerrar
              </button>
              <Link
                href="/entrar"
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Crear cuenta / Entrar
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
