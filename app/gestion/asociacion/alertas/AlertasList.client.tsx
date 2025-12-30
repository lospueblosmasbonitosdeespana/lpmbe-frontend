"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EliminarNotificacionButton from "../../../components/EliminarNotificacionButton";

type Alerta = {
  id: number;
  titulo: string;
  contenido?: string | null;
  createdAt?: string;
};

export default function AlertasList() {
  const [items, setItems] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const fetchAlertas = async () => {
    try {
      const res = await fetch("/api/gestion/asociacion/alertas", {
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
    fetchAlertas();
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
        <h1 className="text-3xl font-semibold">Alertas globales</h1>
        <p className="mt-1 text-gray-600">Asociación · Nacional</p>
        <p className="mt-3">
          <Link
            href="/gestion/asociacion/alertas/nueva"
            className="underline"
          >
            + Nueva alerta
          </Link>
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-md border border-slate-300 bg-white px-6 py-5 text-gray-700">
          No hay alertas globales todavía.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-slate-300 bg-white px-6 py-5"
            >
              <h3 className="text-lg font-bold text-gray-900">{a.titulo}</h3>
              {a.createdAt ? (
                <div className="mt-1 text-xs text-gray-500">
                  {new Date(a.createdAt).toLocaleDateString("es-ES")}
                </div>
              ) : null}
              {a.contenido ? (
                <p className="mt-2 whitespace-pre-wrap text-gray-900">
                  {a.contenido}
                </p>
              ) : null}
              <div className="mt-2 flex gap-4">
                <Link
                  href={`/gestion/asociacion/alertas/${a.id}/editar`}
                  className="underline"
                >
                  Editar
                </Link>
                <EliminarNotificacionButton
                  id={a.id}
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
