"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EliminarNotificacionButton from "../../../components/EliminarNotificacionButton";

type Evento = {
  id: number;
  titulo: string;
  contenido?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  createdAt?: string;
};

export default function EventosList() {
  const [items, setItems] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const fetchEventos = async () => {
    try {
      const res = await fetch("/api/gestion/asociacion/eventos", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const text = await res.text();
      if (!res.ok) {
        setErr(text || `HTTP ${res.status}`);
        setItems([]);
        return;
      }

      const data = text ? JSON.parse(text) : [];
      const arr = Array.isArray(data) ? data : (data.items ?? data.data ?? []);
      // Filtrar por tipo === "EVENTO"
      const eventos = arr.filter((e: any) => (e.tipo ?? "").toUpperCase() === "EVENTO");
      // Ordenar por fechaInicio/fecha_inicio/createdAt desc
      const ordenados = [...eventos].sort((a, b) => {
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
  }, []);

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
        No hay eventos globales todavía.
      </div>
    );
  }

  return (
    <ul className="mt-6 space-y-3">
      {items.map((e) => {
        const fechaInicio = e.fechaInicio || e.fecha_inicio;
        const fechaFin = e.fechaFin || e.fecha_fin;
        const fechaDisplay = fechaInicio || fechaFin || e.createdAt;

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
            {e.contenido ? (
              <div className="mt-2 text-sm text-gray-700">
                {String(e.contenido).slice(0, 220)}
                {String(e.contenido).length > 220 ? "…" : ""}
              </div>
            ) : null}
            <div className="mt-3 flex gap-4">
              <Link
                href={`/gestion/asociacion/eventos/${e.id}/editar`}
                className="underline"
              >
                Editar
              </Link>
              <EliminarNotificacionButton
                id={e.id}
                confirmText="¿Eliminar este evento? Esto no se puede deshacer."
                onDeleted={(id) => {
                  setItems((prev) => prev.filter((x) => x.id !== id));
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}


