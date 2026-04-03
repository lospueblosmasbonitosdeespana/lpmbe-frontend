"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Video = {
  id: number;
  titulo: string;
  url: string;
  thumbnail?: string | null;
};

const field =
  "mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20";

const btnPrimary =
  "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#a0705a] to-[#b8856d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";

const btnSecondary =
  "inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted";

const btnOutline =
  "inline-flex items-center justify-center rounded-xl border border-blue-600/30 bg-blue-600/5 px-3 py-1.5 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-600/10 dark:text-blue-300";

const btnDanger =
  "inline-flex items-center justify-center rounded-xl border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10";

const sectionCard = "overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm";
const sectionHead = "border-b border-border/60 bg-muted/30 px-5 py-3 sm:px-6";
const sectionBody = "p-5 sm:p-6";

export default function VideosPuebloClient({
  slug,
  puebloId,
  puebloNombre,
}: {
  slug: string;
  puebloId: number;
  puebloNombre: string;
}) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  const mensajeEsError =
    mensaje != null &&
    (mensaje.startsWith("Error") || mensaje.includes("permisos") || mensaje.includes("403"));

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(`/api/admin/pueblos/${puebloId}/videos`, {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401) {
        window.location.href = "/entrar";
        return;
      }
      if (res.status === 403) {
        setErr("No tienes permisos para gestionar los videos de este pueblo.");
        return;
      }
      if (!res.ok) throw new Error("No se pudieron cargar los videos.");
      const data = await res.json();
      setVideos(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [puebloId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !url.trim()) return;
    setGuardando(true);
    setMensaje(null);
    try {
      if (editId) {
        const res = await fetch(`/api/admin/pueblos/${puebloId}/videos/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titulo: titulo.trim(), url: url.trim() }),
          credentials: "include",
        });
        if (res.status === 401) {
          window.location.href = "/entrar";
          return;
        }
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error((d as { error?: string }).error ?? `Error ${res.status}`);
        }
        setMensaje("Video actualizado correctamente.");
      } else {
        const res = await fetch(`/api/admin/pueblos/${puebloId}/videos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titulo: titulo.trim(), url: url.trim() }),
          credentials: "include",
        });
        if (res.status === 401) {
          window.location.href = "/entrar";
          return;
        }
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error((d as { error?: string }).error ?? `Error ${res.status}`);
        }
        setMensaje("Video añadido correctamente.");
      }
      setTitulo("");
      setUrl("");
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
      const res = await fetch(`/api/admin/pueblos/${puebloId}/videos/${id}`, {
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
    setShowForm(true);
  }

  function openAdd() {
    setEditId(null);
    setTitulo("");
    setUrl("");
    setShowForm(true);
    setMensaje(null);
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 w-40 rounded-xl bg-muted/60" />
        <div className="h-48 rounded-2xl bg-muted/50" />
        <div className="space-y-3">
          <div className="h-24 rounded-xl bg-muted/40" />
          <div className="h-24 rounded-xl bg-muted/40" />
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div
        className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        role="alert"
      >
        {err}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {!showForm ? (
        <button type="button" onClick={openAdd} className={btnPrimary}>
          + Añadir video
        </button>
      ) : (
        <div className={sectionCard}>
          <div className={sectionHead}>
            <h2 className="text-sm font-semibold text-foreground">
              {editId ? "Editar video" : "Nuevo video"}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Pega la URL completa del vídeo (YouTube, Vimeo, etc.)
            </p>
          </div>
          <form onSubmit={handleSubmit} className={sectionBody}>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground" htmlFor="video-titulo">
                  Título
                </label>
                <input
                  id="video-titulo"
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className={field}
                  placeholder="Ej: Paseo por el casco antiguo"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground" htmlFor="video-url">
                  URL
                </label>
                <input
                  id="video-url"
                  type="url"
                  inputMode="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className={field}
                  placeholder="https://www.youtube.com/watch?v=…"
                  required
                />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="submit" disabled={guardando} className={btnPrimary}>
                {guardando ? "Guardando…" : editId ? "Guardar cambios" : "Añadir"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                  setTitulo("");
                  setUrl("");
                }}
                className={btnSecondary}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {mensaje && (
        <p
          className={`text-sm font-medium ${mensajeEsError ? "text-destructive" : "text-emerald-700 dark:text-emerald-400"}`}
          role="status"
        >
          {mensaje}
        </p>
      )}

      <div className={sectionCard}>
        <div className={sectionHead}>
          <h2 className="text-sm font-semibold text-foreground">Videos publicados</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {videos.length === 0
              ? "Aún no hay enlaces. Añade el primero arriba."
              : `${videos.length} vídeo${videos.length !== 1 ? "s" : ""} en la ficha`}
          </p>
        </div>
        <div className={`${sectionBody} space-y-3`}>
          {videos.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/20 py-10 text-center text-sm text-muted-foreground">
              No hay videos. Los visitantes verán esta sección cuando añadas al menos un enlace.
            </p>
          ) : (
            videos.map((v) => (
              <div
                key={v.id}
                className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/5 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground">{v.titulo}</h3>
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{v.url}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={btnOutline}
                  >
                    Abrir →
                  </a>
                  <button type="button" onClick={() => startEdit(v)} className={btnOutline}>
                    Editar
                  </button>
                  <button type="button" onClick={() => handleDelete(v.id)} className={btnDanger}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        <Link
          href={`/pueblos/${slug}`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Ver ficha pública de {puebloNombre}
        </Link>
      </p>
    </div>
  );
}
