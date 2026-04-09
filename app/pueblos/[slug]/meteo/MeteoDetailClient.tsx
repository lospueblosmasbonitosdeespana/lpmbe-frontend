"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Sun, CloudSun, Cloud, Cloudy, CloudFog, CloudDrizzle,
  CloudRain, CloudSnow, CloudLightning,
  Thermometer, Wind, Droplets, Snowflake, Sunrise, Sunset,
  SunDim, Umbrella, Waves, Timer, ThermometerSun,
  AlertTriangle, RefreshCw, ArrowLeft, Leaf,
} from "lucide-react";

type MeteoFull = {
  puebloId: number;
  lat: number;
  lng: number;
  timezone: string;
  current: {
    time: string;
    temperatureC: number;
    feelsLikeC: number;
    windKph: number;
    windDirDeg: number;
    weatherCode: number;
    humidityPct: number;
  } | null;
  daily: {
    date: string;
    tMaxC: number;
    tMinC: number;
    precipitationMm: number;
    precipProbPct: number;
    windMaxKph: number;
    weatherCode: number;
    sunrise: string;
    sunset: string;
    uvIndexMax: number;
    sunshineHours: number;
    snowfallMm: number;
  }[];
  acumulados?: {
    lluviaHoyMm?: number | null;
    nieveHoyCm?: number | null;
    lluvia24hMm?: number | null;
    nieve24hCm?: number | null;
  } | null;
  airQuality?: {
    europeanAqi: number | null;
    pm10: number | null;
    pm25: number | null;
  } | null;
  floodRisk?: {
    maxDischarge: number | null;
    floodAlert: boolean;
  } | null;
  marine?: {
    waveHeight: number | null;
    waveDirection: number | null;
    wavePeriod: number | null;
    seaTempC: number | null;
  } | null;
  alertas?: {
    kind: string;
    title: string;
    title_i18n?: Record<string, string> | null;
    detail?: string | null;
    detail_i18n?: Record<string, string> | null;
    windowStart: string;
    windowEnd: string;
    createdAt: string;
  }[];
  generatedAt: string;
};

/* ── Weather icon config ── */

type WIconCfg = { Icon: React.ComponentType<any>; color: string; cls: string };

