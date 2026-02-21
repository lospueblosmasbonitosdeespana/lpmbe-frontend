"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface RutaGuardada {
  id: number;
  nombre: string;
  originLabel: string | null;
  destLabel: string | null;
  maxDistKm: number;
  paradas: Array<{ type: string; id: number }>;
  createdAt: string;
}

export default function MisRutasPage() {
  const [rutas, setRutas] = useState<RutaGuardada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadRutas();
  }, []);

  async function loadRutas() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rutas-guardadas", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) {
          const redirect = encodeURIComponent("/planifica/mis-rutas");
          window.location.href = `/entrar?redirect=${redirect}`;
          return;
        }
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? "Error al cargar las rutas");
        setRutas([]);
        return;
      }
      const data = await res.json();
      setRutas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
      setRutas([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateNombre(id: number, nombre: string) {
    setError(null);
    try {
      const res = await fetch(`/api/rutas-guardadas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nombre }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? "Error al actualizar");
      }
      setRutas((prev) =>
        prev.map((r) => (r.id === id ? { ...r, nombre } : r))
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    }
  }

  async function deleteRuta(id: number) {
    setError(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/rutas-guardadas/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? "Error al eliminar");
      }
      setRutas((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  }

  const paradasCount = (paradas: unknown) =>
    Array.isArray(paradas) ? paradas.length : 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-background pb-20">
        <section className="border-b border-border bg-white/60 px-4 py-12 text-center md:py-16">
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Mis rutas guardadas
          </h1>
        </section>
        <section className="mx-auto max-w-2xl px-4 py-12 text-center">
          <div className="inline-flex h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">
            Cargando tus rutas…
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <section className="border-b border-border bg-white/60 px-4 py-12 text-center md:py-16">
        <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
          Mis rutas guardadas
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
          Aquí puedes ver, editar y recuperar las rutas que has guardado. Haz
          clic en &quot;Abrir&quot; para cargar la ruta y hacerla más tarde.
        </p>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Link
          href="/planifica/crea-mi-ruta"
          className="mb-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          Crear nueva ruta
        </Link>

        {rutas.length === 0 ? (
          <div className="rounded-xl border border-border bg-white p-8 text-center">
            <p className="text-muted-foreground">
              Aún no tienes rutas guardadas. Crea una ruta y pulsa
              &quot;Guardar para más tarde&quot; para verla aquí.
            </p>
            <Link
              href="/planifica/crea-mi-ruta"
              className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
            >
              Ir a crear ruta
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {rutas.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  {editingId === r.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (editNombre.trim()) updateNombre(r.id, editNombre.trim());
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        className="flex-1 rounded border border-border px-2 py-1 text-sm"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="rounded bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditNombre("");
                        }}
                        className="rounded border px-2 py-1 text-xs"
                      >
                        Cancelar
                      </button>
                    </form>
                  ) : (
                    <h3 className="font-semibold text-foreground">{r.nombre}</h3>
                  )}
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {r.originLabel ?? "Origen"} → {r.destLabel ?? "Destino"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {paradasCount(r.paradas)} parada
                    {paradasCount(r.paradas) !== 1 && "s"} · {r.maxDistKm} km
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/planifica/crea-mi-ruta?rutaId=${r.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    Abrir
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(r.id);
                      setEditNombre(r.nombre);
                    }}
                    disabled={editingId !== null && editingId !== r.id}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-50"
                  >
                    Editar nombre
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`¿Eliminar la ruta "${r.nombre}"?`)) {
                        deleteRuta(r.id);
                      }
                    }}
                    disabled={deletingId === r.id}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === r.id ? "Eliminando…" : "Borrar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
