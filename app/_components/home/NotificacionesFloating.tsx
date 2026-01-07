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

// Función para obtener el título del item en Home
function getHomeItemTitle(item: Notificacion): string {
  if (item.tipo === "SEMAFORO") {
    const puebloNombre = item.pueblo?.nombre ?? "Pueblo";
    if (item.estado) {
      const estado = item.estado.toUpperCase();
      let color = "";
      if (estado === "VERDE") color = "verde";
      else if (estado === "AMARILLO") color = "amarillo";
      else if (estado === "ROJO") color = "rojo";
      
      if (color) {
        return `${puebloNombre} está en ${color}`;
      }
    }
    return `${puebloNombre} actualizó su semáforo`;
  }
  
  if (item.tipo === "ALERTA" || item.tipo === "ALERTA_PUEBLO") {
    return item.titulo ?? item.texto ?? "Alerta";
  }
  
  // NOTICIA o EVENTO
  return item.titulo ?? item.texto ?? "Actualidad";
}

export function NotificacionesFloating() {
  const [active, setActive] = useState<TabKey>("NACIONAL"); // "NACIONAL" = "Noticias"
  const [items, setItems] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  const maxItems = 2; // Máximo 2 items visibles

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
  }, []);

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
        <div className="px-6 py-4 md:px-8 md:py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/notificaciones"
                className="text-base font-semibold hover:underline"
              >
                {homeConfig.notificaciones.title}
              </Link>
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

          <div className="mt-3">
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
              <ul className="space-y-2">
                {filtered.slice(0, maxItems).map((n) => {
                  const date = formatDate(n.fecha);
                  
                  // Generar href: prioridad url/href del backend, luego tipo específico, luego fallback a anchor
                  let href: string;
                  if ((n as any).url || (n as any).href) {
                    href = (n as any).url || (n as any).href;
                  } else if (n.tipo === "SEMAFORO" && n.pueblo?.slug) {
                    href = `/pueblos/${n.pueblo.slug}`;
                  } else if (n.id) {
                    href = `/notificaciones#notif-${n.id}`;
                  } else {
                    href = homeConfig.notificaciones.allHref;
                  }

                  const titulo = getHomeItemTitle(n);
                  const motivo = n.tipo === "SEMAFORO" && n.motivoPublico?.trim() 
                    ? n.motivoPublico.trim() 
                    : null;

                  return (
                    <li key={n.id} className="flex items-start gap-3">
                      <div className="w-14 shrink-0 text-xs text-gray-500 pt-0.5">
                        {date}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={href}
                          className="block text-sm hover:underline"
                        >
                          {titulo}
                        </Link>
                        {motivo && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            Motivo: {motivo}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-3">
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