function getWmoIcon(code: number | null): WIconCfg {
  if (code === null || code === 0) return { Icon: Sun, color: "#d97706", cls: "text-amber-500" };
  if (code === 1) return { Icon: CloudSun, color: "#92908a", cls: "text-stone-400" };
  if ([2, 3].includes(code)) return { Icon: Cloudy, color: "#78716c", cls: "text-stone-500" };
  if ([45, 48].includes(code)) return { Icon: CloudFog, color: "#a8a29e", cls: "text-stone-400" };
  if ([51, 53, 55, 56, 57].includes(code)) return { Icon: CloudDrizzle, color: "#6b8caf", cls: "text-slate-400" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { Icon: CloudRain, color: "#4f7fb5", cls: "text-blue-500" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { Icon: CloudSnow, color: "#7bacd9", cls: "text-sky-400" };
  if ([95, 96, 99].includes(code)) return { Icon: CloudLightning, color: "#7c5cbf", cls: "text-violet-500" };
  return { Icon: Cloud, color: "#78716c", cls: "text-stone-500" };
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

function windDir(deg: number | null): string {
  if (deg == null) return "";
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  return dirs[Math.round(((deg % 360) / 45)) % 8];
}

function uvInfo(uv: number): { label: string; cls: string; dotCls: string } {
  if (uv <= 2) return { label: "Bajo", cls: "text-green-700", dotCls: "bg-green-500" };
  if (uv <= 5) return { label: "Moderado", cls: "text-yellow-700", dotCls: "bg-yellow-500" };
  if (uv <= 7) return { label: "Alto", cls: "text-orange-600", dotCls: "bg-orange-500" };
  if (uv <= 10) return { label: "Muy Alto", cls: "text-red-600", dotCls: "bg-red-500" };
  return { label: "Extremo", cls: "text-red-800", dotCls: "bg-red-700" };
}

function aqiInfo(val: number): { label: string; cls: string; bgCls: string } {
  if (val <= 20) return { label: "Buena", cls: "text-green-800", bgCls: "bg-green-500" };
  if (val <= 40) return { label: "Aceptable", cls: "text-lime-800", bgCls: "bg-lime-500" };
  if (val <= 60) return { label: "Moderada", cls: "text-yellow-800", bgCls: "bg-yellow-500" };
  if (val <= 80) return { label: "Mala", cls: "text-orange-800", bgCls: "bg-orange-500" };
  if (val <= 100) return { label: "Muy mala", cls: "text-red-800", bgCls: "bg-red-500" };
  return { label: "Extrema", cls: "text-red-900", bgCls: "bg-red-700" };
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  } catch {
    return "—";
  }
}

function fmtDayName(dateStr: string, locale: string): string {
  try {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString(locale || "es-ES", { weekday: "long", day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

function alertKindMeta(kind: string): { cls: string; bgCls: string; borderCls: string } {
  switch (kind) {
    case "RAIN": return { cls: "text-blue-800", bgCls: "bg-blue-50", borderCls: "border-blue-500" };
    case "SNOW": return { cls: "text-indigo-800", bgCls: "bg-indigo-50", borderCls: "border-indigo-500" };
    case "WIND": return { cls: "text-violet-800", bgCls: "bg-violet-50", borderCls: "border-violet-500" };
    case "FROST": return { cls: "text-cyan-800", bgCls: "bg-cyan-50", borderCls: "border-cyan-500" };
    case "HEAT": return { cls: "text-red-800", bgCls: "bg-red-50", borderCls: "border-red-500" };
    case "FLOOD": return { cls: "text-red-800", bgCls: "bg-red-50", borderCls: "border-red-600" };
    default: return { cls: "text-orange-800", bgCls: "bg-orange-50", borderCls: "border-orange-500" };
  }
}

/* ── Card component ── */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function StatBox({
  icon,
  value,
  label,
  valueClassName,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-2">{icon}</div>
      <span className={`text-xl font-semibold ${valueClassName ?? "text-foreground"}`}>{value}</span>
      <span className="mt-1 text-xs text-muted-foreground text-center">{label}</span>
    </div>
  );
}

/* ── Main component ── */

export function MeteoDetailClient({
  puebloId,
  puebloNombre,
  puebloSlug,
  locale,
}: {
  puebloId: number;
  puebloNombre: string;
  puebloSlug: string;
  locale: string;
}) {
  const [data, setData] = useState<MeteoFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/meteo/pueblo-public/${puebloId}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [puebloId]);

  const cur = data?.current ?? null;
  const todayData = data?.daily?.[0] ?? null;
  const forecastDays = data?.daily ?? [];
  const acum = data?.acumulados ?? null;
  const aqi = data?.airQuality ?? null;
  const flood = data?.floodRisk ?? null;
  const marine = data?.marine ?? null;
  const alertas = data?.alertas ?? [];

  const weatherText = useMemo(() => (cur ? getWeatherText(cur.weatherCode) : ""), [cur]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold font-serif tracking-tight">
          Meteo — {puebloNombre}
        </h1>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold font-serif tracking-tight">
          Meteo — {puebloNombre}
        </h1>
        <Card className="text-center py-12">
          <Cloud size={48} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            El servicio de meteorología no está disponible en este momento.
          </p>
          <button
            onClick={fetchData}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <RefreshCw size={14} /> Reintentar
          </button>
        </Card>
      </div>
    );
  }

  const { Icon: WIcon, cls: wCls } = getWmoIcon(cur?.weatherCode ?? null);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-serif tracking-tight">
          Meteo — {puebloNombre}
        </h1>
        <Link
          href={`/pueblos/${puebloSlug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Volver al pueblo
        </Link>
      </div>

      {/* Alerts */}
      {alertas.length > 0 && (
        <div className="space-y-3">
          {alertas.map((a, idx) => {
            const meta = alertKindMeta(a.kind);
            const title = (a.title_i18n?.[locale] || a.title) ?? "";
            const detail = (a.detail_i18n?.[locale] || a.detail) ?? "";
            return (
              <div
                key={`alert-${idx}`}
                className={`rounded-xl border-l-4 ${meta.borderCls} ${meta.bgCls} p-4`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className={meta.cls} />
                  <div className="flex-1">
                    <p className={`font-semibold ${meta.cls}`}>{title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {fmtTime(a.windowStart)} — {fmtTime(a.windowEnd)}
                    </p>
                    {detail && (
                      <p className="text-sm text-muted-foreground mt-2">{detail}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Current conditions — hero card */}
      {cur && (
        <Card className="!p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <WIcon size={64} className={wCls} strokeWidth={1.5} />
              <div>
                <div className="text-5xl font-bold font-serif tracking-tight leading-none">
                  {Math.round(cur.temperatureC)}°
                </div>
                <p className="text-base text-muted-foreground mt-1 capitalize">
                  {weatherText}
                </p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">
                Sensación {Math.round(cur.feelsLikeC)}°
              </p>
              <p className="flex items-center justify-end gap-1.5 text-sm text-muted-foreground">
                <Droplets size={14} className="text-sky-400" />
                {cur.humidityPct}%
              </p>
              <p className="flex items-center justify-end gap-1.5 text-sm text-muted-foreground">
                <Wind size={14} className="text-stone-400" />
                {Math.round(cur.windKph)} km/h {windDir(cur.windDirDeg)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Stats grid */}
      {todayData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatBox
            icon={<Thermometer size={26} className="text-orange-500" strokeWidth={1.5} />}
            value={`${todayData.tMinC}° / ${todayData.tMaxC}°`}
            label="Mín / Máx"
          />
          <StatBox
            icon={<Sun size={26} className="text-amber-500" strokeWidth={1.5} />}
            value={todayData.sunshineHours != null ? `${todayData.sunshineHours.toFixed(1)}h` : "—"}
            label="Horas de sol"
          />
          <StatBox
            icon={
              <SunDim
                size={26}
                className={todayData.uvIndexMax != null ? uvInfo(todayData.uvIndexMax).cls : "text-amber-500"}
                strokeWidth={1.5}
              />
            }
            value={todayData.uvIndexMax != null ? `${Math.round(todayData.uvIndexMax)}` : "—"}
            label={`UV ${todayData.uvIndexMax != null ? uvInfo(todayData.uvIndexMax).label : ""}`}
            valueClassName={todayData.uvIndexMax != null ? uvInfo(todayData.uvIndexMax).cls : undefined}
          />
          <StatBox
            icon={<Umbrella size={26} className="text-blue-500" strokeWidth={1.5} />}
            value={`${todayData.precipProbPct ?? 0}%`}
            label="Prob. lluvia"
          />
          <StatBox
            icon={<Sunrise size={26} className="text-amber-400" strokeWidth={1.5} />}
            value={fmtTime(todayData.sunrise)}
            label="Amanecer"
          />
          <StatBox
            icon={<Sunset size={26} className="text-orange-400" strokeWidth={1.5} />}
            value={fmtTime(todayData.sunset)}
            label="Atardecer"
          />
        </div>
      )}

      {/* Accumulations */}
      {acum &&
        ((acum.lluvia24hMm ?? 0) > 0 ||
          (acum.nieve24hCm ?? 0) > 0 ||
          (acum.lluviaHoyMm ?? 0) > 0 ||
          (acum.nieveHoyCm ?? 0) > 0) && (
          <Card>
            <h2 className="text-lg font-semibold font-serif mb-4">
              Precipitaciones acumuladas
            </h2>
            <div className="flex flex-wrap gap-6">
              {(acum.lluvia24hMm ?? 0) > 0 && (
                <div className="flex flex-col items-center">
                  <CloudRain size={24} className="text-blue-500 mb-1" strokeWidth={1.5} />
                  <span className="text-lg font-semibold">{acum.lluvia24hMm!.toFixed(1)} mm</span>
                  <span className="text-xs text-muted-foreground">Lluvia 24h</span>
                </div>
              )}
              {(acum.lluviaHoyMm ?? 0) > 0 && (
                <div className="flex flex-col items-center">
                  <Droplets size={24} className="text-blue-500 mb-1" strokeWidth={1.5} />
                  <span className="text-lg font-semibold">{acum.lluviaHoyMm!.toFixed(1)} mm</span>
                  <span className="text-xs text-muted-foreground">Lluvia hoy</span>
                </div>
              )}
              {(acum.nieve24hCm ?? 0) > 0 && (
                <div className="flex flex-col items-center">
                  <Snowflake size={24} className="text-sky-400 mb-1" strokeWidth={1.5} />
                  <span className="text-lg font-semibold">{acum.nieve24hCm!.toFixed(1)} cm</span>
                  <span className="text-xs text-muted-foreground">Nieve 24h</span>
                </div>
              )}
              {(acum.nieveHoyCm ?? 0) > 0 && (
                <div className="flex flex-col items-center">
                  <CloudSnow size={24} className="text-sky-400 mb-1" strokeWidth={1.5} />
                  <span className="text-lg font-semibold">{acum.nieveHoyCm!.toFixed(1)} cm</span>
                  <span className="text-xs text-muted-foreground">Nieve hoy</span>
                </div>
              )}
            </div>
          </Card>
        )}

      {/* 3-day forecast */}
      {forecastDays.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold font-serif mb-4">
            Previsión 3 días
          </h2>
          <div className="divide-y divide-border">
            {forecastDays.map((day, idx) => {
              const dayLabel =
                idx === 0 ? "Hoy" : idx === 1 ? "Mañana" : fmtDayName(day.date, locale);
              const { Icon: DayIcon, cls: dayCls } = getWmoIcon(day.weatherCode);
              return (
                <div
                  key={day.date}
                  className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="w-8 flex justify-center">
                    <DayIcon size={26} className={dayCls} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground capitalize">{dayLabel}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {day.precipProbPct > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Umbrella size={12} />
                          {day.precipProbPct}%
                        </span>
                      )}
                      {day.precipitationMm > 0 && (
                        <span className="text-xs text-muted-foreground">
                          · {day.precipitationMm.toFixed(1)} mm
                        </span>
                      )}
                      {day.snowfallMm > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-sky-500">
                          <Snowflake size={12} />
                          {day.snowfallMm.toFixed(1)} mm
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">{day.tMaxC}°</span>
                    <span className="text-base text-muted-foreground">{day.tMinC}°</span>
                  </div>
                  <div className="hidden sm:flex flex-col items-end text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Wind size={12} />
                      {Math.round(day.windMaxKph)} km/h
                    </span>
                    <span>UV {Math.round(day.uvIndexMax)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Air quality */}
      {aqi && aqi.europeanAqi != null && (
        <Card>
          <h2 className="text-lg font-semibold font-serif mb-4">
            Calidad del aire
          </h2>
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full text-white font-bold text-lg ${aqiInfo(aqi.europeanAqi).bgCls}`}
            >
              {aqi.europeanAqi}
            </div>
            <div>
              <p className={`font-semibold text-base ${aqiInfo(aqi.europeanAqi).cls}`}>
                Aire: {aqiInfo(aqi.europeanAqi).label} (AQI {aqi.europeanAqi})
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                PM10: {aqi.pm10} µg/m³ · PM2.5: {aqi.pm25} µg/m³
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Marine */}
      {marine && marine.waveHeight != null && marine.waveHeight > 0 && (
        <Card>
          <h2 className="text-lg font-semibold font-serif mb-4">
            Condiciones marítimas
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatBox
              icon={<Waves size={24} className="text-blue-500" strokeWidth={1.5} />}
              value={`${marine.waveHeight.toFixed(1)} m`}
              label="Altura olas"
            />
            {marine.wavePeriod != null && (
              <StatBox
                icon={<Timer size={24} className="text-stone-500" strokeWidth={1.5} />}
                value={`${marine.wavePeriod.toFixed(0)} s`}
                label="Período"
              />
            )}
            {marine.seaTempC != null && (
              <StatBox
                icon={<ThermometerSun size={24} className="text-orange-500" strokeWidth={1.5} />}
                value={`${marine.seaTempC}°`}
                label="Temp. mar"
              />
            )}
          </div>
        </Card>
      )}

      {/* Flood risk */}
      {flood && flood.floodAlert && (
        <Card className="!border-l-4 !border-l-red-500">
          <div className="flex items-center gap-3">
            <AlertTriangle size={28} className="text-red-500 shrink-0" />
            <div>
              <p className="font-semibold text-red-600">Riesgo de crecida fluvial</p>
              <p className="text-sm text-muted-foreground mt-1">
                Caudal máximo previsto: {flood.maxDischarge?.toFixed(0)} m³/s
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground pt-2">
        Datos: Open-Meteo · Actualizado {data.generatedAt ? fmtTime(data.generatedAt) : "—"}
      </p>
    </div>
  );
}
