"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Title, Caption } from "@/app/components/ui/typography";

type MeteoResponse = {
  puebloId: number;
  lat: number;
  lng: number;
  timezone: string;
  current: {
    time: string;
    temperatureC: number | null;
    windKph: number | null;
    windDirDeg: number | null;
    weatherCode: number | null;
  };
  daily: Array<{
    date: string;
    tMaxC: number | null;
    tMinC: number | null;
    precipitationMm: number | null;
    precipProbPct: number | null;
    windMaxKph: number | null;
    weatherCode: number | null;
    sunrise: string | null;
    sunset: string | null;
  }>;
  generatedAt: string;
};

function weatherCodeToKey(code: number | null): string {
  if (code == null) return "weather";
  if (code === 0) return "clear";
  if ([1, 2, 3].includes(code)) return "cloudy";
  if ([45, 48].includes(code)) return "fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "rain";
  if ([71, 73, 75, 77].includes(code)) return "snow";
  if ([80, 81, 82].includes(code)) return "showers";
  if ([95, 96, 99].includes(code)) return "storm";
  return "weather";
}

function degToCardinal(deg: number | null): string {
  if (deg == null) return "—";
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  const idx = Math.round(((deg % 360) / 45)) % 8;
  return dirs[idx];
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "2-digit" });
}

/* ── Iconos meteorológicos ── */

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="2" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </g>
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function DropletIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

/** Icono para cada tipo de tiempo (weather code WMO) */
function WeatherIcon({ code, className }: { code: number | null; className?: string }) {
  const key = weatherCodeToKey(code);

  if (key === "clear") {
    // Sol
    return (
      <svg viewBox="0 0 32 32" className={className} fill="none">
        <circle cx="16" cy="16" r="6" fill="#F59E0B" />
        <g stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round">
          <line x1="16" y1="3" x2="16" y2="6" />
          <line x1="16" y1="26" x2="16" y2="29" />
          <line x1="3" y1="16" x2="6" y2="16" />
          <line x1="26" y1="16" x2="29" y2="16" />
          <line x1="7.1" y1="7.1" x2="9.2" y2="9.2" />
          <line x1="22.8" y1="22.8" x2="24.9" y2="24.9" />
          <line x1="7.1" y1="24.9" x2="9.2" y2="22.8" />
          <line x1="22.8" y1="9.2" x2="24.9" y2="7.1" />
        </g>
      </svg>
    );
  }

  if (key === "cloudy") {
    // Parcialmente nublado
    return (
      <svg viewBox="0 0 32 32" className={className} fill="none">
        <circle cx="12" cy="14" r="5" fill="#F59E0B" opacity="0.9" />
        <g stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
          <line x1="12" y1="6" x2="12" y2="8" />
          <line x1="5" y1="14" x2="7" y2="14" />
          <line x1="6.9" y1="8.1" x2="8.3" y2="9.5" />
        </g>
        <path d="M10 20c0-3.3 2.7-6 6-6 .4 0 .8 0 1.2.1A5 5 0 0 1 22 19c0 .3 0 .7-.1 1H10v-1z" fill="#94A3B8" />
        <rect x="8" y="19" width="16" height="5" rx="2.5" fill="#CBD5E1" />
      </svg>
    );
  }

  if (key === "fog") {
    // Niebla
    return (
      <svg viewBox="0 0 32 32" className={className} fill="none">
        <g stroke="#94A3B8" strokeWidth="2" strokeLinecap="round">
          <line x1="5" y1="11" x2="27" y2="11" />
          <line x1="5" y1="16" x2="27" y2="16" />
          <line x1="8" y1="21" x2="24" y2="21" />
        </g>
      </svg>
    );
  }

  if (key === "drizzle") {
    // Llovizna
    return (
      <svg viewBox="0 0 32 32" className={className} fill="none">
        <path d="M8 18a6 6 0 0 1 6-6c.3 0 .6 0 .9.1A4 4 0 0 1 20 16c0 .2 0 .5-.1.7L8 18z" fill="#94A3B8" />
        <rect x="6" y="17" width="20" height="5" rx="2.5" fill="#CBD5E1" />
        <g stroke="#60A5FA" strokeWidth="2" strokeLinecap="round">
          <line x1="11" y1="24" x2="10" y2="27" />
          <line x1="16" y1="24" x2="15" y2="27" />
          <line x1="21" y1="24" x2="20" y2="27" />
        </g>
      </svg>
    );
  }

  if (key === "rain") {
    // Lluvia
    return (
      <svg viewBox="0 0 32 32" className={className} fill="none">
        <path d="M7 17a6 6 0 0 1 6-6c.3 0 .6 0 .9.1A4 4 0 0 1 19 15c0 .3 0 .6-.1.9L7 17z" fill="#94A3B8" />
        <rect x="5" y="16" width="22" height="5" rx="2.5" fill="#94A3B8" />
        <g stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round">
          <line x1="10" y1="23" x2="8" y2="28" />
          <line x1="16" y1="23" x2="14" y2="28" />
          <line x1="22" y1="23" x2="20" y2="28" />
        </g>
      </svg>
    );
  }

  if (key === "snow") {
    // Nieve
    return (
      <svg viewBox="0 0 32 32" className={className} fill="none">
        <path d="M7 17a6 6 0 0 1 6-6c.3 0 .6 0 .9.1A4 4 0 0 1 19 15c0 .3 0 .6-.1.9L7 17z" fill="#CBD5E1" />
        <rect x="5" y="16" width="22" height="5" rx="2.5" fill="#CBD5E1" />
        <g fill="#93C5FD">
          <circle cx="11" cy="26" r="1.5" />
          <circle cx="16" cy="25" r="1.5" />
          <circle cx="21" cy="26" r="1.5" />
        </g>
      </svg>
    );
  }

  if (key === "showers") {
    // Chubascos
    return (
      <svg viewBox="0 0 32 32" className={className} fill="none">
        <circle cx="11" cy="12" r="4" fill="#F59E0B" opacity="0.7" />
        <path d="M10 18a5 5 0 0 1 5-5c.3 0 .6 0 .8.1A3.5 3.5 0 0 1 20 16.5v.5H10V18z" fill="#94A3B8" />
        <rect x="8" y="17" width="16" height="4" rx="2" fill="#94A3B8" />
        <g stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="23" x2="10" y2="28" />
          <line x1="17" y1="23" x2="15" y2="28" />
          <line x1="22" y1="23" x2="20" y2="28" />
        </g>
      </svg>
    );
  }

  if (key === "storm") {
    // Tormenta
    return (
      <svg viewBox="0 0 32 32" className={className} fill="none">
        <path d="M6 17a6 6 0 0 1 6-6c.3 0 .6 0 .9.1A4 4 0 0 1 18 15c0 .3 0 .6-.1.9L6 17z" fill="#64748B" />
        <rect x="4" y="16" width="24" height="5" rx="2.5" fill="#475569" />
        <path d="M15 22l-3 5h4l-2 4" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  }

  // Default: nube genérica
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none">
      <path d="M7 19a7 7 0 0 1 7-7c.4 0 .7 0 1 .1A5 5 0 0 1 22 17c0 .3 0 .7-.1 1H7v1z" fill="#94A3B8" />
      <rect x="5" y="18" width="22" height="6" rx="3" fill="#CBD5E1" />
    </svg>
  );
}

