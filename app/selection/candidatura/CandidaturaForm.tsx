"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const TIPOS = [
  { value: "HOTEL", labelKey: "Hotel / Hotel boutique" },
  { value: "CASA_RURAL", labelKey: "Casa rural / Agroturismo" },
  { value: "RESTAURANTE", labelKey: "Restaurante" },
  { value: "BAR", labelKey: "Bar / Gastrobar" },
  { value: "BODEGA", labelKey: "Bodega / Enoteca" },
  { value: "COMERCIO", labelKey: "Comercio / Tienda gourmet" },
  { value: "EXPERIENCIA", labelKey: "Experiencia / Actividad" },
  { value: "OTRO", labelKey: "Otro" },
];

type FormState = {
  nombreNegocio: string;
  tipo: string;
  localidad: string;
  provincia: string;
  web: string;
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono: string;
  descripcion: string;
};

const empty: FormState = {
  nombreNegocio: "",
  tipo: "HOTEL",
  localidad: "",
  provincia: "",
  web: "",
  contactoNombre: "",
  contactoEmail: "",
  contactoTelefono: "",
  descripcion: "",
};

export function CandidaturaForm() {
  const t = useTranslations("candidatura");
  const tSel = useTranslations("selection");
  const [form, setForm] = useState<FormState>(empty);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombreNegocio.trim() || !form.contactoEmail.trim() || !form.descripcion.trim()) {
      setResult({ ok: false, message: t("fillRequired") });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/public/selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResult({ ok: true, message: data.message || t("successTitle") });
        setForm(empty);
      } else {
        setResult({ ok: false, message: data.message || t("sendError") });
      }
    } catch {
      setResult({ ok: false, message: t("connectionError") });
    } finally {
      setSending(false);
    }
  };

  if (result?.ok) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <h3 className="mt-4 text-lg font-bold text-green-800">{t("successTitle")}</h3>
        <p className="mt-2 text-sm text-green-700">{result.message}</p>
        <Link
          href="/selection"
          className="mt-6 inline-block rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          {tSel("backToSelection")}
        </Link>
      </div>
    );
  }

  const inputCls = "w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {result && !result.ok && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {result.message}
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="text-lg font-bold text-foreground">{t("establishmentData")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("nameLabel")} *</label>
            <input value={form.nombreNegocio} onChange={set("nombreNegocio")} required
              className={inputCls} placeholder={t("namePlaceholder")} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("typeLabel")} *</label>
            <select value={form.tipo} onChange={set("tipo")} className={inputCls}>
              {TIPOS.map((tp) => <option key={tp.value} value={tp.value}>{tp.labelKey}</option>)}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("locationLabel")} *</label>
            <input value={form.localidad} onChange={set("localidad")} required
              className={inputCls} placeholder={t("locationPlaceholder")} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("provinceLabel")} *</label>
            <input value={form.provincia} onChange={set("provincia")} required
              className={inputCls} placeholder={t("provincePlaceholder")} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("websiteLabel")}</label>
          <input value={form.web} onChange={set("web")} className={inputCls} placeholder="https://..." />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-bold text-foreground">{t("contactData")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("contactNameLabel")} *</label>
            <input value={form.contactoNombre} onChange={set("contactoNombre")} required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("contactEmailLabel")} *</label>
            <input type="email" value={form.contactoEmail} onChange={set("contactoEmail")} required className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("contactPhoneLabel")}</label>
          <input value={form.contactoTelefono} onChange={set("contactoTelefono")}
            className="w-full max-w-xs rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
      </fieldset>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          {t("motivationLabel")} *
        </label>
        <textarea value={form.descripcion} onChange={set("descripcion")} required rows={5}
          className={inputCls} placeholder={t("motivationPlaceholder")} />
      </div>

      <button type="submit" disabled={sending}
        className="w-full rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors">
        {sending ? t("sending") : t("submitButton")}
      </button>
    </form>
  );
}
