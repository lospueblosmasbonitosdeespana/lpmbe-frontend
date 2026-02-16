type SemaforoBadgeProps = {
  estado: "VERDE" | "AMARILLO" | "ROJO" | null;
  mensaje?: string | null;
  updatedAt?: string | Date | null;
  variant?: "badge" | "panel";
};

function formatFecha(fecha: string | Date | null | undefined): string | null {
  if (!fecha) return null;
  try {
    const d = typeof fecha === "string" ? new Date(fecha) : fecha;
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

function getEstadoConfig(estado: string | null) {
  switch (estado) {
    case "VERDE":
      return { texto: "Ideal para visitar", color: "#28a745", bgColor: "#d4edda" };
    case "AMARILLO":
      return { texto: "Alta afluencia de visitantes", color: "#ffc107", bgColor: "#fff3cd" };
    case "ROJO":
      return { texto: "No es el momento indicado", color: "#dc3545", bgColor: "#f8d7da" };
    default:
      return null;
  }
}

export default function SemaforoBadge({
  estado,
  mensaje,
  updatedAt,
  variant = "badge",
}: SemaforoBadgeProps) {
  const config = estado ? getEstadoConfig(estado) : null;
  const fechaFormateada = formatFecha(updatedAt);

  if (variant === "badge") {
    if (!estado || !config) return null;
    return (
      <span
        style={{
          display: "inline-block",
          padding: "4px 8px",
          fontSize: "12px",
          fontWeight: "500",
          borderRadius: "4px",
          backgroundColor: config.bgColor,
          color: config.color,
          border: `1px solid ${config.color}`,
        }}
      >
        {config.texto}
      </span>
    );
  }

  // Panel variant - siempre se muestra
  if (!estado || !config) {
    // Fallback cuando no hay estado
    return (
      <div
        style={{
          padding: "12px",
          border: "2px solid #ccc",
          borderRadius: "8px",
          backgroundColor: "#f5f5f5",
        }}
      >
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 600 }}>
          Semáforo turístico
        </h3>
        <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
          Semáforo no disponible
        </p>
      </div>
    );
  }

  // Panel con estado
  return (
    <div
      style={{
        padding: "12px",
        border: `2px solid ${config.color}`,
        borderRadius: "8px",
        backgroundColor: config.bgColor,
      }}
    >
      <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 600 }}>
        Semáforo turístico
      </h3>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: mensaje ? "8px" : "0",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            backgroundColor: config.color,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: "15px",
            fontWeight: "600",
            color: config.color,
          }}
        >
          {config.texto}
        </span>
      </div>
      {mensaje && (
        <p style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#333" }}>
          {mensaje}
        </p>
      )}
      {fechaFormateada && (
        <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
          Actualizado: {fechaFormateada}
        </p>
      )}
    </div>
  );
}

