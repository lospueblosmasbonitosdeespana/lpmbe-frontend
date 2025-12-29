import { getWeatherLabel } from "@/lib/meteo/getMeteo";

type MeteoBlockProps = {
  temp: number | null;
  code: number | null;
  wind?: number | null;
  variant?: "compact" | "panel";
};

export default function MeteoBlock({
  temp,
  code,
  wind,
  variant = "panel",
}: MeteoBlockProps) {
  if (temp === null && code === null) {
    return variant === "compact" ? (
      <span style={{ fontSize: "14px", color: "#666" }}>Tiempo no disponible</span>
    ) : (
      <div
        style={{
          padding: "16px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
        }}
      >
        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>Tiempo ahora</h3>
        <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
          Tiempo no disponible
        </p>
      </div>
    );
  }

  const label = getWeatherLabel(code);

  if (variant === "compact") {
    return (
      <span style={{ fontSize: "14px", color: "#333" }}>
        {temp !== null ? `${Math.round(temp)}°C` : ""}
        {temp !== null && code !== null ? " · " : ""}
        {label}
      </span>
    );
  }

  // Panel variant
  return (
    <div
      style={{
        padding: "16px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
      }}
    >
      <h3 style={{ margin: "0 0 12px 0", fontSize: "18px" }}>Tiempo ahora</h3>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        {temp !== null && (
          <span
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "#333",
            }}
          >
            {Math.round(temp)}°C
          </span>
        )}
        <span style={{ fontSize: "16px", color: "#666" }}>{label}</span>
      </div>
      {wind !== null && wind !== undefined && (
        <p style={{ margin: "8px 0 0 0", fontSize: "14px", color: "#666" }}>
          Viento: {Math.round(wind)} km/h
        </p>
      )}
    </div>
  );
}














