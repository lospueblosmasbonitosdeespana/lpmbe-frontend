"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Notificacion = {
  id: number;
  tipo?: string | null;
  titulo?: string | null;
  contenido?: string | null;
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

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

      const res = await fetch(`/api/notificaciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          contenido: contenido.trim() || null,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let msg = txt;
        try {
          const j = JSON.parse(txt);
          msg = j?.message ? String(j.message) : txt;
        } catch {}
        throw new Error(msg || `Error guardando (${res.status})`);
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

