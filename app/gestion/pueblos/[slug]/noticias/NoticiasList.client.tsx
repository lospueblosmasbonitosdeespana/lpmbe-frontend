"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EliminarItemButton from "@/app/components/EliminarItemButton";

type Noticia = {
  id: number;
  titulo: string;
  contenido?: string | null;
  fecha?: string | null;
  createdAt?: string;
};

type Props = {
  puebloSlug: string;
};

export default function NoticiasList({ puebloSlug }: Props) {
  const [items, setItems] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const fetchNoticias = async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(
        `/api/gestion/noticias?puebloSlug=${encodeURIComponent(puebloSlug)}`,
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
      // Ordenar por fecha/createdAt desc
      const ordenadas = [...arr].sort((a, b) => {
        const fechaA = a.fecha || a.createdAt || "";
        const fechaB = b.fecha || b.createdAt || "";
        return fechaB.localeCompare(fechaA);
      });
      setItems(ordenadas);
    } catch (e: any) {
      setErr(e?.message ?? "Error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNoticias();
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
        No hay noticias todavía.
      </div>
    );
  }

  return (
    <ul className="mt-6 space-y-3">
      {items.map((n) => (
        <li key={n.id} className="rounded-md border p-4">
          <div className="font-medium">{n.titulo ?? "(sin título)"}</div>
          {(n.fecha || n.createdAt) && (
            <div className="mt-1 text-xs text-gray-500">
              {n.fecha 
                ? new Date(n.fecha).toLocaleDateString("es-ES")
                : n.createdAt 
                ? new Date(n.createdAt).toLocaleDateString("es-ES")
                : ""}
            </div>
          )}
          {n.contenido ? (
            <div className="mt-2 text-sm text-gray-700">
              {String(n.contenido).slice(0, 220)}
              {String(n.contenido).length > 220 ? "…" : ""}
            </div>
          ) : null}
          <div className="mt-3 flex gap-4">
            <Link
              href={`/gestion/pueblos/${puebloSlug}/noticias/${n.id}/editar`}
              className="underline"
            >
              Editar
            </Link>
            <EliminarItemButton
              endpoint={`/api/noticias/${n.id}`}
              onDeleted={() => fetchNoticias()}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

