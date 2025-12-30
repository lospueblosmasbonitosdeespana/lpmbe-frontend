"use client";

import { useState } from "react";

type Props = {
  id: number;
  onDeleted?: (id: number) => void;
  confirmText?: string;
  className?: string;
};

export default function EliminarNotificacionButton({
  id,
  onDeleted,
  confirmText = "¿Eliminar esta alerta? Esto no se puede deshacer.",
  className = "underline",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    if (!confirm(confirmText)) return;

    try {
      setLoading(true);

      const res = await fetch(`/api/notificaciones/${id}`, {
        method: "DELETE",
        cache: "no-store",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let msg = txt;
        try {
          const j = JSON.parse(txt);
          msg = j?.message ? String(j.message) : txt;
        } catch {}
        throw new Error(msg || `Error eliminando (HTTP ${res.status})`);
      }

      await res.text().catch(() => "");
      onDeleted?.(id);
    } catch (e: any) {
      setError(e?.message ?? "Error eliminando");
      console.error("[EliminarNotificacionButton] FAIL", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={onClick} disabled={loading} className={className}>
        {loading ? "Eliminando..." : "Eliminar"}
      </button>
      {error ? <small className="text-red-600">{error}</small> : null}
    </span>
  );
}
