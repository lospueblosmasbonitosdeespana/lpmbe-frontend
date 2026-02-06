"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Video = {
  id: number;
  titulo: string;
  url: string;
  tipo: string;
  thumbnail?: string | null;
  orden: number;
  activo: boolean;
};

export default function VideosAsociacionClient() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [tipo, setTipo] = useState<"YOUTUBE" | "R2">("YOUTUBE");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch("/api/admin/asociacion/videos", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401) {
        window.location.href = "/entrar";
        return;
      }
      if (!res.ok) throw new Error("Error cargando videos");
      const data = await res.json();
      setVideos(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !url.trim()) return;
    setGuardando(true);
    setMensaje(null);
    try {
      const body = { titulo: titulo.trim(), url: url.trim(), tipo };
      if (editId) {
        const res = await fetch(`/api/admin/asociacion/videos/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include",
        });
        if (res.status === 401) {
          window.location.href = "/entrar";
          return;
        }
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d?.error ?? `Error ${res.status}`);
        }
        setMensaje("Video actualizado");
      } else {
        const res = await fetch("/api/admin/asociacion/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include",
        });
        if (res.status === 401) {
          window.location.href = "/entrar";
          return;
        }
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d?.error ?? `Error ${res.status}`);
        }
        setMensaje("Video añadido");
      }
      setTitulo("");
      setUrl("");
      setTipo("YOUTUBE");
      setEditId(null);
      setShowForm(false);
      load();
    } catch (e: unknown) {
      setMensaje(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este video?")) return;
    try {
      const res = await fetch(`/api/admin/asociacion/videos/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 401) {
        window.location.href = "/entrar";
        return;
      }
      if (!res.ok) throw new Error("Error al eliminar");
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error");
    }
  }

  function startEdit(v: Video) {
    setEditId(v.id);
    setTitulo(v.titulo);
    setUrl(v.url);
    setTipo((v.tipo as "YOUTUBE" | "R2") || "YOUTUBE");
    setShowForm(true);
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-6">
        <p className="text-destructive">{err}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Videos de la asociación</h1>
        <Link
          href="/gestion/asociacion"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver
        </Link>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Videos que se muestran en la home debajo del mapa. Puedes usar enlaces de YouTube o subir videos a R2.
      </p>

      {mensaje && (
        <div
          className={`mb-4 rounded-lg p-3 text-sm ${
            mensaje.startsWith("Error") ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-700"
          }`}
        >
          {mensaje}
        </div>
      )}

      {!showForm ? (
        <button
          onClick={() => {
            setEditId(null);
            setTitulo("");
            setUrl("");
            setTipo("YOUTUBE");
            setShowForm(true);
          }}
          className="mb-6 rounded-lg border border-primary bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
        >
          + Añadir video
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mb-5 rounded-lg border border-border bg-card p-4">
          <h3 className="mb-4 font-medium">{editId ? "Editar video" : "Nuevo video"}</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Título</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2"
                placeholder="Ej: Presentación de la asociación"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2"
                placeholder="https://www.youtube.com/watch?v=... o URL de R2"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as "YOUTUBE" | "R2")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2"
              >
                <option value="YOUTUBE">YouTube</option>
                <option value="R2">R2 (video subido)</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {guardando ? "Guardando..." : editId ? "Actualizar" : "Añadir"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditId(null);
                setTitulo("");
                setUrl("");
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {videos.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
            No hay videos. Añade el primero.
          </p>
        ) : (
          videos.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div>
                <h4 className="font-medium">{v.titulo}</h4>
                <p className="mt-1 truncate text-sm text-muted-foreground">{v.url}</p>
                <span className="mt-1 inline-block rounded bg-muted px-2 py-0.5 text-xs">
                  {v.tipo}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(v)}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(v.id)}
                  className="rounded-lg border border-destructive/50 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
