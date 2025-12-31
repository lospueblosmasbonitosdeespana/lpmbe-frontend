"use client";

import { useState } from "react";

type Props = {
  endpoint: string; // ej: `/api/noticias/${id}` o `/api/eventos/${id}`
  onDeleted?: () => void;
  confirmText?: string;
  className?: string;
};

export default function EliminarItemButton({
  endpoint,
  onDeleted,
  confirmText = "¿Eliminar este item?",
  className,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (loading) return;
    if (!confirm(confirmText)) return;

    setLoading(true);
    try {
      const res = await fetch(endpoint, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        alert(`Error al eliminar (${res.status}): ${txt || "Sin detalle"}`);
        return;
      }
      onDeleted?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className={className}
      style={{ textDecoration: "underline", background: "none", border: "none", padding: 0, cursor: "pointer" }}
    >
      {loading ? "Eliminando..." : "Eliminar"}
    </button>
  );
}