export default function MeteoPanel({ puebloId }: { puebloId: number }) {
  const t = useTranslations("meteoPanel");
  const [data, setData] = useState<MeteoResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const codeToText = (code: number | null) => t(weatherCodeToKey(code));
  const next3 = useMemo(() => (data?.daily || []).slice(0, 3), [data]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/meteo/pueblo/${puebloId}`, { cache: "no-store" });
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);
        if (!cancelled) setData(body);
      } catch (e: unknown) {
        if (!cancelled) setErr((e as Error)?.message || t("unavailable"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [puebloId]);

  if (loading) {
    return (
      <Section spacing="sm" background="card">
        <Container>
          <Title as="h3" className="mb-3 text-lg">{t("titleNow")}</Title>
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-48 rounded bg-muted" />
            <div className="flex gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 border-l border-border px-4 py-3 first:border-l-0">
                  <div className="mb-2 h-4 w-20 rounded bg-muted" />
                  <div className="mb-2 h-3 w-16 rounded bg-muted" />
                  <div className="h-4 w-14 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  if (err || !data) {
    return (
      <Section spacing="sm" background="card">
        <Container>
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">{err || t("unavailable")}</p>
          </div>
        </Container>
      </Section>
    );
  }

  const c = data.current;
  const sunriseStr = data.daily?.[0]?.sunrise ? new Date(data.daily[0].sunrise).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "—";
  const sunsetStr = data.daily?.[0]?.sunset ? new Date(data.daily[0].sunset).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <Section spacing="sm" background="card">
      <Container>
        <div className="mb-4">
          <Title as="h3" className="mb-3 text-lg">{t("titleNow")}</Title>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <WeatherIcon code={c.weatherCode} className="h-8 w-8 shrink-0" />
              <span>{t("statusLabel")} <strong>{codeToText(c.weatherCode)}</strong></span>
            </div>
            <span>Temp: <strong>{c.temperatureC == null ? "—" : `${Math.round(c.temperatureC)}°C`}</strong></span>
            <span>Viento: <strong>{c.windKph == null ? "—" : `${Math.round(c.windKph)} km/h`} {degToCardinal(c.windDirDeg)}</strong></span>
            <span className="flex items-center gap-1">
              <SunIcon className="h-4 w-4 text-amber-500" />
              <span>{sunriseStr}</span>
              <span className="mx-1 text-muted-foreground">·</span>
              <MoonIcon className="h-4 w-4 text-slate-400" />
              <span>{sunsetStr}</span>
            </span>
          </div>
          <Caption className="mt-2 block">{t("updatedAt")} {c.time ? new Date(c.time).toLocaleString() : "—"}</Caption>
        </div>

        {next3.length > 0 && (
          <div>
            <Title as="h4" className="mb-2 text-base">{t("next3Days")}</Title>
            <div className="flex rounded-lg border border-border bg-background divide-x divide-border">
              {next3.map((d) => (
                <div key={d.date} className="flex-1 px-3 py-2.5">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wide">{formatDay(d.date)}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <WeatherIcon code={d.weatherCode} className="h-6 w-6 shrink-0" />
                    <span className="text-xs text-muted-foreground leading-tight">{codeToText(d.weatherCode)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-1">
                    <p>
                      <span className="text-sm font-semibold">{d.tMaxC == null ? "—" : `${Math.round(d.tMaxC)}°`}</span>
                      <span className="text-xs text-muted-foreground"> / {d.tMinC == null ? "—" : `${Math.round(d.tMinC)}°`}</span>
                    </p>
                    <p className="flex items-center gap-0.5 text-xs text-blue-500">
                      <DropletIcon className="h-3 w-3" />
                      <span>{d.precipitationMm == null ? "—" : `${Math.round(d.precipitationMm)}mm`} ({d.precipProbPct == null ? "—" : `${Math.round(d.precipProbPct)}%`})</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Container>
    </Section>
  );
}
