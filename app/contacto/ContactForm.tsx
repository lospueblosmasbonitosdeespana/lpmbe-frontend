"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/app/components/ui/button";

export default function ContactForm({ defaultEmail }: { defaultEmail?: string }) {
  const t = useTranslations("contact");
  const emailTo = defaultEmail || "asociacion@lospueblosmasbonitosdeespana.org";
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      const mailto = `mailto:${emailTo}?subject=${encodeURIComponent(
        `${t("title")} web: ${data.nombre}`
      )}&body=${encodeURIComponent(
        `${t("name")}: ${data.nombre}\n${t("email")}: ${data.email}\n${t("web")}: ${data.website || "-"}\n\n${t("message")}:\n${data.mensaje}`
      )}`;
      window.location.href = mailto;
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-muted/50 p-8 text-center">
        <p className="text-muted-foreground">
          {t("successMessage")}{" "}
          <a
            href={`mailto:${emailTo}`}
            className="font-medium text-primary hover:underline"
          >
            {emailTo}
          </a>
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl space-y-4 rounded-xl border border-border bg-muted/30 p-6"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="nombre" className="mb-1 block text-sm font-medium">
            {t("name")} *
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            placeholder={t("namePlaceholder")}
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            {t("email")} *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            placeholder={t("emailPlaceholder")}
          />
        </div>
        <div>
          <label htmlFor="website" className="mb-1 block text-sm font-medium">
            {t("web")}
          </label>
          <input
            id="website"
            name="website"
            type="url"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            placeholder={t("webPlaceholder")}
          />
        </div>
      </div>
      <div>
        <label htmlFor="mensaje" className="mb-1 block text-sm font-medium">
          {t("message")} *
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          required
          rows={5}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          placeholder={t("messagePlaceholder")}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? t("sending") : t("send")}
      </Button>
    </form>
  );
}
