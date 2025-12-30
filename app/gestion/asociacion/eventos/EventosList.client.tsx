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

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("es-ES");
  } catch {
    return String(dateStr);
  }
}

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
      setItems(arr);
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
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">Eventos globales</h1>
        <p className="mt-1 text-gray-600">Asociación · Nacional</p>
        <p className="mt-3">
          <Link
            href="/gestion/asociacion/eventos/nuevo"
            className="underline"
          >
            + Nuevo evento
          </Link>
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-md border border-slate-300 bg-white px-6 py-5 text-gray-700">
          No hay eventos globales todavía.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((e) => (
            <div
              key={e.id}
              className="rounded-xl border border-slate-300 bg-white px-6 py-5"
            >
              <h3 className="text-lg font-bold text-gray-900">{e.titulo}</h3>
              {(e.fechaInicio || e.fechaFin || e.fecha_inicio || e.fecha_fin || e.createdAt) ? (
                <div className="mt-1 text-xs text-gray-500">
                  {(e.fechaInicio || e.fecha_inicio) && (e.fechaFin || e.fecha_fin)
                    ? `Del ${formatDate(e.fechaInicio || e.fecha_inicio)} al ${formatDate(e.fechaFin || e.fecha_fin)}`
                    : (e.fechaInicio || e.fecha_inicio)
                    ? formatDate(e.fechaInicio || e.fecha_inicio)
                    : e.createdAt
                    ? formatDate(e.createdAt)
                    : ""}
                </div>
              ) : null}
              {e.contenido ? (
                <p className="mt-2 whitespace-pre-wrap text-gray-900">
                  {e.contenido}
                </p>
              ) : null}
              <div className="mt-2 flex gap-4">
                <Link
                  href={`/gestion/asociacion/eventos/${e.id}/editar`}
                  className="underline"
                >
                  Editar
                </Link>
                <EliminarNotificacionButton
                  id={e.id}
                  onDeleted={(id) => {
                    setItems((prev) => prev.filter((x) => x.id !== id));
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

