"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

type RrssData = {
  rrssInstagram: string | null;
  rrssFacebook: string | null;
  rrssTwitter: string | null;
  rrssYoutube: string | null;
  rrssTiktok: string | null;
  rrssWeb: string | null;
};

/** Misma lógica que en la ficha pública del pueblo */
function normalizeExternalHref(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  const lower = value.toLowerCase();
  if (
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:")
  ) {
    return value;
  }
  if (value.startsWith("//")) return `https:${value}`;
  if (/^www\./i.test(value) || /^[a-z0-9.-]+\.[a-z]{2,}(?:[/?#].*)?$/i.test(value)) {
    return `https://${value}`;
  }
  return null;
}

const field =
  "mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20";

const btnPrimary =
  "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#a0705a] to-[#b8856d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";

const sectionCard = "overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm";
const sectionHead = "border-b border-border/60 bg-muted/30 px-5 py-3 sm:px-6";
const sectionBody = "p-5 sm:p-6";

const FIELDS: { key: keyof RrssData; label: string; placeholder: string; icon: ReactNode }[] = [
  {
    key: "rrssInstagram",
    label: "Instagram",
    placeholder: "https://instagram.com/tu-pueblo",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    key: "rrssFacebook",
    label: "Facebook",
    placeholder: "https://facebook.com/tu-pueblo",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    key: "rrssTwitter",
    label: "X (Twitter)",
    placeholder: "https://x.com/tu-pueblo",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    key: "rrssYoutube",
    label: "YouTube",
    placeholder: "https://youtube.com/@tu-pueblo",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    key: "rrssTiktok",
    label: "TikTok",
    placeholder: "https://tiktok.com/@tu-pueblo",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
  {
    key: "rrssWeb",
    label: "Página web",
    placeholder: "https://www.tu-pueblo.es",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
];

export default function RrssPuebloClient({
  slug,
  puebloId,
  puebloNombre,
}: {
  slug: string;
  puebloId: number;
  puebloNombre: string;
}) {
  const [data, setData] = useState<RrssData>({
    rrssInstagram: null,
    rrssFacebook: null,
    rrssTwitter: null,
    rrssYoutube: null,
    rrssTiktok: null,
    rrssWeb: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const mensajeEsError =
    mensaje != null &&
    (mensaje.startsWith("Error") || mensaje.includes("permisos") || mensaje.includes("403"));

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(`/api/admin/pueblos/${puebloId}/rrss`, {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401) {
        window.location.href = "/entrar";
        return;
      }
      if (res.status === 403) {
        setErr("No tienes permisos para editar las redes de este pueblo.");
        return;
      }
      if (!res.ok) throw new Error("No se pudieron cargar las redes sociales.");
      const json = await res.json();
      setData({
        rrssInstagram: json.rrssInstagram ?? null,
        rrssFacebook: json.rrssFacebook ?? null,
        rrssTwitter: json.rrssTwitter ?? null,
        rrssYoutube: json.rrssYoutube ?? null,
        rrssTiktok: json.rrssTiktok ?? null,
        rrssWeb: json.rrssWeb ?? null,
      });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [puebloId]);

  async function handleSave() {
    setSaving(true);
    setMensaje(null);
    try {
      const res = await fetch(`/api/admin/pueblos/${puebloId}/rrss`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (res.status === 401) {
        window.location.href = "/entrar";
        return;
      }
      if (res.status === 403) {
        setMensaje("No tienes permisos");
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { message?: string; error?: string }).message || (d as { error?: string }).error || `Error ${res.status}`);
      }
      setMensaje("Cambios guardados correctamente.");
    } catch (e: unknown) {
      setMensaje(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  function updateField(key: keyof RrssData, value: string) {
    setData((prev) => ({ ...prev, [key]: value || null }));
  }

  const previewLinks = FIELDS.map((f) => {
    const href = normalizeExternalHref(data[f.key]);
    return { ...f, href };
  }).filter((x) => x.href);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 rounded-2xl bg-muted/60" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-12 w-12 shrink-0 rounded-xl bg-muted/50" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 w-24 rounded bg-muted/50" />
                <div className="h-10 w-full rounded-xl bg-muted/40" />
              </div>
            </div>
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
      <div className={sectionCard}>
        <div className={sectionHead}>
          <h2 className="text-sm font-semibold text-foreground">Vista previa</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Iconos que verán los visitantes en la cabecera de la ficha (solo enlaces válidos)
          </p>
        </div>
        <div className={`${sectionBody} flex flex-col items-center justify-center gap-3`}>
          {previewLinks.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Aún no hay ninguna URL pública. Rellena los campos de abajo y guarda.
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-4 py-2">
              {previewLinks.map((r) => (
                <a
                  key={r.key}
                  href={r.href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                  title={`${r.label} (abre en nueva pestaña)`}
                  aria-label={r.label}
                >
                  {r.icon}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={sectionCard}>
        <div className={sectionHead}>
          <h2 className="text-sm font-semibold text-foreground">Editar enlaces</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Puedes dejar vacío lo que no uses. Se aceptan URLs con https o dominios tipo{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[10px]">www.ejemplo.es</code>
          </p>
        </div>
        <div className={`${sectionBody} space-y-5`}>
          {FIELDS.map((f) => (
            <div
              key={f.key}
              className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-800 dark:bg-fuchsia-500/15 dark:text-fuchsia-200">
                {f.icon}
              </div>
              <div className="min-w-0 flex-1">
                <label className="block text-xs font-semibold text-foreground" htmlFor={`rrss-${f.key}`}>
                  {f.label}
                </label>
                <input
                  id={`rrss-${f.key}`}
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  value={data[f.key] ?? ""}
                  onChange={(e) => updateField(f.key, e.target.value)}
                  className={field}
                  placeholder={f.placeholder}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={handleSave} disabled={saving} className={btnPrimary}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
        {mensaje && (
          <p
            className={`text-sm font-medium ${mensajeEsError ? "text-destructive" : "text-emerald-700 dark:text-emerald-400"}`}
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
