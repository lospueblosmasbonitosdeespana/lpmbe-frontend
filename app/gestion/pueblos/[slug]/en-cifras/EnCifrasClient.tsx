"use client";

import { useEffect, useState } from "react";

type Highlight = { orden: number; valor: string; etiqueta: string };

export default function EnCifrasClient({ slug }: { slug: string }) {
  const [puebloId, setPuebloId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([
    { orden: 1, valor: "", etiqueta: "" },
    { orden: 2, valor: "", etiqueta: "" },
    { orden: 3, valor: "", etiqueta: "" },
    { orden: 4, valor: "", etiqueta: "" },
  ]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErr(null);
        const puebloRes = await fetch(`/api/pueblos/${slug}`, { cache: "no-store" });
        if (!puebloRes.ok) throw new Error("Error cargando pueblo");
        const pueblo = await puebloRes.json();
        const id = pueblo?.id;
        if (!id) throw new Error("Pueblo sin id");
        setPuebloId(id);

        const res = await fetch(`/api/admin/pueblos/${id}/highlights`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (res.status === 401) {
          window.location.href = "/entrar";
          return;
        }
        if (res.status === 403) {
          setErr("No tienes permisos");
          return;
        }
        if (!res.ok) throw new Error("Error cargando highlights");

        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const filled: Highlight[] = [];
        for (let i = 0; i < 4; i++) {
          const h = list.find((x: Highlight) => x.orden === i + 1);
          filled.push({
            orden: i + 1,
            valor: h?.valor ?? "",
            etiqueta: h?.etiqueta ?? "",
          });
        }
        setHighlights(filled);
      } catch (e: any) {
        setErr(e?.message ?? "Error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  async function handleGuardar() {
    if (!puebloId) return;
    setGuardando(true);
    setMensaje(null);
    try {
      const r = await fetch(`/api/admin/pueblos/${puebloId}/highlights`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          highlights: highlights.map((h) => ({
            valor: h.valor.trim() || "—",
            etiqueta: h.etiqueta.trim() || "—",
          })),
        }),
        credentials: "include",
      });
      if (r.status === 401) {
        window.location.href = "/entrar";
        return;
      }
      if (r.status === 403) {
        setMensaje("No tienes permisos");
        return;
      }
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.error ?? `Error ${r.status}`);
      }
      setMensaje("Guardado correctamente");
    } catch (e: any) {
      setMensaje(e?.message ?? "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  function updateField(index: number, field: "valor" | "etiqueta", value: string) {
    setHighlights((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, [field]: value };
      return next;
    });
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p>Cargando...</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-red-600">Error: {err}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">En cifras - Patrimonio y Tradición</h1>
      <p className="mt-2 text-sm text-gray-600">
        Los 4 datos destacados que se muestran en la ficha del pueblo. Máx. 30 caracteres en valor y 40 en etiqueta.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {highlights.map((h, i) => (
          <div key={h.orden} className="rounded border p-4">
            <p className="mb-3 text-sm font-medium text-gray-700">Punto {i + 1}</p>
            <input
              type="text"
              value={h.valor}
              onChange={(e) => updateField(i, "valor", e.target.value)}
              placeholder="Ej: 1.182m, S. X, 1961"
              maxLength={30}
              className="mb-2 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={h.etiqueta}
              onChange={(e) => updateField(i, "etiqueta", e.target.value)}
              placeholder="Ej: ALTITUD, FUNDACIÓN"
              maxLength={40}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleGuardar}
          disabled={guardando}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {guardando ? "Guardando..." : "Guardar"}
        </button>
        {mensaje && (
          <p
            className={
              mensaje.includes("Error") || mensaje.includes("permisos")
                ? "text-sm text-red-600"
                : "text-sm text-green-600"
            }
          >
            {mensaje}
          </p>
        )}
      </div>

      <div className="mt-8">
        <a href={`/gestion/pueblos/${slug}`} className="text-sm underline">
          ← Volver a gestión del pueblo
        </a>
      </div>
    </div>
  );
}
