"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Sun, CloudSun, Cloud, Cloudy, CloudFog, CloudDrizzle,
  CloudRain, CloudSnow, CloudLightning,
  ArrowRight,
} from "lucide-react";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";

type MeteoResponse = {
  current: {
    time: string;
    temperatureC: number | null;
    feelsLikeC?: number | null;
    weatherCode: number | null;
  };
  daily: Array<{
    date: string;
    tMaxC: number | null;
    tMinC: number | null;
    precipProbPct: number | null;
    weatherCode: number | null;
  }>;
  generatedAt: string;
};

type WIconCfg = { Icon: React.ComponentType<any>; cls: string };

function getWmoIcon(code: number | null): WIconCfg {
  if (code === null || code === 0) return { Icon: Sun, cls: "text-amber-500" };
  if (code === 1) return { Icon: CloudSun, cls: "text-stone-400" };
  if ([2, 3].includes(code)) return { Icon: Cloudy, cls: "text-stone-500" };
  if ([45, 48].includes(code)) return { Icon: CloudFog, cls: "text-stone-400" };
  if ([51, 53, 55, 56, 57].includes(code)) return { Icon: CloudDrizzle, cls: "text-slate-400" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { Icon: CloudRain, cls: "text-blue-500" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { Icon: CloudSnow, cls: "text-sky-400" };
  if ([95, 96, 99].includes(code)) return { Icon: CloudLightning, cls: "text-violet-500" };
  return { Icon: Cloud, cls: "text-stone-500" };
}

function getWeatherText(code: number | null): string {
  if (code === null) return "—";
  if (code === 0) return "Despejado";
  if ([1, 2, 3].includes(code)) return "Nuboso";
  if ([45, 48].includes(code)) return "Niebla";
  if ([51, 53, 55, 56, 57].includes(code)) return "Llovizna";
  if ([61, 63, 65, 66, 67].includes(code)) return "Lluvia";
  if ([71, 73, 75, 77].includes(code)) return "Nieve";
  if ([80, 81, 82].includes(code)) return "Chubascos";
  if ([95, 96, 99].includes(code)) return "Tormenta";
  return "Nuboso";
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "2-digit" });
}

export default function MeteoPanel({
  puebloId,
  puebloSlug,
}: {
  puebloId: number;
  puebloSlug: string;
}) {
  const [data, setData] = useState<MeteoResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const res = await fetch(`/api/meteo/pueblo-public/${puebloId}`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const body = await res.json();
        if (!cancelled) setData(body);
      } catch {
        /* silently hide */
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
          <div className="animate-pulse flex items-center gap-6 py-4">
            <div className="h-16 w-16 rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-8 w-24 rounded bg-muted" />
              <div className="h-4 w-32 rounded bg-muted" />
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  if (!data?.current) return null;

  const c = data.current;
  const next3 = (data.daily || []).slice(0, 3);
  const { Icon: WIcon, cls: wCls } = getWmoIcon(c.weatherCode);
  const weatherText = getWeatherText(c.weatherCode);

  return (
    <Section spacing="sm" background="card">
      <Container>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
          {/* Current conditions */}
          <div className="flex items-center gap-4">
            <WIcon size={56} className={wCls} strokeWidth={1.5} />
            <div>
              <div className="text-4xl font-bold font-serif tracking-tight leading-none">
                {c.temperatureC != null ? `${Math.round(c.temperatureC)}°` : "—"}
              </div>
              <p className="text-sm text-muted-foreground mt-1 capitalize">{weatherText}</p>
              {c.feelsLikeC != null && c.temperatureC != null && Math.abs(c.feelsLikeC - c.temperatureC) >= 2 && (
                <p className="text-xs text-muted-foreground">
                  Sensación {Math.round(c.feelsLikeC)}°
                </p>
              )}
            </div>
          </div>

          {/* Mini forecast */}
          {next3.length > 0 && (
            <div className="flex gap-3">
              {next3.map((d) => {
                const { Icon: DIcon, cls: dCls } = getWmoIcon(d.weatherCode);
                return (
                  <div key={d.date} className="flex flex-col items-center text-center min-w-[60px]">
                    <span className="text-[11px] font-medium text-muted-foreground mb-1">
                      {formatDay(d.date).split(",")[0]}
                    </span>
                    <DIcon size={22} className={dCls} strokeWidth={1.5} />
                    <div className="mt-1 text-xs">
                      <span className="font-semibold">{d.tMaxC != null ? `${Math.round(d.tMaxC)}°` : "—"}</span>
                      <span className="text-muted-foreground ml-0.5">{d.tMinC != null ? `${Math.round(d.tMinC)}°` : ""}</span>
                    </div>
                    {d.precipProbPct != null && d.precipProbPct > 10 && (
                      <span className="text-[10px] text-blue-500 mt-0.5">{d.precipProbPct}%</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA button */}
          <Link
            href={`/pueblos/${puebloSlug}/meteo`}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
          >
            Ver previsión completa
            <ArrowRight size={16} />
          </Link>
        </div>
      </Container>
    </Section>
  );
}
