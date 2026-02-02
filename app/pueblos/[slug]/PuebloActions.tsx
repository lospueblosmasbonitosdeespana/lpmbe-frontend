"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

type PuebloActionsProps = {
  nombre: string;
  puebloSlug: string;
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

const btnStyle = {
  padding: "10px 16px",
  fontSize: "14px",
  border: "1px solid #ddd",
  borderRadius: "6px",
  backgroundColor: "#fff",
  cursor: "pointer" as const,
  color: "#333",
  textDecoration: "none" as const,
  display: "inline-block",
};

export default function PuebloActions({
  nombre,
  puebloSlug,
  lat,
  lng,
  mapAnchorId = "mapa",
  semaforoEstado,
  semaforoMensaje,
  semaforoUpdatedAt,
}: PuebloActionsProps) {
  const [copied, setCopied] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showSuscribirseModal, setShowSuscribirseModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (mounted) setIsLoggedIn(res.ok);
      } catch {
        if (mounted) setIsLoggedIn(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCompartir = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = `${nombre} | Los Pueblos Más Bonitos de España`;
    const text = `Descubre ${nombre}`;

    // Web Share API (móvil y algunos navegadores de escritorio)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }

    // Fallback: copiar al portapapeles
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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
    setShowSuscribirseModal(true);
  };

  const tieneCoords = lat !== null && lng !== null;
  const googleMapsUrl = tieneCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : "#";

  const semaforoConfig = semaforoEstado ? getSemaforoConfig(semaforoEstado) : null;

  return (
    <>
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
            ...btnStyle,
            color: copied ? "#28a745" : "#333",
          }}
        >
          {copied ? "✓ Copiado" : "Compartir"}
        </button>

        <Link
          href={`/pueblos/${puebloSlug}/actualidad`}
          style={btnStyle}
        >
          Actualidad
        </Link>

        <button
          onClick={handleVerEnMapa}
          style={btnStyle}
        >
          Ver en mapa
        </button>

        {tieneCoords ? (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={btnStyle}
          >
            Cómo llegar
          </a>
        ) : (
          <button
            disabled
            style={{
              ...btnStyle,
              backgroundColor: "#f5f5f5",
              cursor: "not-allowed",
              color: "#999",
            }}
          >
            Cómo llegar
          </button>
        )}

        {isLoggedIn !== true && (
          <button onClick={handleSuscribirse} style={btnStyle}>
            Suscribirse
          </button>
        )}

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

      {/* Modal Suscribirse: crear cuenta */}
      {showSuscribirseModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowSuscribirseModal(false)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              margin: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ margin: "0 0 20px 0", fontSize: "16px", lineHeight: 1.5, color: "#333" }}>
              Si quieres recibir noticias, alertas o eventos de {nombre}, has de crear una cuenta.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowSuscribirseModal(false)}
                style={{ ...btnStyle, backgroundColor: "#f5f5f5" }}
              >
                Cerrar
              </button>
              <Link
                href="/entrar"
                style={{
                  ...btnStyle,
                  backgroundColor: "#333",
                  color: "#fff",
                  borderColor: "#333",
                }}
              >
                Crear cuenta / Entrar
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
