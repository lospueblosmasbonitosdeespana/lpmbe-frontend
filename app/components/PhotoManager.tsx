"use client";

import { useEffect, useState } from "react";

type Photo = {
  id: string | number;
  url: string;
  alt?: string | null;
  orden: number;
  editable?: boolean;
};

type PhotoManagerProps = {
  entity: "pueblo" | "poi";
  entityId: number;
};

export default function PhotoManager({ entity, entityId }: PhotoManagerProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Cargar fotos
  async function loadPhotos() {
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = entity === "pueblo" 
        ? `/api/admin/pueblos/${entityId}/fotos`
        : `/api/admin/pois/${entityId}/fotos`;
      
      const res = await fetch(endpoint, { cache: "no-store" });
      
      if (res.status === 401) {
        window.location.href = "/entrar";
        return;
      }
      
      if (!res.ok) {
        throw new Error(`Error cargando fotos (${res.status})`);
      }
      
      const data = await res.json();
      const sorted = Array.isArray(data) 
        ? data.sort((a: any, b: any) => (a.orden ?? 999) - (b.orden ?? 999))
        : [];
      
      setPhotos(sorted);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando fotos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, entityId]);

  // Subir foto
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // 1. Subir archivo a /media/upload
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error(`Error subiendo archivo (${uploadRes.status})`);
      }

      const { url } = await uploadRes.json();

      // 2. Crear foto en el entity
      const endpoint = entity === "pueblo"
        ? `/api/admin/pueblos/${entityId}/fotos`
        : `/api/admin/pois/${entityId}/fotos`;

      const createRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!createRes.ok) {
        throw new Error(`Error creando foto (${createRes.status})`);
      }

      // 3. Recargar lista
      await loadPhotos();

      // Reset input
      e.target.value = "";
    } catch (e: any) {
      setError(e?.message ?? "Error subiendo foto");
    } finally {
      setUploading(false);
    }
  }

  // Borrar foto
  async function handleDelete(photoId: string | number) {
    if (!confirm("¿Eliminar esta foto?")) return;

    setError(null);

    try {
      const res = await fetch(`/api/admin/fotos/${photoId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`Error eliminando foto (${res.status})`);
      }

      await loadPhotos();
    } catch (e: any) {
      setError(e?.message ?? "Error eliminando foto");
    }
  }

  // Mover foto arriba
  async function moveUp(index: number) {
    if (index === 0) return;

    const photoA = photos[index];
    const photoB = photos[index - 1];

    setError(null);

    try {
      const endpoint = entity === "pueblo"
        ? `/api/admin/pueblos/${entityId}/fotos/swap`
        : `/api/admin/pois/${entityId}/fotos/swap`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aId: photoA.id,
          bId: photoB.id,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error reordenando (${res.status})`);
      }

      await loadPhotos();
    } catch (e: any) {
      setError(e?.message ?? "Error reordenando");
    }
  }

  // Mover foto abajo
  async function moveDown(index: number) {
    if (index === photos.length - 1) return;

    const photoA = photos[index];
    const photoB = photos[index + 1];

    setError(null);

    try {
      const endpoint = entity === "pueblo"
        ? `/api/admin/pueblos/${entityId}/fotos/swap`
        : `/api/admin/pois/${entityId}/fotos/swap`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aId: photoA.id,
          bId: photoB.id,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error reordenando (${res.status})`);
      }

      await loadPhotos();
    } catch (e: any) {
      setError(e?.message ?? "Error reordenando");
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <p>Cargando fotos...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: "18px", fontWeight: "600" }}>
          Fotos
        </h3>
        
        {/* Upload button */}
        <label
          style={{
            display: "inline-block",
            padding: "10px 16px",
            backgroundColor: "#2563eb",
            color: "white",
            borderRadius: "6px",
            cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.6 : 1,
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          {uploading ? "Subiendo..." : "📷 Subir foto"}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "6px",
            color: "#dc2626",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {/* Photos grid */}
      {photos.length === 0 ? (
        <p style={{ color: "#6b7280", fontSize: "14px" }}>
          No hay fotos todavía. Sube la primera.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              style={{
                display: "grid",
                gridTemplateColumns: "60px 120px 1fr auto",
                gap: "12px",
                alignItems: "center",
                padding: "12px",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            >
              {/* Botones arriba/abajo */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  style={{
                    padding: "4px 8px",
                    fontSize: "12px",
                    cursor: index === 0 ? "not-allowed" : "pointer",
                    opacity: index === 0 ? 0.4 : 1,
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    backgroundColor: "white",
                  }}
                  title="Subir"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === photos.length - 1}
                  style={{
                    padding: "4px 8px",
                    fontSize: "12px",
                    cursor: index === photos.length - 1 ? "not-allowed" : "pointer",
                    opacity: index === photos.length - 1 ? 0.4 : 1,
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    backgroundColor: "white",
                  }}
                  title="Bajar"
                >
                  ↓
                </button>
              </div>

              {/* Thumbnail */}
              <img
                src={photo.url}
                alt={photo.alt ?? ""}
                style={{
                  width: "120px",
                  height: "80px",
                  objectFit: "cover",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                }}
              />

              {/* Info */}
              <div style={{ fontSize: "14px" }}>
                <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                  Foto #{photo.orden}
                  {photo.orden === 1 && (
                    <span
                      style={{
                        marginLeft: "8px",
                        padding: "2px 8px",
                        backgroundColor: "#dbeafe",
                        color: "#1e40af",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      Principal
                    </span>
                  )}
                </div>
                <div style={{ color: "#6b7280", fontSize: "12px", wordBreak: "break-all" }}>
                  {photo.url}
                </div>
              </div>

              {/* Botón borrar */}
              {photo.editable !== false && (
                <button
                  onClick={() => handleDelete(photo.id)}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#fee2e2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                  title="Eliminar"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div
        style={{
          marginTop: "20px",
          padding: "12px",
          backgroundColor: "#f0f9ff",
          border: "1px solid #bae6fd",
          borderRadius: "6px",
          fontSize: "13px",
          color: "#0c4a6e",
        }}
      >
        💡 La primera foto (orden #1) se usa como <strong>foto principal</strong> en listados y cards.
      </div>
    </div>
  );
}
