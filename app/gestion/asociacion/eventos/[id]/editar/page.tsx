"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Notificacion = {
  id: number;
  tipo?: string | null;
  titulo?: string | null;
  contenido?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  createdAt?: string | null;
};

export default function EditarEventoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const id = useMemo(() => {
    const raw = params?.id;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function isoToDateInput(iso: string | null | undefined): string {
    if (!iso) return "";
    try {
      const date = new Date(iso);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  }

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setLoadError("ID inválido");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setLoadError(null);

        // Usamos el listado para encontrar el item por id
        const res = await fetch("/api/gestion/asociacion/eventos", {
          cache: "no-store",
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Error cargando eventos (${res.status})`);
        }

        const data = await res.json();
        const items: Notificacion[] = Array.isArray(data)
          ? data
          : data.items ?? data.data ?? [];

        const item = items.find((x) => x.id === id);

        if (!item) {
          throw new Error(`No se encontró el evento con id=${id}`);
        }

        if (!cancelled) {
          setTitulo(item.titulo ?? "");
          setContenido(item.contenido ?? "");
          setFechaInicio(isoToDateInput(item.fechaInicio || item.fecha_inicio));
          setFechaFin(isoToDateInput(item.fechaFin || item.fecha_fin));
        }
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(e?.message ?? "Error cargando datos");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;

    try {
      setSaving(true);
      setSaveError(null);

      const payload: any = {
        titulo: titulo.trim(),
        contenido: contenido.trim() || null,
      };

      // Solo añadir fechas si están presentes
      if (fechaInicio) {
        payload.fechaInicio = new Date(fechaInicio + "T00:00:00.000Z").toISOString();
      }
      if (fechaFin) {
        payload.fechaFin = new Date(fechaFin + "T00:00:00.000Z").toISOString();
      }

      const res = await fetch(`/api/notificaciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Error guardando (${res.status})`);
      }

      router.push("/gestion/asociacion/eventos");
      router.refresh();
    } catch (e: any) {
      setSaveError(e?.message ?? "Error guardando");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-4xl px-6 py-8">Cargando...</main>;
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-2xl font-semibold">Editar evento</h1>
        <p className="mt-3 text-red-600">{loadError}</p>
        <p className="mt-4">
          <Link href="/gestion/asociacion/eventos" className="underline">
            ← Volver
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">Editar evento</h1>
        <p className="mt-1 text-sm opacity-70">ID: {id}</p>
      </header>

      <form onSubmit={onSave} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold">Título</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold">Fecha inicio</label>
          <input
            type="date"
            className="mt-1 w-full rounded border px-3 py-2"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold">Fecha fin</label>
          <input
            type="date"
            className="mt-1 w-full rounded border px-3 py-2"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold">Contenido</label>
          <textarea
            className="mt-1 w-full rounded border px-3 py-2"
            rows={6}
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
          />
        </div>

        {saveError ? <p className="text-red-600">{saveError}</p> : null}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="underline"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="underline"
          >
            Cancelar
          </button>
        </div>
      </form>
    </main>
  );
}


