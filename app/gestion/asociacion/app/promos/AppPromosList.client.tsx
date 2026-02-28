"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type AppPromoItem = {
  id: number;
  title: string;
  body: string | null;
  imageUrl: string | null;
  ctaText: string;
  ctaLink: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  trigger: string;
  frequency: string;
  showAfterSeconds: number | null;
  orden: number;
  createdAt: string;
};

const TRIGGER_LABELS: Record<string, string> = {
  home: "Solo en Home",
  app_open: "Solo al abrir app",
  both: "Home y al abrir app",
};

const FREQUENCY_LABELS: Record<string, string> = {
  once_ever: "Una vez por usuario (nunca repetir)",
  once_per_day: "Una vez al día",
  once_per_session: "Una vez por sesión",
  every_time: "Cada vez",
};

export default function AppPromosList() {
  const [items, setItems] = useState<AppPromoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const fetchPromos = async () => {
    try {
      const res = await fetch("/api/admin/app-promos", {
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
      const arr = Array.isArray(data) ? data : [];
      setItems(arr);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
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
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Pop-ups y ofertas (app)</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Los usuarios verán el pop-up activo según las reglas que definas.
          </p>
        </div>
        <Link
          href="/gestion/asociacion/app/promos/nueva"
          className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          + Nueva promo
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-6 py-8 text-center text-muted-foreground">
          No hay pop-ups creados. Crea uno para que aparezca en la app.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((p) => {
            const start = new Date(p.startDate).toLocaleDateString("es-ES");
            const end = new Date(p.endDate).toLocaleDateString("es-ES");
            const active = p.isActive && new Date(p.endDate) >= new Date() && new Date(p.startDate) <= new Date();
            return (
              <div
                key={p.id}
                className="rounded-lg border border-border bg-card px-6 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{p.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {start} – {end}
                      {p.showAfterSeconds != null ? ` · Tras ${p.showAfterSeconds}s` : ""}
                      {" · "}
                      {TRIGGER_LABELS[p.trigger] ?? p.trigger}
                      {" · "}
                      {FREQUENCY_LABELS[p.frequency] ?? p.frequency}
                    </p>
                    <span
                      className={`mt-2 inline-block rounded px-2 py-0.5 text-xs font-medium ${
                        active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.isActive ? (active ? "Activa ahora" : "Programada") : "Desactivada"}
                    </span>
                  </div>
                  <Link
                    href={`/gestion/asociacion/app/promos/${p.id}/editar`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Editar
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
