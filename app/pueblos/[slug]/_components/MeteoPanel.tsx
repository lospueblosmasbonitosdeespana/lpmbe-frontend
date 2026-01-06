"use client";

import { useEffect, useMemo, useState } from "react";

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
    date: string; // YYYY-MM-DD
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

function codeToText(code: number | null): string {
  if (code == null) return "—";
  // Open-Meteo WMO codes (resumen práctico)
  if (code === 0) return "Despejado";
  if ([1, 2, 3].includes(code)) return "Nuboso";
  if ([45, 48].includes(code)) return "Niebla";
  if ([51, 53, 55, 56, 57].includes(code)) return "Llovizna";
  if ([61, 63, 65, 66, 67].includes(code)) return "Lluvia";
  if ([71, 73, 75, 77].includes(code)) return "Nieve";
  if ([80, 81, 82].includes(code)) return "Chubascos";
  if ([95, 96, 99].includes(code)) return "Tormenta";
  return "Tiempo";
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

export default function MeteoPanel({ puebloId }: { puebloId: number }) {
  const [data, setData] = useState<MeteoResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const next3 = useMemo(() => (data?.daily || []).slice(0, 3), [data]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/meteo/pueblo/${puebloId}`, { cache: "no-store" });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          const msg =
            body?.error === "upstream_fetch_failed"
              ? "Tiempo no disponible (backend)"
              : body?.error || `Error ${res.status}`;
          throw new Error(msg);
        }
        if (!cancelled) setData(body);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Tiempo no disponible");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [puebloId]);

  if (loading) {
    return (
      <div style={{ border: "1px solid #ddd", padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Tiempo</div>
        <div style={{ marginTop: 8 }}>Cargando…</div>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div style={{ border: "1px solid #ddd", padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Tiempo</div>
        <div style={{ marginTop: 8, color: "#777" }}>{err || "Tiempo no disponible"}</div>
      </div>
    );
  }

  const c = data.current;

  return (
    <div style={{ border: "1px solid #ddd", padding: 16 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Tiempo ahora</div>

          <div style={{ marginTop: 10, display: "flex", gap: 18, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "#777" }}>Estado</div>
              <div style={{ fontWeight: 600 }}>{codeToText(c.weatherCode)}</div>
            </div>

            <div>
              <div style={{ color: "#777" }}>Temperatura</div>
              <div style={{ fontWeight: 600 }}>
                {c.temperatureC == null ? "—" : `${Math.round(c.temperatureC)}°C`}
              </div>
            </div>

            <div>
              <div style={{ color: "#777" }}>Viento</div>
              <div style={{ fontWeight: 600 }}>
                {c.windKph == null ? "—" : `${Math.round(c.windKph)} km/h`}{" "}
                {degToCardinal(c.windDirDeg)}
              </div>
            </div>

            <div>
              <div style={{ color: "#777" }}>Actualizado</div>
              <div style={{ fontWeight: 600 }}>
                {c.time ? new Date(c.time).toLocaleString("es-ES") : "—"}
              </div>
            </div>
          </div>

          {data.daily?.[0] && (
            <div style={{ marginTop: 10, color: "#777" }}>
              Amanecer: {data.daily[0].sunrise ? new Date(data.daily[0].sunrise).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "—"}{" "}
              · Atardecer: {data.daily[0].sunset ? new Date(data.daily[0].sunset).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "—"}
            </div>
          )}
        </div>

        <div style={{ width: 420, minWidth: 360 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Próximos 3 días</div>

          <div style={{ marginTop: 10, display: "flex", gap: 12 }}>
            {next3.map((d) => (
              <div
                key={d.date}
                style={{
                  flex: 1,
                  border: "1px solid #ddd",
                  padding: 12,
                  minWidth: 0,
                }}
              >
                <div style={{ fontWeight: 700 }}>{formatDay(d.date)}</div>
                <div style={{ marginTop: 6 }}>{codeToText(d.weatherCode)}</div>
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontWeight: 700 }}>
                    {d.tMaxC == null ? "—" : `${Math.round(d.tMaxC)}°`}
                  </span>{" "}
                  /{" "}
                  <span style={{ color: "#777" }}>
                    {d.tMinC == null ? "—" : `${Math.round(d.tMinC)}°`}
                  </span>
                </div>
                <div style={{ marginTop: 6, color: "#777" }}>
                  Lluvia: {d.precipitationMm == null ? "—" : `${Math.round(d.precipitationMm)} mm`}
                </div>
                <div style={{ marginTop: 2, color: "#777" }}>
                  Prob: {d.precipProbPct == null ? "—" : `${Math.round(d.precipProbPct)}%`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

