"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TipTapEditor from "@/app/_components/editor/TipTapEditor";
import SafeHtml from "@/app/_components/ui/SafeHtml";

type EditorMode = "edit" | "html" | "preview";

type Notificacion = {
  id: number;
  tipo?: string | null;
  titulo?: string | null;
  contenido?: string | null;
  createdAt?: string | null;
};

export default function EditarAlertaPage() {
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
  const [editorMode, setEditorMode] = useState<EditorMode>("edit");

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

        const res = await fetch(`/api/gestion/asociacion/notificaciones/${id}`, {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Error cargando alerta (${res.status})`);
        }

        const item: Notificacion = await res.json();

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

      const res = await fetch(`/api/gestion/asociacion/notificaciones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          titulo: titulo.trim(),
          contenido: contenido.trim() || null,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Error guardando (${res.status})`);
      }

      router.push("/gestion/asociacion/alertas");
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
        <h1 className="text-2xl font-semibold">Editar alerta</h1>
        <p className="mt-3 text-red-600">{loadError}</p>
        <p className="mt-4">
          <Link href="/gestion/asociacion/alertas" className="underline">
            ← Volver
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">Editar alerta</h1>
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
          <div className="mt-1 flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setEditorMode("edit")}
              className={`px-3 py-1.5 rounded text-sm font-medium ${editorMode === "edit" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              Editor
            </button>
            <button
              type="button"
              onClick={() => setEditorMode("html")}
              className={`px-3 py-1.5 rounded text-sm font-medium ${editorMode === "html" ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              HTML
            </button>
            <button
              type="button"
              onClick={() => setEditorMode("preview")}
              className={`px-3 py-1.5 rounded text-sm font-medium ${editorMode === "preview" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              Vista previa
            </button>
          </div>

          {editorMode === "edit" && (
            <TipTapEditor
              content={contenido}
              onChange={setContenido}
              placeholder="Escribe el contenido de la alerta..."
              minHeight="200px"
            />
          )}
          {editorMode === "html" && (
            <textarea
              className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm"
              rows={12}
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="<p>Contenido HTML...</p>"
            />
          )}
          {editorMode === "preview" && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 min-h-[150px]">
              {contenido ? (
                <SafeHtml html={contenido} />
              ) : (
                <p className="text-gray-400 text-center py-6">Sin contenido</p>
              )}
            </div>
          )}
        </div>

        {saveError ? <p className="text-red-600">{saveError}</p> : null}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>

      <div className="mt-6 text-sm">
        <Link href="/gestion/asociacion/alertas" className="hover:underline">
          ← Volver a alertas
        </Link>
      </div>
    </main>
  );
}
