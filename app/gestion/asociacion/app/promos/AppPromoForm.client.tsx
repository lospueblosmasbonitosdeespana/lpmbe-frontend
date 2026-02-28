"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AppPromoItem } from "./AppPromosList.client";

type FormData = {
  title: string;
  body: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  trigger: string;
  frequency: string;
  showAfterSeconds: string;
  orden: string;
};

const defaultForm: FormData = {
  title: "",
  body: "",
  imageUrl: "",
  ctaText: "Ver oferta",
  ctaLink: "",
  startDate: "",
  endDate: "",
  isActive: true,
  trigger: "home",
  frequency: "once_per_session",
  showAfterSeconds: "",
  orden: "0",
};

function promoToForm(p: AppPromoItem): FormData {
  return {
    title: p.title ?? "",
    body: p.body ?? "",
    imageUrl: p.imageUrl ?? "",
    ctaText: p.ctaText ?? "Ver oferta",
    ctaLink: p.ctaLink ?? "",
    startDate: p.startDate?.slice(0, 10) ?? "",
    endDate: p.endDate?.slice(0, 10) ?? "",
    isActive: p.isActive ?? true,
    trigger: p.trigger ?? "home",
    frequency: p.frequency ?? "once_per_session",
    showAfterSeconds: p.showAfterSeconds != null ? String(p.showAfterSeconds) : "",
    orden: p.orden != null ? String(p.orden) : "0",
  };
}

type Props = {
  id?: number;
  initialData?: AppPromoItem | null;
};

export default function AppPromoForm({ id, initialData }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initialData ? promoToForm(initialData) : defaultForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      title: form.title.trim(),
      body: form.body.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      ctaText: form.ctaText.trim() || "Ver oferta",
      ctaLink: form.ctaLink.trim() || null,
      startDate: form.startDate || new Date().toISOString().slice(0, 10),
      endDate: form.endDate || new Date().toISOString().slice(0, 10),
      isActive: form.isActive,
      trigger: form.trigger,
      frequency: form.frequency,
      showAfterSeconds: form.showAfterSeconds.trim() ? parseInt(form.showAfterSeconds, 10) : null,
      orden: parseInt(form.orden, 10) || 0,
    };

    try {
      const url = id ? `/api/admin/app-promos/${id}` : "/api/admin/app-promos";
      const res = await fetch(url, {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text();
        setMessage({ type: "error", text: t || `Error ${res.status}` });
        return;
      }

      setMessage({ type: "success", text: id ? "Guardado." : "Creado." });
      if (!id) {
        router.push("/gestion/asociacion/app/promos");
        return;
      }
      setTimeout(() => setMessage(null), 2000);
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {message && (
          <p className={message.type === "error" ? "text-red-600" : "text-green-600"}>
            {message.text}
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground">Título *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">Texto / descripción</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            rows={3}
            className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">Imagen (URL)</label>
          <input
            type="url"
            value={form.imageUrl}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            placeholder="https://… (opcional; puedes subir una imagen y pegar la URL, p. ej. desde Canva)"
            className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground">Texto del botón</label>
            <input
              type="text"
              value={form.ctaText}
              onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))}
              className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Enlace del botón (URL o ruta)</label>
            <input
              type="text"
              value={form.ctaLink}
              onChange={(e) => setForm((f) => ({ ...f, ctaLink: e.target.value }))}
              placeholder="/tienda o https://…"
              className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground">Fecha inicio *</label>
            <input
              type="date"
              required
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Fecha fin *</label>
            <input
              type="date"
              required
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="rounded border-input"
            />
            <span className="text-sm font-medium text-foreground">Activa (visible en la app si está en fechas)</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">Dónde mostrar</label>
          <select
            value={form.trigger}
            onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))}
            className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="home">Solo en Home (pestaña Inicio)</option>
            <option value="app_open">Solo al abrir la app</option>
            <option value="both">En Home y al abrir la app</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">Frecuencia (cada cuánto se repite)</label>
          <select
            value={form.frequency}
            onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
            className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="once_ever">Una vez por usuario (nunca repetir)</option>
            <option value="once_per_day">Una vez al día</option>
            <option value="once_per_session">Una vez por sesión</option>
            <option value="every_time">Cada vez</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground">Mostrar tras (segundos)</label>
            <input
              type="number"
              min={0}
              max={300}
              value={form.showAfterSeconds}
              onChange={(e) => setForm((f) => ({ ...f, showAfterSeconds: e.target.value }))}
              placeholder="Vacío = inmediato"
              className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Prioridad (orden)</label>
            <input
              type="number"
              value={form.orden}
              onChange={(e) => setForm((f) => ({ ...f, orden: e.target.value }))}
              className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">Si hay varias activas, se muestra la de mayor número.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Guardando…" : id ? "Guardar" : "Crear"}
          </button>
          <Link
            href="/gestion/asociacion/app/promos"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
