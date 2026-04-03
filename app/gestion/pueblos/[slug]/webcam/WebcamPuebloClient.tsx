"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Webcam = {
  id: number;
  nombre: string;
  url_embed: string;
  proveedor?: string | null;
  activo: boolean;
};

const field =
  "mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20";

const fieldMono =
  "mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 font-mono text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20";

const btnPrimary =
  "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#a0705a] to-[#b8856d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";

const btnSecondary =
  "inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted";

const btnOutline =
  "inline-flex items-center justify-center rounded-xl border border-sky-600/30 bg-sky-600/5 px-3 py-1.5 text-xs font-semibold text-sky-900 transition-colors hover:bg-sky-600/10 dark:text-sky-300";

const btnDanger =
  "inline-flex items-center justify-center rounded-xl border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10";

const sectionCard = "overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm";
const sectionHead = "border-b border-border/60 bg-muted/30 px-5 py-3 sm:px-6";
const sectionBody = "p-5 sm:p-6";

export default function WebcamPuebloClient({
  slug,
  puebloId,
  puebloNombre,
}: {
  slug: string;
  puebloId: number;
  puebloNombre: string;
}) {
  const [webcams, setWebcams] = useState<Webcam[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [urlEmbed, setUrlEmbed] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [embedMode, setEmbedMode] = useState<"url" | "iframe">("url");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  const mensajeEsError =
    mensaje != null &&
    (mensaje.startsWith("Error") ||
      mensaje.includes("permisos") ||
      mensaje.includes("403") ||
      mensaje.includes("no válida"));

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(`/api/admin/pueblos/${puebloId}/webcams`, {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401) {
        window.location.href = "/entrar";
        return;
      }
      if (res.status === 403) {
        setErr("No tienes permisos para gestionar las webcams de este pueblo.");
        return;
      }
      if (!res.ok) throw new Error("No se pudieron cargar las webcams.");
      const data = await res.json();
      setWebcams(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [puebloId]);

  function extractEmbedUrl(input: string): string | null {
    const trimmed = input.trim();
    const iframeMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (iframeMatch) return iframeMatch[1];
    const anchorMatch = trimmed.match(/<a[^>]+href=["']([^"']+)["']/i);
    if (anchorMatch) return anchorMatch[1];
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !urlEmbed.trim()) return;
    const embedUrl = embedMode === "iframe" ? extractEmbedUrl(urlEmbed) : urlEmbed.trim();
    if (!embedUrl) {
      setMensaje(
        "URL no válida. Pega una URL https, el código iframe (src=\"…\") o un enlace (href=\"…\").",
      );
      return;
    }
    setGuardando(true);
    setMensaje(null);
    try {
      const body = {
        nombre: nombre.trim(),
        url_embed: embedUrl,
        proveedor: proveedor.trim() || undefined,
        activo: true,
      };
      if (editId) {
        const res = await fetch(`/api/admin/pueblos/${puebloId}/webcams/${editId}`, {
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
          throw new Error((d as { error?: string }).error ?? `Error ${res.status}`);
        }
        setMensaje("Webcam actualizada correctamente.");
      } else {
        const res = await fetch(`/api/admin/pueblos/${puebloId}/webcams`, {
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
          throw new Error((d as { error?: string }).error ?? `Error ${res.status}`);
        }
        setMensaje("Webcam añadida correctamente.");
      }
      setNombre("");
      setUrlEmbed("");
      setProveedor("");
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
    if (!confirm("¿Eliminar esta webcam?")) return;
    try {
      const res = await fetch(`/api/admin/pueblos/${puebloId}/webcams/${id}`, {
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

  function startEdit(w: Webcam) {
    setEditId(w.id);
    setNombre(w.nombre);
    setUrlEmbed(w.url_embed);
    setProveedor(w.proveedor ?? "");
    setEmbedMode("url");
    setShowForm(true);
  }

  function openAdd() {
    setEditId(null);
    setNombre("");
    setUrlEmbed("");
    setProveedor("");
    setEmbedMode("url");
    setShowForm(true);
    setMensaje(null);
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 w-44 rounded-xl bg-muted/60" />
        <div className="h-64 rounded-2xl bg-muted/50" />
        <div className="h-28 rounded-xl bg-muted/40" />
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
          + Añadir webcam
        </button>
      ) : (
        <div className={sectionCard}>
          <div className={sectionHead}>
            <h2 className="text-sm font-semibold text-foreground">
              {editId ? "Editar webcam" : "Nueva webcam"}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              URL directa al player o pega el iframe completo; extraemos la URL automáticamente.
            </p>
          </div>
          <form onSubmit={handleSubmit} className={sectionBody}>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground" htmlFor="wc-nombre">
                  Nombre visible
                </label>
                <input
                  id="wc-nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={field}
                  placeholder="Ej: Plaza Mayor"
                  required
                />
              </div>
              <fieldset className="space-y-2">
                <legend className="text-xs font-semibold text-foreground">Tipo de origen</legend>
                <div className="flex flex-wrap gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="radio"
                      name="embedMode"
                      checked={embedMode === "url"}
                      onChange={() => setEmbedMode("url")}
                      className="accent-sky-600"
                    />
                    URL de embed
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="radio"
                      name="embedMode"
                      checked={embedMode === "iframe"}
                      onChange={() => setEmbedMode("iframe")}
                      className="accent-sky-600"
                    />
                    Código iframe / HTML
                  </label>
                </div>
              </fieldset>
              <div>
                <label className="text-xs font-semibold text-foreground" htmlFor="wc-embed">
                  {embedMode === "url" ? "URL de embed (https…)" : "Pega iframe o enlace"}
                </label>
                {embedMode === "url" ? (
                  <input
                    id="wc-embed"
                    type="text"
                    value={urlEmbed}
                    onChange={(e) => setUrlEmbed(e.target.value)}
                    className={fieldMono}
                    placeholder="https://…"
                    required
                  />
                ) : (
                  <textarea
                    id="wc-embed"
                    value={urlEmbed}
                    onChange={(e) => setUrlEmbed(e.target.value)}
                    className={`${fieldMono} min-h-[100px] resize-y`}
                    placeholder='<iframe src="https://…" …></iframe>'
                    rows={4}
                    required
                  />
                )}
                {embedMode === "iframe" && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Usamos el <code className="rounded bg-muted px-1">src</code> del iframe o el{" "}
                    <code className="rounded bg-muted px-1">href</code> del enlace.
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground" htmlFor="wc-prov">
                  Proveedor (opcional)
                </label>
                <input
                  id="wc-prov"
                  type="text"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  className={field}
                  placeholder="Ej: SkylineWebcams"
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
                  setNombre("");
                  setUrlEmbed("");
                  setProveedor("");
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
          <h2 className="text-sm font-semibold text-foreground">Webcams configuradas</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {webcams.length === 0
              ? "Aún no hay cámaras. Añade la primera arriba."
              : `${webcams.length} webcam${webcams.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className={`${sectionBody} space-y-3`}>
          {webcams.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/20 py-10 text-center text-sm text-muted-foreground">
              Sin webcams. Cuando añadas una, los visitantes verán el reproductor en la ficha del pueblo.
            </p>
          ) : (
            webcams.map((w) => (
              <div
                key={w.id}
                className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/5 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground">{w.nombre}</h3>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{w.url_embed}</p>
                  {w.proveedor && (
                    <p className="mt-1 text-xs text-muted-foreground">Proveedor: {w.proveedor}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={w.url_embed}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={btnOutline}
                  >
                    Probar URL →
                  </a>
                  <button type="button" onClick={() => startEdit(w)} className={btnOutline}>
                    Editar
                  </button>
                  <button type="button" onClick={() => handleDelete(w.id)} className={btnDanger}>
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
