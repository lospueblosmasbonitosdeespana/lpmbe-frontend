"use client";

import { useEffect, useRef, useState } from "react";

const DISMISS_KEY = "app_download_banner_dismissed_until";
const DISMISS_DAYS = 7;

const APP_SMART_PATH = "/app";
const APP_STORE_URL =
  "https://apps.apple.com/es/app/los-pueblos-m%C3%A1s-bonitos-de-esp/id6755147967";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=app.rork.pueblos_bonitos_app";

type MobilePlatform = "ios" | "android" | "other";

function detectPlatform(): MobilePlatform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

/**
 * Banner de descarga de app.
 *
 * OPTIMIZADO PARA CLS (Core Web Vitals):
 * - No se renderiza en SSR ni en el primer render cliente (evita layout shift tras hidratación).
 * - Posición fixed bottom: NO empuja el layout del documento, por lo que no genera CLS
 *   aunque aparezca/desaparezca.
 * - Tras hidratación, se comprueba localStorage y se muestra el banner con una
 *   transición suave solo si el usuario no lo cerró previamente.
 */
export default function AppDownloadBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<MobilePlatform>("other");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;
    setMounted(true);

    setPlatform(detectPlatform());

    let shouldShow = true;
    try {
      const dismissedUntil = localStorage.getItem(DISMISS_KEY);
      if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
        shouldShow = false;
      }
    } catch {}

    if (shouldShow && typeof window !== "undefined") {
      setQrUrl(
        `https://quickchart.io/qr?size=180&text=${encodeURIComponent(
          `${window.location.origin}${APP_SMART_PATH}`
        )}`
      );
      // Pequeño delay para separar la aparición de la pintura inicial y
      // asegurar que el banner no afecta el CLS del primer viewport.
      const t = window.setTimeout(() => setVisible(true), 400);
      return () => window.clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem(DISMISS_KEY, String(until));
    } catch {}
    setVisible(false);
  };

  if (!mounted || !visible) return null;

  const primaryHref = platform === "android" ? PLAY_STORE_URL : APP_STORE_URL;
  const primaryLabel =
    platform === "android"
      ? "Descargar en Google Play"
      : "Descargar en App Store";
  const secondaryHref = platform === "android" ? APP_STORE_URL : PLAY_STORE_URL;
  const secondaryLabel =
    platform === "android"
      ? "También en App Store"
      : "También en Google Play";

  return (
    <div
      role="complementary"
      aria-label="Descarga de app"
      className="fixed bottom-3 left-3 right-3 z-[60] mx-auto max-w-3xl md:bottom-5 md:left-1/2 md:right-auto md:w-[640px] md:-translate-x-1/2"
      style={{
        animation: "app-banner-in 300ms ease-out both",
      }}
    >
      <style>{`
        @keyframes app-banner-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 768px) {
          @keyframes app-banner-in {
            from { opacity: 0; transform: translate(-50%, 12px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }
        }
      `}</style>
      <div className="rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur-md md:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              Llévate la experiencia completa en la app oficial
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
              Rutas, mapas, alertas y semáforo turístico en tiempo real.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Cerrar aviso de descarga de app"
            className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="mt-2 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex flex-wrap gap-2">
            <a
              href={primaryHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white md:text-sm"
            >
              {primaryLabel}
            </a>
            <a
              href={secondaryHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground md:text-sm"
            >
              {secondaryLabel}
            </a>
            <button
              type="button"
              onClick={dismiss}
              className="px-2 py-2 text-xs text-muted-foreground underline md:text-sm"
            >
              Seguir en web
            </button>
          </div>

          <div className="hidden rounded-lg border border-border bg-background p-2 text-center md:block">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="QR para descargar la app"
                width={96}
                height={96}
                className="h-[96px] w-[96px]"
              />
            ) : (
              <div className="h-[96px] w-[96px] rounded bg-muted" aria-hidden />
            )}
            <p className="mt-1 text-[10px] text-muted-foreground">
              Escanea para descargar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
