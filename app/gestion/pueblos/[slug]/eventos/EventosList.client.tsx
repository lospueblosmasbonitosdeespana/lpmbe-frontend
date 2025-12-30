"use client";

import { useEffect, useState } from "react";

type Evento = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  createdAt?: string;
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("es-ES");
  } catch {
    return String(dateStr);
  }
}

type Props = {
  puebloSlug: string;
};

export default function EventosList({ puebloSlug }: Props) {
  const [items, setItems] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const fetchEventos = async () => {
    if (!puebloSlug) return;

    try {
      const res = await fetch(
        `/api/gestion/eventos?puebloSlug=${encodeURIComponent(puebloSlug)}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const text = await res.text();
      if (!res.ok) {
        setErr(text || `HTTP ${res.status}`);
        setItems([]);
        return;
      }

      const data = text ? JSON.parse(text) : {};
      
      const items =
        Array.isArray(data) ? data :
        Array.isArray(data.items) ? data.items :
        Array.isArray(data.data) ? data.data :
        Array.isArray(data.results) ? data.results :
        [];

      console.log("[LIST] raw", data);
      console.log("[LIST] items", items.length, items[0]);

      // Ordenar por fecha_inicio descendente
      const sorted = [...items].sort((a: any, b: any) => {
        const dateA = a.fecha_inicio || a.createdAt || "";
        const dateB = b.fecha_inicio || b.createdAt || "";
        return dateB.localeCompare(dateA);
      });

      setItems(sorted);
    } catch (e: any) {
      setErr(e?.message ?? "Error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, [puebloSlug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div>Cargando…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="text-red-600">Error: {err}</div>
      </div>
    );
  }

  return (
    <>
      {items.length === 0 ? (
        <div className="rounded-md border border-slate-300 bg-white px-6 py-5 text-gray-700">
          No hay eventos todavía.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((e) => (
            <div
              key={e.id}
              className="rounded-xl border border-slate-300 bg-white px-6 py-5"
            >
              <h3 className="text-lg font-bold text-gray-900">{e.titulo}</h3>
              {(e.fecha_inicio || e.fecha_fin || e.createdAt) ? (
                <div className="mt-1 text-xs text-gray-500">
                  {e.fecha_inicio && e.fecha_fin
                    ? `Del ${formatDate(e.fecha_inicio)} al ${formatDate(e.fecha_fin)}`
                    : e.fecha_inicio
                    ? formatDate(e.fecha_inicio)
                    : e.createdAt
                    ? formatDate(e.createdAt)
                    : ""}
                </div>
              ) : null}
              {e.descripcion ? (
                <p className="mt-2 whitespace-pre-wrap text-gray-900">
                  {e.descripcion}
                </p>
              ) : null}
              <div className="mt-2 flex gap-4">
                <a
                  href={`/gestion/pueblos/${puebloSlug}/eventos/${e.id}/editar`}
                  className="underline"
                >
                  Editar
                </a>
                <a
                  href="#"
                  onClick={async (ev) => {
                    ev.preventDefault();
                    if (!confirm("¿Eliminar este evento? Esto no se puede deshacer.")) return;
                    try {
                      const res = await fetch(`/api/eventos/${e.id}`, {
                        method: "DELETE",
                        credentials: "include",
                        cache: "no-store",
                      });
                      if (!res.ok) {
                        const txt = await res.text().catch(() => "");
                        alert(txt || `Error eliminando (HTTP ${res.status})`);
                        return;
                      }
                      setItems((prev) => prev.filter((x) => x.id !== e.id));
                    } catch (err: any) {
                      alert(err?.message ?? "Error eliminando");
                    }
                  }}
                  className="underline"
                >
                  Eliminar
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

