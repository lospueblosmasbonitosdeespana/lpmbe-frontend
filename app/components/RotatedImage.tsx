/**
 * RotatedImage - Componente para renderizar imágenes con rotación adaptativa
 * 
 * Si rotation es 90/270 (vertical): contenedor más alto + contain
 * Si rotation es 0/180 (horizontal): contenedor normal + cover
 */

type RotatedImageProps = {
  src: string;
  alt: string;
  rotation?: number | null;
  height?: number; // Altura base para horizontal (default 200)
  width?: number | string; // Ancho (default "100%")
  className?: string;
  loading?: "lazy" | "eager";
};

export default function RotatedImage({
  src,
  alt,
  rotation = 0,
  height = 200,
  width = "100%",
  className = "",
  loading = "lazy",
}: RotatedImageProps) {
  const rot = rotation ?? 0;
  const isVertical = rot % 180 !== 0; // 90 o 270

  // Si es vertical, contenedor más alto para que no recorte
  const containerHeight = isVertical ? Math.round(height * 1.5) : height;

  return (
    <div
      className={className}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: `${containerHeight}px`,
        overflow: "hidden",
        position: "relative",
        backgroundColor: "#f5f5f5",
        borderRadius: 4,
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: isVertical ? "contain" : "cover",
          transform: rot !== 0 ? `rotate(${rot}deg)` : undefined,
          transformOrigin: "center",
        }}
        loading={loading}
      />
    </div>
  );
}
