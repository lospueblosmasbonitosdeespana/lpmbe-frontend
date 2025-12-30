"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Noticia = {
  id: number;
  titulo?: string | null;
  contenido?: string | null;
  fecha?: string | null;
};

export default function EditarNoticiaPage() {
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
  const [contenido, setContenido] = useState("");

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
          `/api/gestion/noticias?puebloSlug=${encodeURIComponent(slug)}`,
          {
            cache: "no-store",
          }
        );

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Error cargando noticias (${res.status})`);
        }

        const data = await res.json();
        const items: Noticia[] = Array.isArray(data)
          ? data
          : data.items ?? data.data ?? [];

        const item = items.find((x) => x.id === id);

        if (!item) {
          throw new Error(`No se encontró la noticia con id=${id}`);
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
  }, [slug, id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;

    try {
      setSaving(true);
      setSaveError(null);

      const res = await fetch(`/api/noticias/${id}`, {
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
        throw new Error(msg || `Error guardando (HTTP ${res.status})`);
      }

      router.push(`/gestion/pueblos/${slug}/noticias`);
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
        <h1 className="text-2xl font-semibold">Editar noticia</h1>
        <p className="mt-3 text-red-600">{loadError}</p>
        <p className="mt-4">
          <Link href={`/gestion/pueblos/${slug}/noticias`} className="underline">
            ← Volver
          </Link>
        </p>
      </main>
    );
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

