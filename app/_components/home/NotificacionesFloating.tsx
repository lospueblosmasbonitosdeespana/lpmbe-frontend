"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { homeConfig } from "./home.config";

type TabKey = (typeof homeConfig.notificaciones.tabs)[number]["key"];

type Notificacion = {
  id: string | number;
  titulo: string;
  tipo: string; // "NOTICIA" | "EVENTO" | "ALERTA" | "ALERTA_PUEBLO" | "SEMAFORO"
  texto?: string;
  fecha: string; // ISO
  pueblo?: {
    id: number;
    nombre: string;
    slug: string;
  } | null;
  estado?: string | null;
  motivoPublico?: string | null;
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

        // Usar el mismo endpoint que funciona en /notificaciones
        const res = await fetch("/api/notificaciones/feed", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Error cargando notificaciones");

        const data = await res.json();
        // El proxy devuelve { items: [...] }
        const rawItems = Array.isArray(data.items) ? data.items : (data.items ?? data.data ?? []);
        
        if (!cancelled) {
          // Mapear al formato esperado por el widget
          const mapped: Notificacion[] = rawItems.map((item: any) => ({
            id: item.id ?? item.refId ?? Math.random(),
            titulo: item.titulo ?? "(sin título)",
            tipo: item.tipo ?? "NOTICIA",
            texto: item.texto ?? "",
            fecha: item.fecha ?? new Date().toISOString(),
            pueblo: item.pueblo ?? null,
            estado: item.estado ?? null,
            motivoPublico: item.motivoPublico ?? null,
          }));
          setItems(mapped);
        }
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
    // Mapear tabs a tipos de notificación
    const tipoMap: Record<TabKey, string[]> = {
      NACIONAL: ["NOTICIA", "EVENTO"],
      SEMAFORO: ["SEMAFORO"],
      ALERTA: ["ALERTA", "ALERTA_PUEBLO"],
    };
    
    const tiposPermitidos = tipoMap[active] ?? [];
    
    return items.filter((n) => {
      const t = (n.tipo || "").toUpperCase();
      return tiposPermitidos.includes(t);
    });
  }, [items, active]);

  return (
    <div className="relative z-50 pointer-events-auto w-[calc(100%-2rem)] rounded-2xl border border-black/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.10)]">
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
            ) : items.length === 0 ? (
              <div className="text-sm text-gray-500">
                No hay notificaciones ahora mismo.
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-gray-500">
                No hay {homeConfig.notificaciones.tabs.find(t => t.key === active)?.label.toLowerCase()} ahora mismo.
              </div>
            ) : (
              <ul className="space-y-3">
                {filtered.slice(0, limit).map((n) => {
                  const date = formatDate(n.fecha);
                  // Generar href según tipo
                  let href: string = homeConfig.notificaciones.allHref;
                  if (n.tipo === "SEMAFORO" && n.pueblo?.slug) {
                    href = `/pueblos/${n.pueblo.slug}`;
                  }

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

