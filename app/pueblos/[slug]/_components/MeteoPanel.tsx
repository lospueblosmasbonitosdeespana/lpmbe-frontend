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

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" fill="none" stroke="currentColor" strokeWidth="2" />
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
            <span>{t("statusLabel")} <strong>{codeToText(c.weatherCode)}</strong></span>
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
            <Title as="h4" className="mb-3 text-base">{t("next3Days")}</Title>
            <div className="flex rounded-lg border border-border bg-background">
              {next3.map((d) => (
                <div key={d.date} className="flex-1 border-l border-border px-4 py-3 first:border-l-0">
                  <p className="text-sm font-medium text-foreground">{formatDay(d.date)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{codeToText(d.weatherCode)}</p>
                  <p className="mt-1">
                    <span className="text-base font-semibold">{d.tMaxC == null ? "—" : `${Math.round(d.tMaxC)}°`}</span>
                    <span className="text-sm text-muted-foreground"> / {d.tMinC == null ? "—" : `${Math.round(d.tMinC)}°`}</span>
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-blue-500">
                    <DropletIcon className="h-3 w-3" />
                    <span>
                      {d.precipitationMm == null ? "—" : `${Math.round(d.precipitationMm)}mm`} ({d.precipProbPct == null ? "—" : `${Math.round(d.precipProbPct)}%`})
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Container>
    </Section>
  );
}
