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
 * Starts VISIBLE in SSR to avoid CLS for most users.
 * After hydration, hides only if the user previously dismissed it.
 */
export default function AppDownloadBanner() {
  const [hidden, setHidden] = useState(false);
  const [platform, setPlatform] = useState<MobilePlatform>("other");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    setPlatform(detectPlatform());

    try {
      const dismissedUntil = localStorage.getItem(DISMISS_KEY);
      if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
        setHidden(true);
        return;
      }
    } catch {}

    if (typeof window !== "undefined") {
      setQrUrl(
        `https://quickchart.io/qr?size=180&text=${encodeURIComponent(
          `${window.location.origin}${APP_SMART_PATH}`
        )}`
      );
    }
  }, []);

  const dismiss = () => {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    try { localStorage.setItem(DISMISS_KEY, String(until)); } catch {}
    setHidden(true);
  };

  if (hidden) return null;

  const primaryHref = platform === "android" ? PLAY_STORE_URL : APP_STORE_URL;
  const primaryLabel =
    platform === "android"
      ? "Descargar en Google Play"
      : "Descargar en App Store";
  const secondaryHref = platform === "android" ? APP_STORE_URL : PLAY_STORE_URL;
  const secondaryLabel =
    platform === "android"
      ? "También disponible en App Store"
      : "También disponible en Google Play";

  return (
    <section className="mx-auto mt-4 w-full max-w-6xl px-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">
              Llévate la experiencia completa en la app oficial
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Rutas, mapas, alertas y semáforo turístico en tiempo real.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Cerrar aviso de descarga de app"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex flex-wrap gap-2">
            <a
              href={primaryHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white"
            >
              {primaryLabel}
            </a>
            <a
              href={secondaryHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              {secondaryLabel}
            </a>
            <button
              type="button"
              onClick={dismiss}
              className="px-2 py-2 text-sm text-muted-foreground underline"
            >
              Seguir en web
            </button>
          </div>

          <div className="hidden rounded-lg border border-border bg-background p-2 text-center md:block">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="QR para descargar la app"
                width={120}
                height={120}
                className="h-[120px] w-[120px]"
              />
            ) : (
              <div className="h-[120px] w-[120px] bg-muted rounded" aria-hidden />
            )}
            <p className="mt-1 text-xs text-muted-foreground">Escanea para descargar</p>
          </div>
        </div>
      </div>
    </section>
  );
}
