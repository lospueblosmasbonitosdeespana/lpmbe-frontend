"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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
};

type ActionBarState = "idle" | "loading" | "success" | "error";

function getSemaforoConfig(estado: string | null) {
  switch (estado) {
    case "VERDE":
      return { texto: "Tranquilo", color: "#28a745", bgColor: "#d4edda" };
    case "AMARILLO":
      return { texto: "Precaución", color: "#ffc107", bgColor: "#fff3cd" };
    case "ROJO":
      return { texto: "Alta afluencia", color: "#dc3545", bgColor: "#f8d7da" };
    default:
      return null;
  }
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
}: PuebloActionsProps) {
  const [shareState, setShareState] = useState<ActionBarState>("idle");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showSuscribirseModal, setShowSuscribirseModal] = useState(false);

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

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = `${nombre} | Los Pueblos Más Bonitos de España`;
    const text = `Descubre ${nombre}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        setShareState("success");
        setTimeout(() => setShareState("idle"), 2000);
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareState("success");
      setTimeout(() => setShareState("idle"), 2000);
    } catch {
      prompt("Copia esta URL:", url);
    }
  };

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
            <ActionButton
              icon={<ShareIcon className="h-5 w-5" />}
              label="Compartir"
              state={shareState}
              onClick={handleShare}
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

          {/* Semáforo turístico */}
          {semaforoConfig && (
            <div
              className="mt-4 flex items-center justify-center gap-2 rounded-lg border-2 py-2 px-4"
              style={{
                borderColor: semaforoConfig.color,
                backgroundColor: semaforoConfig.bgColor,
              }}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: semaforoConfig.color }}
              />
              <span className="text-sm font-medium" style={{ color: semaforoConfig.color }}>
                Semáforo turístico · {semaforoConfig.texto}
              </span>
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
