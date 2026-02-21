"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ClubNewsletterForm() {
  const t = useTranslations("home");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), origen: "club" }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <p className="text-foreground font-medium">
        {t("thanksNewsletter")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("yourEmail")}
          required
          disabled={status === "loading"}
          className="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-70"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70"
        >
          {status === "loading" ? t("sending") : t("subscribe")}
        </button>
      </form>
      {status === "error" && (
        <p className="text-center text-sm text-destructive">
          {t("newsletterError")}
        </p>
      )}
      <div className="text-center">
        <Link
          href="/newsletter"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("latestNewsletters")}
        </Link>
      </div>
    </div>
  );
}
