"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";

export default function ContactForm({ defaultEmail }: { defaultEmail?: string }) {
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
      // Por ahora: abrir mailto (el backend puede añadir endpoint de envío después)
      const mailto = `mailto:${emailTo}?subject=${encodeURIComponent(
        `Contacto web: ${data.nombre}`
      )}&body=${encodeURIComponent(
        `Nombre: ${data.nombre}\nEmail: ${data.email}\nWeb: ${data.website || "-"}\n\nMensaje:\n${data.mensaje}`
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
          Se abrirá tu cliente de correo. Si no se abre, escríbenos directamente a{" "}
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
            Nombre *
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <label htmlFor="website" className="mb-1 block text-sm font-medium">
            Web
          </label>
          <input
            id="website"
            name="website"
            type="url"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            placeholder="https://..."
          />
        </div>
      </div>
      <div>
        <label htmlFor="mensaje" className="mb-1 block text-sm font-medium">
          Mensaje *
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          required
          rows={5}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          placeholder="Escribe tu mensaje..."
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Enviando…" : "Enviar"}
      </Button>
    </form>
  );
}
