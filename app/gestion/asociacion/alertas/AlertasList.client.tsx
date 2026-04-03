"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EliminarNotificacionButton from "@/app/components/EliminarNotificacionButton";
import { GestionAsociacionSubpageShell } from "../_components/GestionAsociacionSubpageShell";
import { AsociacionHeroIconAlertTriangle } from "../_components/asociacion-hero-icons";

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
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertas();
  }, []);

  const shellBase = {
    title: "Alertas globales",
    subtitle: "Avisos visibles a nivel nacional · Asociación LPMBE",
    heroIcon: <AsociacionHeroIconAlertTriangle />,
    maxWidthClass: "max-w-5xl" as const,
    heroAction: (
      <Link
        href="/gestion/asociacion/alertas/nueva"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white/15 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm transition-all hover:bg-white/25 hover:ring-white/40 active:scale-[0.98]"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        Nueva alerta
      </Link>
    ),
  };

  if (loading) {
    return (
      <GestionAsociacionSubpageShell {...shellBase}>
        <p className="text-muted-foreground">Cargando…</p>
      </GestionAsociacionSubpageShell>
    );
  }

  if (err) {
    return (
      <GestionAsociacionSubpageShell {...shellBase}>
        <p className="text-red-600">Error: {err}</p>
      </GestionAsociacionSubpageShell>
    );
  }

  return (
    <GestionAsociacionSubpageShell
      {...shellBase}
      heroBadges={
        <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
          <span className="text-lg font-bold">{items.length}</span>
          <span className="ml-1.5 text-xs text-white/70">
            {items.length === 1 ? "alerta" : "alertas"}
          </span>
        </div>
      }
    >
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
                <div className="mt-1 text-xs text-muted-foreground">
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
    </GestionAsociacionSubpageShell>
  );
}
