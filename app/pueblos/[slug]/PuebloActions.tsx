"use client";

import { useState } from "react";

type PuebloActionsProps = {
  nombre: string;
  lat: number | null;
  lng: number | null;
  mapAnchorId?: string;
};

export default function PuebloActions({
  nombre,
  lat,
  lng,
  mapAnchorId = "mapa",
}: PuebloActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCompartir = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback si clipboard falla
      const url = window.location.href;
      prompt("Copia esta URL:", url);
    }
  };

  const handleVerEnMapa = () => {
    const elemento = document.getElementById(mapAnchorId);
    if (elemento) {
      elemento.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSuscribirse = () => {
    alert("Próximamente");
  };

  const tieneCoords = lat !== null && lng !== null;
  const googleMapsUrl = tieneCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : "#";

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        marginTop: "24px",
        marginBottom: "24px",
        flexWrap: "wrap",
      }}
    >
      <button
        onClick={handleCompartir}
        style={{
          padding: "10px 16px",
          fontSize: "14px",
          border: "1px solid #ddd",
          borderRadius: "6px",
          backgroundColor: "#fff",
          cursor: "pointer",
          color: copied ? "#28a745" : "#333",
        }}
      >
        {copied ? "✓ Copiado" : "Compartir"}
      </button>

      <button
        onClick={handleVerEnMapa}
        style={{
          padding: "10px 16px",
          fontSize: "14px",
          border: "1px solid #ddd",
          borderRadius: "6px",
          backgroundColor: "#fff",
          cursor: "pointer",
        }}
      >
        Ver en mapa
      </button>

      {tieneCoords ? (
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "10px 16px",
            fontSize: "14px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            backgroundColor: "#fff",
            textDecoration: "none",
            color: "#333",
            display: "inline-block",
          }}
        >
          Cómo llegar
        </a>
      ) : (
        <button
          disabled
          style={{
            padding: "10px 16px",
            fontSize: "14px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            backgroundColor: "#f5f5f5",
            cursor: "not-allowed",
            color: "#999",
          }}
        >
          Cómo llegar
        </button>
      )}

      <button
        onClick={handleSuscribirse}
        style={{
          padding: "10px 16px",
          fontSize: "14px",
          border: "1px solid #ddd",
          borderRadius: "6px",
          backgroundColor: "#fff",
          cursor: "pointer",
        }}
      >
        Suscribirse
      </button>
    </div>
  );
}

