"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EliminarItemButton from "@/app/components/EliminarItemButton";

type Evento = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  contenido?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  createdAt?: string;
};

type Props = {
  puebloSlug: string;
};

export default function EventosList({ puebloSlug }: Props) {
  const [items, setItems] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const fetchEventos = async () => {
    try {
      setLoading(true);
      setErr(null);
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

      const data = text ? JSON.parse(text) : [];
      const arr = Array.isArray(data) ? data : (data.items ?? data.data ?? []);
      // Ordenar por fechaInicio/fecha_inicio/createdAt desc
      const ordenados = [...arr].sort((a, b) => {
        const fechaA = a.fechaInicio || a.fecha_inicio || a.createdAt || "";
        const fechaB = b.fechaInicio || b.fecha_inicio || b.createdAt || "";
        return fechaB.localeCompare(fechaA);
      });
      setItems(ordenados);
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
      <div className="mt-6">
        <div>Cargando…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="mt-6">
        <div className="text-red-600">Error: {err}</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-6 rounded-md border p-4 text-sm text-gray-600">
        No hay eventos todavía.
      </div>
    );
  }

  return (
    <ul className="mt-6 space-y-3">
      {items.map((e) => {
        const fechaInicio = e.fechaInicio || e.fecha_inicio;
        const fechaFin = e.fechaFin || e.fecha_fin;
        const fechaDisplay = fechaInicio || fechaFin || e.createdAt;
        const descripcion = e.descripcion || e.contenido;

        return (
          <li key={e.id} className="rounded-md border p-4">
            <div className="font-medium">{e.titulo ?? "(sin título)"}</div>
            {fechaDisplay && (
              <div className="mt-1 text-xs text-gray-500">
                {fechaInicio && fechaFin
                  ? `${new Date(fechaInicio).toLocaleDateString("es-ES")} → ${new Date(fechaFin).toLocaleDateString("es-ES")}`
                  : fechaInicio
                  ? new Date(fechaInicio).toLocaleDateString("es-ES")
                  : fechaFin
                  ? new Date(fechaFin).toLocaleDateString("es-ES")
                  : e.createdAt
                  ? new Date(e.createdAt).toLocaleDateString("es-ES")
                  : ""}
              </div>
            )}
            {descripcion ? (
              <div className="mt-2 text-sm text-gray-700">
                {String(descripcion).slice(0, 220)}
                {String(descripcion).length > 220 ? "…" : ""}
              </div>
            ) : null}
            <div className="mt-3 flex gap-4">
              <Link
                href={`/gestion/pueblos/${puebloSlug}/eventos/${e.id}/editar`}
                className="underline"
              >
                Editar
              </Link>
              <EliminarItemButton
                endpoint={`/api/eventos/${e.id}`}
                onDeleted={() => fetchEventos()}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

