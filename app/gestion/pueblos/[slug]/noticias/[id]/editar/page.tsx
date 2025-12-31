"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Noticia = {
  id: number;
  titulo: string;
  contenido: string;
  fecha?: string | null;
};

export default function Page() {
  const params = useParams<{ slug: string; id: string }>();
  const router = useRouter();

  const slug = params?.slug;
  const id = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!slug || !Number.isFinite(id)) return;

      setLoading(true);
      setError(null);

      try {
        // Reutilizamos el listado del pueblo (ya está con auth/cookies bien)
        const res = await fetch(
          `/api/gestion/noticias?puebloSlug=${encodeURIComponent(slug)}`,
          {
            cache: "no-store",
            credentials: "include",
          }
        );

        if (!res.ok) {
          throw new Error(`Error cargando noticias (HTTP ${res.status})`);
        }

        const data = await res.json();
        const items: Noticia[] = Array.isArray(data) ? data : data.items ?? data.data ?? [];

        const item = items.find((x) => x.id === id);
        if (!item) throw new Error("No se encontró la noticia");

        if (!cancelled) {
          setTitulo(item.titulo ?? "");
          setContenido(item.contenido ?? "");
        }
      } catch (e: any) {
        if (!cancelled) return;
        setError(e?.message ?? "Error cargando");
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
      const res = await fetch(`/api/noticias/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: titulo.trim(), contenido: contenido.trim() }),
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

      router.push(`/gestion/pueblos/${slug}/noticias`);
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
        <h1 className="text-3xl font-semibold">Editar noticia</h1>
        <p className="mt-1">
          Pueblo: <strong>{slug}</strong> · ID: <strong>{id}</strong>
        </p>
        <p className="mt-3">
          <Link href={`/gestion/pueblos/${slug}/noticias`} className="underline">
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
            <label className="block text-sm font-medium">Contenido</label>
            <textarea
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              rows={6}
              required
            />
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

