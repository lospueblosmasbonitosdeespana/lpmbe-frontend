"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { homeConfig } from "./home.config";

type TabKey = (typeof homeConfig.notificaciones.tabs)[number]["key"];

type Notificacion = {
  id: number;
  titulo: string;
  tipo: string; // "NACIONAL" | "SEMAFORO" | "ALERTA" ... (legacy/actual)
  fecha?: string; // ISO si viene
  href?: string; // opcional si el backend lo da
};

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

export function NotificacionesFloating() {
  const [active, setActive] = useState<TabKey>("NACIONAL");
  const [items, setItems] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  const limit = homeConfig.notificaciones.limit;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        // Usar la misma configuración de API que el resto de la app
        const base =
          process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
          "http://localhost:3000";

        const res = await fetch(`${base}/notificaciones?limit=${limit}`, {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Error cargando notificaciones");

        const data = (await res.json()) as Notificacion[];
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  const filtered = useMemo(() => {
    // Aquí somos tolerantes con el backend:
    // - si tipo coincide, filtramos
    // - si no hay tipo, lo dejamos caer en NACIONAL
    return items.filter((n) => {
      const t = (n.tipo || "NACIONAL").toUpperCase();
      return t.includes(active);
    });
  }, [items, active]);

  return (
    <div className="w-[calc(100%-2rem)] rounded-2xl border border-black/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.10)]">
      <div className="grid grid-cols-1 gap-0 md:grid-cols-[1fr_180px]">
        {/* Cuerpo */}
        <div className="px-6 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-base font-semibold">
              {homeConfig.notificaciones.title}
            </div>

            <div className="flex items-center gap-2">
              {homeConfig.notificaciones.tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActive(t.key)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active === t.key
                      ? "bg-black text-white"
                      : "bg-black/5 text-black hover:bg-black/10"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            {loading ? (
              <div className="text-sm text-gray-500">Cargando…</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-gray-500">
                No hay notificaciones ahora mismo.
              </div>
            ) : (
              <ul className="space-y-3">
                {filtered.slice(0, limit).map((n) => {
                  const date = formatDate(n.fecha);
                  const href = n.href ?? homeConfig.notificaciones.allHref;

                  return (
                    <li key={n.id} className="flex items-center gap-4">
                      <div className="w-16 shrink-0 text-xs text-gray-500">
                        {date}
                      </div>
                      <Link
                        href={href}
                        className="line-clamp-1 text-sm hover:underline"
                      >
                        {n.titulo}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-5">
            <Link
              href={homeConfig.notificaciones.allHref}
              className="text-sm font-medium hover:underline"
            >
              Ver todas →
            </Link>
          </div>
        </div>

        {/* Botón lateral premium */}
        <div className="flex items-stretch">
          <Link
            href={homeConfig.notificaciones.allHref}
            className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 h-14 md:h-16"
          >
            Abrir
          </Link>
        </div>
      </div>
    </div>
  );
}

