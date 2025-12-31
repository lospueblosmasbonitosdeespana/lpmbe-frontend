"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Evento = {
  id: number;
  titulo: string;
  descripcion: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
};

// Helper para convertir ISO a YYYY-MM-DD para input type="date"
function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

// Helper para convertir YYYY-MM-DD a ISO
function dateInputToIso(dateStr: string): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr + "T00:00:00.000Z");
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

export default function Page() {
  const params = useParams<{ slug: string; id: string }>();
  const router = useRouter();

  const slug = params?.slug;
  const id = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!slug || !Number.isFinite(id)) return;

      setLoading(true);
      setError(null);

      try {
        // Reutilizamos el listado del pueblo (ya está con auth/cookies bien)
        const res = await fetch(
          `/api/gestion/eventos?puebloSlug=${encodeURIComponent(slug)}`,
          {
            cache: "no-store",
            credentials: "include",
          }
        );

        if (!res.ok) {
          throw new Error(`Error cargando eventos (HTTP ${res.status})`);
        }

        const data = await res.json();
        const items: Evento[] = Array.isArray(data) ? data : data.items ?? data.data ?? [];

        const item = items.find((x) => x.id === id);
        if (!item) throw new Error("No se encontró el evento");

        if (!cancelled) {
          setTitulo(item.titulo ?? "");
          setDescripcion(item.descripcion ?? "");
          const inicio = item.fecha_inicio || item.fechaInicio;
          const fin = item.fecha_fin || item.fechaFin;
          setFechaInicio(isoToDateInput(inicio));
          setFechaFin(isoToDateInput(fin));
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Error cargando");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const fechaInicioISO = dateInputToIso(fechaInicio);
      const fechaFinISO = fechaFin ? dateInputToIso(fechaFin) : null;

      if (!fechaInicioISO) {
        setError("Fecha de inicio requerida");
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/eventos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          fecha_inicio: fechaInicioISO,
          fecha_fin: fechaFinISO,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let msg = txt;
        try {
          const j = JSON.parse(txt);
          msg = j?.message ? String(j.message) : txt;
        } catch {}
        throw new Error(msg || `Error guardando (HTTP ${res.status})`);
      }

      router.push(`/gestion/pueblos/${slug}/eventos`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Error guardando");
    } finally {
      setSaving(false);
    }
  }

  if (!slug || !Number.isFinite(id)) {
    return <main className="mx-auto max-w-4xl px-6 py-8">Parámetros inválidos</main>;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">Editar evento</h1>
        <p className="mt-1">
          Pueblo: <strong>{slug}</strong> · ID: <strong>{id}</strong>
        </p>
        <p className="mt-3">
          <Link href={`/gestion/pueblos/${slug}/eventos`} className="underline">
            ← Volver
          </Link>
        </p>
      </header>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Título</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              rows={6}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Fecha inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Fecha fin (opcional)</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </div>
          </div>

          {error ? <p className="text-red-600">{error}</p> : null}

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="underline">
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" className="underline" onClick={() => router.back()}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </main>
  );
}

