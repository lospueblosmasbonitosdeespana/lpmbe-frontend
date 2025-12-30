"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Evento = {
  id: number;
  titulo?: string | null;
  descripcion?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
};

export default function EditarEventoPage() {
  const router = useRouter();
  const params = useParams<{ slug: string; id: string }>();

  const slug = params?.slug || "";
  const id = useMemo(() => {
    const raw = params?.id;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !id) {
      setLoading(false);
      setLoadError("Parámetros inválidos");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setLoadError(null);

        // Cargar desde el listado (igual que alertas)
        const res = await fetch(
          `/api/gestion/eventos?puebloSlug=${encodeURIComponent(slug)}`,
          {
            cache: "no-store",
          }
        );

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Error cargando eventos (${res.status})`);
        }

        const data = await res.json();
        const items: Evento[] = Array.isArray(data)
          ? data
          : data.items ?? data.data ?? [];

        const item = items.find((x) => x.id === id);

        if (!item) {
          throw new Error(`No se encontró el evento con id=${id}`);
        }

        if (!cancelled) {
          setTitulo(item.titulo ?? "");
          setDescripcion(item.descripcion ?? "");
          
          // Convertir fechas ISO a YYYY-MM-DD para inputs
          if (item.fecha_inicio) {
            const date = new Date(item.fecha_inicio);
            setFechaInicio(date.toISOString().split('T')[0]);
          }
          if (item.fecha_fin) {
            const date = new Date(item.fecha_fin);
            setFechaFin(date.toISOString().split('T')[0]);
          }
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
  }, [slug, id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;

    try {
      setSaving(true);
      setSaveError(null);

      // Convertir fechas a ISO
      let fechaInicioISO = null;
      let fechaFinISO = null;
      
      if (fechaInicio) {
        fechaInicioISO = new Date(fechaInicio + 'T00:00:00.000Z').toISOString();
      }
      
      if (fechaFin) {
        fechaFinISO = new Date(fechaFin + 'T00:00:00.000Z').toISOString();
      }

      const res = await fetch(`/api/eventos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          descripcion: descripcion.trim() || null,
          fecha_inicio: fechaInicioISO,
          fecha_fin: fechaFinISO || undefined,
        }),
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
      setSaveError(e?.message ?? "Error guardando");
    } finally {
      setSaving(false);
    }
  }

  if (!slug || !Number.isFinite(id)) {
    return <main className="mx-auto max-w-4xl px-6 py-8">Parámetros inválidos</main>;
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
          <Link href={`/gestion/pueblos/${slug}/eventos`} className="underline">
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
        <p className="mt-1">
          Pueblo: <strong>{slug}</strong> · ID: <strong>{id}</strong>
        </p>
        <p className="mt-3">
          <Link href={`/gestion/pueblos/${slug}/eventos`} className="underline">
            ← Volver
          </Link>
        </p>
      </header>

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
            <label className="block text-sm font-medium">Fecha fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        {saveError ? <p className="text-red-600">{saveError}</p> : null}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="underline">
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <button type="button" className="underline" onClick={() => router.back()}>
            Cancelar
          </button>
        </div>
      </form>
    </main>
  );
}

