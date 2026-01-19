"use client";

import { useState } from "react";

type PuebloActionsProps = {
  nombre: string;
  lat: number | null;
  lng: number | null;
  mapAnchorId?: string;
  semaforoEstado?: "VERDE" | "AMARILLO" | "ROJO" | null;
  semaforoMensaje?: string | null;
  semaforoUpdatedAt?: string | Date | null;
};

function getSemaforoConfig(estado: string | null) {
  switch (estado) {
    case "VERDE":
      return { texto: "Tranquilo", color: "#28a745", bgColor: "#d4edda" };
    case "AMARILLO":
      return { texto: "Precaución", color: "#ffc107", bgColor: "#fff3cd" };
    case "ROJO":
      return { texto: "Alta afluencia", color: "#dc3545", bgColor: "#f8d7da" };
    default:
      return null;
  }
}

export default function PuebloActions({
  nombre,
  lat,
  lng,
  mapAnchorId = "mapa",
  semaforoEstado,
  semaforoMensaje,
  semaforoUpdatedAt,
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

  const semaforoConfig = semaforoEstado ? getSemaforoConfig(semaforoEstado) : null;

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

      {/* Semáforo turístico como botón del mismo nivel */}
      {semaforoConfig && (
        <div
          style={{
            padding: "10px 16px",
            fontSize: "14px",
            border: `2px solid ${semaforoConfig.color}`,
            borderRadius: "6px",
            backgroundColor: semaforoConfig.bgColor,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: semaforoConfig.color,
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 500, color: "#333" }}>
            Semáforo turístico · <span style={{ color: semaforoConfig.color }}>{semaforoConfig.texto}</span>
          </span>
        </div>
      )}
    </div>
  );
}

