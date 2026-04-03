"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Highlight = { orden: number; valor: string; etiqueta: string };

const VALOR_MAX = 30;
const ETIQUETA_MAX = 40;

const field =
  "mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20";

const btnPrimary =
  "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#a0705a] to-[#b8856d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";

const sectionCard = "overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm";
const sectionHead = "border-b border-border/60 bg-muted/30 px-5 py-3 sm:px-6";
const sectionBody = "p-5 sm:p-6";

export default function EnCifrasClient({
  puebloId,
  slug,
  puebloNombre,
}: {
  puebloId: number;
  slug: string;
  puebloNombre: string;
}) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([
    { orden: 1, valor: "", etiqueta: "" },
    { orden: 2, valor: "", etiqueta: "" },
    { orden: 3, valor: "", etiqueta: "" },
    { orden: 4, valor: "", etiqueta: "" },
  ]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const mensajeEsError =
    mensaje != null && (mensaje.includes("Error") || mensaje.includes("permisos"));

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch(`/api/admin/pueblos/${puebloId}/highlights`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (res.status === 401) {
          window.location.href = "/entrar";
          return;
        }
        if (res.status === 403) {
          setErr("No tienes permisos para editar este pueblo.");
          return;
        }
        if (!res.ok) throw new Error("No se pudieron cargar los datos.");

        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const filled: Highlight[] = [];
        for (let i = 0; i < 4; i++) {
          const h = list.find((x: Highlight) => x.orden === i + 1);
          filled.push({
            orden: i + 1,
            valor: h?.valor === "—" ? "" : (h?.valor ?? ""),
            etiqueta: h?.etiqueta === "—" ? "" : (h?.etiqueta ?? ""),
          });
        }
        setHighlights(filled);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Error al cargar");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [puebloId]);

  async function handleGuardar() {
    setGuardando(true);
    setMensaje(null);
    try {
      const r = await fetch(`/api/admin/pueblos/${puebloId}/highlights`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          highlights: highlights.map((h) => ({
            valor: h.valor.trim() || "—",
            etiqueta: h.etiqueta.trim() || "—",
          })),
        }),
        credentials: "include",
      });
      if (r.status === 401) {
        window.location.href = "/entrar";
        return;
      }
      if (r.status === 403) {
        setMensaje("No tienes permisos");
        return;
      }
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? `Error ${r.status}`);
      }
      setMensaje("Cambios guardados correctamente.");
    } catch (e: unknown) {
      setMensaje(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  function updateField(index: number, fieldName: "valor" | "etiqueta", value: string) {
    const max = fieldName === "valor" ? VALOR_MAX : ETIQUETA_MAX;
    const nextVal = value.slice(0, max);
    setHighlights((prev) => {
      const next = [...prev];
      const cur = next[index];
      if (cur) next[index] = { ...cur, [fieldName]: nextVal };
      return next;
    });
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 rounded-2xl bg-muted/60" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-muted/50" />
          ))}
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
      {/* Vista previa — mismo ritmo visual que la ficha pública */}
      <div className={sectionCard}>
        <div className={sectionHead}>
          <h2 className="text-sm font-semibold text-foreground">Vista previa</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Así se muestra el bloque en la página de {puebloNombre}
          </p>
        </div>
        <div className={sectionBody}>
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              En cifras
            </p>
            <p className="mt-2 font-serif text-xl font-medium text-foreground sm:text-2xl">
              Patrimonio y tradición
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((h, i) => {
              const valor = h.valor.trim() || "—";
              const etiqueta = h.etiqueta.trim() || "Etiqueta";
              return (
                <div key={h.orden} className="text-center">
                  <div className="font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">
                    {valor}
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                    {etiqueta}
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground/70">Punto {i + 1}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className={sectionCard}>
        <div className={sectionHead}>
          <h2 className="text-sm font-semibold text-foreground">Editar los cuatro datos</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Máximo {VALOR_MAX} caracteres en el valor y {ETIQUETA_MAX} en la etiqueta.
          </p>
        </div>
        <div className={`${sectionBody} grid gap-5 sm:grid-cols-2`}>
          {highlights.map((h, i) => (
            <div
              key={h.orden}
              className="rounded-xl border border-border/70 bg-muted/10 p-4 transition-colors hover:border-violet-500/20"
            >
              <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">Dato {i + 1}</p>
              <label className="mt-3 block text-xs font-medium text-muted-foreground">
                Valor (cifra o texto corto)
                <input
                  type="text"
                  value={h.valor}
                  onChange={(e) => updateField(i, "valor", e.target.value)}
                  placeholder="Ej: 1.182 m, S. X, 2.014"
                  maxLength={VALOR_MAX}
                  className={field}
                  autoComplete="off"
                />
                <span className="mt-1 block text-right text-[10px] text-muted-foreground">
                  {h.valor.length}/{VALOR_MAX}
                </span>
              </label>
              <label className="mt-2 block text-xs font-medium text-muted-foreground">
                Etiqueta (mayúsculas recomendadas en web)
                <input
                  type="text"
                  value={h.etiqueta}
                  onChange={(e) => updateField(i, "etiqueta", e.target.value)}
                  placeholder="Ej: ALTITUD, FUNDACIÓN"
                  maxLength={ETIQUETA_MAX}
                  className={field}
                  autoComplete="off"
                />
                <span className="mt-1 block text-right text-[10px] text-muted-foreground">
                  {h.etiqueta.length}/{ETIQUETA_MAX}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={handleGuardar} disabled={guardando} className={btnPrimary}>
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
        {mensaje && (
          <p
            className={`text-sm font-medium ${
              mensajeEsError ? "text-destructive" : "text-emerald-700 dark:text-emerald-400"
            }`}
            role="status"
          >
            {mensaje}
          </p>
        )}
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
