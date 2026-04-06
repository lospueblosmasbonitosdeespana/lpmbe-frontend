"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";

type SemaforoProgramado = {
  id?: string;
  estado: "VERDE" | "AMARILLO" | "ROJO";
  mensaje: string | null;
  motivo?: string | null;
  inicio: string | Date;
  fin: string | Date;
};

type PuebloActionsProps = {
  nombre: string;
  puebloSlug: string;
  puebloId?: number;
  lat: number | null;
  lng: number | null;
  mapAnchorId?: string;
  semaforoEstado?: "VERDE" | "AMARILLO" | "ROJO" | null;
  semaforoMensaje?: string | null;
  semaforoCaducaEn?: string | Date | null;
  semaforoProgramado?: SemaforoProgramado | null;
  semaforoProgramadoEventos?: SemaforoProgramado[];
  alertasActivasCount?: number;
  hasWebcam?: boolean;
};

type ActionBarState = "idle" | "loading" | "success" | "error";

function getSemaforoConfig(
  estado: string | null,
  t: (key: string) => string
): { label: string; mensajeDefault: string; color: string; dotClass: string } | null {
  switch (estado) {
    case "VERDE":
      return {
        label: t("trafficLight.labelGreen"),
        mensajeDefault: t("trafficLight.mensajeVerde"),
        color: "text-green-700",
        dotClass: "bg-green-500",
      };
    case "AMARILLO":
      return {
        label: t("trafficLight.labelYellow"),
        mensajeDefault: t("trafficLight.mensajeAmarillo"),
        color: "text-amber-700",
        dotClass: "bg-amber-500",
      };
    case "ROJO":
      return {
        label: t("trafficLight.labelRed"),
        mensajeDefault: t("trafficLight.mensajeRojo"),
        color: "text-red-700",
        dotClass: "bg-red-500",
      };
    default:
      return null;
  }
}

