"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MobilePlatform = "ios" | "android" | "other";

function getMobilePlatform(): MobilePlatform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

export default function AppDownloadActions({
  appStoreUrl,
  playStoreUrl,
}: {
  appStoreUrl: string;
  playStoreUrl: string;
}) {
  const [platform, setPlatform] = useState<MobilePlatform>("other");
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    setPlatform(getMobilePlatform());
    if (typeof window !== "undefined") {
      const smartDownloadUrl = `${window.location.origin}/app/descargar`;
      setQrUrl(
        `https://quickchart.io/qr?size=180&text=${encodeURIComponent(smartDownloadUrl)}`,
      );
    }
  }, []);

  const primaryHref = platform === "android" ? playStoreUrl : appStoreUrl;
  const primaryLabel =
    platform === "android" ? "Descargar en Google Play" : "Descargar en App Store";
  const secondaryHref = platform === "android" ? appStoreUrl : playStoreUrl;
  const secondaryLabel =
    platform === "android" ? "También disponible en App Store" : "También disponible en Google Play";

  return (
    <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
      <div className="flex flex-wrap gap-3">
        <a
          href={primaryHref}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-black px-4 py-3 text-sm font-medium text-white"
        >
          {primaryLabel}
        </a>
        <a
          href={secondaryHref}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
        >
          {secondaryLabel}
        </a>
        <Link
          href="/app/descargar"
          className="rounded-lg border px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Abrir página de descarga
        </Link>
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
        ) : null}
        <p className="mt-1 text-xs text-muted-foreground">Escanea para descargar</p>
      </div>
    </div>
  );
}
