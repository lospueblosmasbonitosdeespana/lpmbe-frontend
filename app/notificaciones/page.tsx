"use client";

import { useEffect, useState } from "react";
import NotificacionesList from "../_components/notificaciones/NotificacionesList";

type NotifItem = {
  id?: string | number;
  tipo?: string;
  titulo?: string;
  mensaje?: string;
  createdAt?: string;
  fecha?: string;
  puebloNombre?: string;
  pueblo?: { nombre?: string };
  url?: string;
  href?: string;
};

function normalizeFeed(data: any): NotifItem[] {
  const raw =
    Array.isArray(data) ? data :
    Array.isArray(data?.items) ? data.items :
    Array.isArray(data?.data) ? data.data :
    [];

  // Garantiza array plano
  return raw.filter(Boolean);
}

export default function NotificacionesPage() {
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch("/api/notificaciones/feed", { cache: "no-store" });
        const data = await res.json().catch(() => null);
        const normalized = normalizeFeed(data);
        if (alive) {
          setItems(normalized);
          
          // Scroll a anchor si hay hash en la URL
          if (typeof window !== 'undefined' && window.location.hash) {
            setTimeout(() => {
              const element = document.querySelector(window.location.hash);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
          }
        }
      } catch (e: any) {
        if (alive) setErr("No se pudo cargar el centro de notificaciones.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-4xl font-semibold">Centro de notificaciones</h1>
      <p className="mt-2 text-gray-600">Noticias, alertas y estado de semáforos.</p>

      {loading ? (
        <p className="mt-8">Cargando...</p>
      ) : err ? (
        <div className="mt-8">
          <p className="text-red-600">{err}</p>
          <button
            className="mt-4 rounded px-4 py-2 border"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="mt-8">
          <NotificacionesList items={items} />
        </div>
      )}
    </div>
  );
}