function formatFecha(fecha: string | Date | null | undefined, locale: string): string | null {
  if (!fecha) return null;
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (isNaN(d.getTime())) return null;
  const loc = locale === "es" ? "es-ES" : locale;
  return d.toLocaleDateString(loc, {
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

function ClubHeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
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
  /** Variante terracota: icono terracota con fondo suave, indica que el recurso existe. */
  accent?: boolean;
}

function ActionButton({ icon, label, state = "idle", onClick, href, external, highlighted = false, accent = false }: ActionButtonProps) {
  const isLoading = state === "loading";
  const isSuccess = state === "success";

  const iconClasses = highlighted
    ? "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors group-hover:bg-primary/90"
    : accent
      ? "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#b45309]/15 text-[#b45309] transition-colors group-hover:bg-[#b45309] group-hover:text-white"
      : "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary group-hover:text-primary-foreground";

  const labelClasses = highlighted
    ? "mt-1 sm:mt-1.5 text-[10px] sm:text-xs font-semibold text-primary transition-colors group-hover:text-primary/80"
    : accent
      ? "mt-1 sm:mt-1.5 text-[10px] sm:text-xs font-semibold text-[#b45309] transition-colors group-hover:text-[#b45309]/80"
      : "mt-1 sm:mt-1.5 text-[10px] sm:text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground";

  const buttonContent = (
    <>
      <span className={iconClasses}>
        {isLoading ? (
          <SpinnerIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        ) : isSuccess ? (
          <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
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
  puebloId,
  lat,
  lng,
  mapAnchorId = "mapa",
  semaforoEstado,
  semaforoMensaje,
  semaforoCaducaEn,
  semaforoProgramado,
  semaforoProgramadoEventos,
  alertasActivasCount = 0,
  hasWebcam = false,
}: PuebloActionsProps) {
  const t = useTranslations("pueblo");
  const locale = useLocale();
  const [shareState, setShareState] = useState<ActionBarState>("idle");
  const [shareDropdownOpen, setShareDropdownOpen] = useState(false);
  const shareDropdownRef = useRef<HTMLDivElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userRol, setUserRol] = useState<string | null>(null);
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
        if (mounted) {
          setIsLoggedIn(res.ok);
          if (res.ok) {
            const data = await res.json().catch(() => null);
            setUserRol(data?.rol ?? null);
          }
        }
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

  const handleInstagramShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      setShareDropdownOpen(false);
    } catch {
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    }
  };

  const tieneCoords = lat !== null && lng !== null;
  const directionsUrl = tieneCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : undefined;
  const mapUrl = `#${mapAnchorId}`;

  const semaforoConfig = semaforoEstado ? getSemaforoConfig(semaforoEstado, t) : null;

  return (
    <>
      <Section spacing="none" className={cn("border-b border-border")}>
        <Container>
          <div className="grid grid-cols-3 gap-3 py-4 sm:flex sm:flex-wrap sm:justify-center sm:gap-6 md:gap-8 lg:gap-12">
            <div className="relative flex flex-col items-center" ref={shareDropdownRef}>
              <ActionButton
                icon={<ShareIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                label={t("actionShare")}
                state={shareState}
                onClick={handleShareClick}
              />
              {shareDropdownOpen && (
                <div
                  className="absolute top-full left-1/2 z-50 mt-2 w-48 -translate-x-1/2 rounded-lg border border-border bg-card py-1 shadow-lg"
                  role="menu"
                  aria-label={t("shareMenuAria")}
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
                    onClick={handleInstagramShare}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                    role="menuitem"
                  >
                    Instagram
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                    role="menuitem"
                  >
                    {t("copyLink")}
                  </button>
                </div>
              )}
            </div>
            <ActionButton
              icon={<VideosIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
              label={t("actionVideos")}
              href={`/pueblos/${puebloSlug}/videos`}
            />
            <ActionButton
              icon={<WebcamIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
              label={t("actionWebcam")}
              href={`/pueblos/${puebloSlug}/webcam`}
              accent={hasWebcam}
            />
            <ActionButton
              icon={<MapIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
              label={t("actionViewOnMap")}
              href={mapUrl}
            />
            <ActionButton
              icon={<DirectionsIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
              label={t("howToGetThere")}
              href={directionsUrl ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nombre)}`}
              external
            />
            {isLoggedIn !== true && (
              <ActionButton
                icon={<BellIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                label={t("actionSubscribe")}
                onClick={() => setShowSuscribirseModal(true)}
              />
            )}
            <ActionButton
              icon={<ClubHeartIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
              label="Club de Amigos"
              href={`/pueblos/${puebloSlug}/club`}
              highlighted
            />
            <div className="flex items-center gap-5">
              <ActionButton
                icon={<NewsIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                label={t("actionActualidad")}
                href={`/pueblos/${puebloSlug}/actualidad`}
                highlighted
              />
              {alertasActivasCount > 0 && (
                <Link
                  href={`/pueblos/${puebloSlug}/alertas`}
                  className="ml-2 inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-amber-700 hover:bg-amber-50"
                  title={`Ver ${alertasActivasCount} alerta${alertasActivasCount === 1 ? "" : "s"}`}
                  aria-label={`Ver ${alertasActivasCount} alerta${alertasActivasCount === 1 ? "" : "s"}`}
                >
                  <AlertTriangleIcon className="h-6 w-6" />
                  <span className="text-base font-semibold leading-none">{alertasActivasCount}</span>
                </Link>
              )}
            </div>
          </div>

          {/* Semáforo turístico: estado en tiempo real */}
          {semaforoConfig && (
            <div className="mt-4 flex items-start justify-center gap-4 rounded-lg border border-border bg-card px-4 py-4">
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
                {semaforoCaducaEn && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {t("semaforoValidUntil")}: {formatFecha(semaforoCaducaEn, locale)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Avisos de eventos programados futuros */}
          {(() => {
            const eventos = semaforoProgramadoEventos && semaforoProgramadoEventos.length > 0
              ? semaforoProgramadoEventos
              : semaforoProgramado ? [semaforoProgramado] : [];
            if (eventos.length === 0) return null;
            return (
              <div className="mt-3 w-full space-y-2">
                {eventos.map((ev, i) => {
                  const progConfig = getSemaforoConfig(ev.estado, t);
                  if (!progConfig) return null;
                  const borderColor = ev.estado === "ROJO" ? "border-red-300" : ev.estado === "AMARILLO" ? "border-amber-300" : "border-green-300";
                  const bgColor = ev.estado === "ROJO" ? "bg-red-50" : ev.estado === "AMARILLO" ? "bg-amber-50" : "bg-green-50";
                  return (
                    <div key={ev.id ?? i} className={cn("rounded-lg border px-4 py-3", borderColor, bgColor)}>
                      <div className="flex items-center justify-center gap-2">
                        <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", progConfig.dotClass)} />
                        <span className={cn("text-sm font-semibold", progConfig.color)}>
                          {t("semaforoScheduledAlert")}
                          {ev.motivo ? ` · ${ev.motivo}` : ''}
                        </span>
                      </div>
                      <p className="mt-1 text-center text-sm text-foreground/80">
                        {ev.mensaje?.trim() || progConfig.mensajeDefault}
                      </p>
                      <span className="mt-1 block text-center text-xs text-muted-foreground">
                        {formatFecha(ev.inicio, locale)} – {formatFecha(ev.fin, locale)}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
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
