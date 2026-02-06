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
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

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
      if (!res.ok) throw new Error("Error cargando webcams");
      const data = await res.json();
      setWebcams(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [puebloId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !urlEmbed.trim()) return;
    setGuardando(true);
    setMensaje(null);
    try {
      const body = {
        nombre: nombre.trim(),
        url_embed: urlEmbed.trim(),
        proveedor: proveedor.trim() || undefined,
        activo: true,
      };
      if (editId) {
        const res = await fetch(
          `/api/admin/pueblos/${puebloId}/webcams/${editId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            credentials: "include",
          }
        );
        if (res.status === 401) {
          window.location.href = "/entrar";
          return;
        }
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d?.error ?? `Error ${res.status}`);
        }
        setMensaje("Webcam actualizada");
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
          throw new Error(d?.error ?? `Error ${res.status}`);
        }
        setMensaje("Webcam añadida");
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
      const res = await fetch(
        `/api/admin/pueblos/${puebloId}/webcams/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
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
        <h1 className="text-2xl font-semibold">Webcam de {puebloNombre}</h1>
        <Link
          href={`/gestion/pueblos/${slug}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver
        </Link>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Añade enlaces a webcams en directo del pueblo (URL de embed).
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
            setNombre("");
            setUrlEmbed("");
            setProveedor("");
            setShowForm(true);
          }}
          className="mb-6 rounded-lg border border-primary bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
        >
          + Añadir webcam
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mb-5 rounded-lg border border-border bg-card p-4">
          <h3 className="mb-4 font-medium">{editId ? "Editar webcam" : "Nueva webcam"}</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2"
                placeholder="Ej: Plaza Mayor"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">URL de embed</label>
              <input
                type="url"
                value={urlEmbed}
                onChange={(e) => setUrlEmbed(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2"
                placeholder="https://..."
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Proveedor (opcional)</label>
              <input
                type="text"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2"
                placeholder="Ej: SkylineWebcams"
              />
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
                setNombre("");
                setUrlEmbed("");
                setProveedor("");
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {webcams.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
            No hay webcams. Añade la primera con la URL de embed.
          </p>
        ) : (
          webcams.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div>
                <h4 className="font-medium">{w.nombre}</h4>
                <p className="mt-1 truncate text-sm text-muted-foreground">{w.url_embed}</p>
                {w.proveedor && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{w.proveedor}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(w)}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(w.id)}
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
