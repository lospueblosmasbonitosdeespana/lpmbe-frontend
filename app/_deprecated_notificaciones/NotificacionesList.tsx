"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api";

type NotificacionTipo = "NOTICIA" | "SEMAFORO" | "ALERTA";

type Notificacion = {
  id: number | string;
  tipo: NotificacionTipo;
  titulo: string;
  resumen?: string | null;
  fecha?: string | null; // ISO
  puebloId?: number | null;
  puebloSlug?: string | null;
};

type ApiResponse =
  | Notificacion[]
  | {
      items: Notificacion[];
      nextCursor?: string | null;
    };

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getTipoLabel(tipo: NotificacionTipo): string {
  switch (tipo) {
    case "NOTICIA":
      return "Noticia";
    case "SEMAFORO":
      return "Semáforo";
    case "ALERTA":
      return "Alerta";
    default:
      return tipo;
  }
}

function getTipoBadgeClass(tipo: NotificacionTipo): string {
  switch (tipo) {
    case "NOTICIA":
      return "bg-blue-100 text-blue-800";
    case "SEMAFORO":
      return "bg-yellow-100 text-yellow-800";
    case "ALERTA":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

type Props = {
  tipo?: NotificacionTipo;
};

export default function NotificacionesList({ tipo }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const activeTab = tipo ?? undefined;

  const handleTabChange = (newTipo: NotificacionTipo | undefined) => {
    if (!newTipo) {
      router.push("/notificaciones");
    } else {
      router.push(`/notificaciones?tipo=${newTipo}`);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const url = new URL(`${getApiUrl()}/notificaciones`);
        url.searchParams.set("limit", "20");
        if (tipo) {
          url.searchParams.set("tipo", tipo);
        }

        const res = await fetch(url.toString(), {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Error cargando notificaciones");
        }

        const data = (await res.json()) as ApiResponse;

        // Parseo robusto de respuesta
        let parsedItems: Notificacion[] = [];
        let parsedNextCursor: string | null = null;

        if (Array.isArray(data)) {
          parsedItems = data;
          parsedNextCursor = null;
        } else if (data && Array.isArray(data.items)) {
          parsedItems = data.items;
          parsedNextCursor = data.nextCursor ?? null;
        }

        if (!cancelled) {
          setItems(parsedItems);
          setNextCursor(parsedNextCursor);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error desconocido");
          setItems([]);
          setNextCursor(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tipo]);

  const loadMore = async () => {
    if (!nextCursor || loading) return;

    try {
      setLoading(true);

      const url = new URL(`${getApiUrl()}/notificaciones`);
      url.searchParams.set("limit", "20");
      url.searchParams.set("cursor", nextCursor);
      if (tipo) {
        url.searchParams.set("tipo", tipo);
      }

      const res = await fetch(url.toString(), {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Error cargando más notificaciones");
      }

      const data = (await res.json()) as ApiResponse;

      let parsedItems: Notificacion[] = [];
      let parsedNextCursor: string | null = null;

      if (Array.isArray(data)) {
        parsedItems = data;
        parsedNextCursor = null;
      } else if (data && Array.isArray(data.items)) {
        parsedItems = data.items;
        parsedNextCursor = data.nextCursor ?? null;
      }

      setItems((prev) => [...prev, ...parsedItems]);
      setNextCursor(parsedNextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => handleTabChange(undefined)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            !activeTab
              ? "bg-black text-white"
              : "bg-black/5 text-black hover:bg-black/10"
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => handleTabChange("NOTICIA")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            activeTab === "NOTICIA"
              ? "bg-black text-white"
              : "bg-black/5 text-black hover:bg-black/10"
          }`}
        >
          Noticias
        </button>
        <button
          onClick={() => handleTabChange("SEMAFORO")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            activeTab === "SEMAFORO"
              ? "bg-black text-white"
              : "bg-black/5 text-black hover:bg-black/10"
          }`}
        >
          Semáforos
        </button>
        <button
          onClick={() => handleTabChange("ALERTA")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            activeTab === "ALERTA"
              ? "bg-black text-white"
              : "bg-black/5 text-black hover:bg-black/10"
          }`}
        >
          Alertas
        </button>
      </div>

      {/* Listado */}
      {loading && items.length === 0 ? (
        <div className="text-sm text-gray-500">Cargando…</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500">
          No hay notificaciones disponibles.
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((n) => (
              <div
                key={n.id}
                className="rounded-xl border border-black/10 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getTipoBadgeClass(
                          n.tipo
                        )}`}
                      >
                        {getTipoLabel(n.tipo)}
                      </span>
                      {n.fecha && (
                        <span className="text-xs text-gray-500">
                          {formatDate(n.fecha)}
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium">{n.titulo}</h3>
                    {n.resumen && (
                      <p className="mt-2 text-sm text-gray-600">{n.resumen}</p>
                    )}
                    {n.puebloSlug && (
                      <div className="mt-3">
                        <Link
                          href={`/pueblos/${n.puebloSlug}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          Ver pueblo →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botón Cargar más */}
          {nextCursor && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="rounded-xl bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-black/90 disabled:opacity-50"
              >
                {loading ? "Cargando…" : "Cargar más"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

