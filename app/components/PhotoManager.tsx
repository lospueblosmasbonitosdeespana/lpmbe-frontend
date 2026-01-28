"use client";

import { useEffect, useState } from "react";
import type { MediaItem } from "@/src/types/media";

type PhotoManagerProps = {
  entity: "pueblo" | "poi";
  entityId: number;
  useAdminEndpoint?: boolean; // Si true, usa /api/admin/pueblos/:id/fotos
};

type FotoItem = {
  id: number;
  url: string;
  orden: number;
  activo?: boolean;
};

export default function PhotoManager({ entity, entityId, useAdminEndpoint = false }: PhotoManagerProps) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Cargar fotos desde el endpoint apropiado
  async function loadPhotos() {
    setLoading(true);
    setError(null);
    
    try {
      let res: Response;
      
      if (useAdminEndpoint) {
        // Usar endpoint legacy admin
        const endpoint = entity === "pueblo"
          ? `/api/admin/pueblos/${entityId}/fotos`
          : `/api/admin/pois/${entityId}/fotos`;
        res = await fetch(endpoint, { cache: "no-store" });
      } else {
        // Usar endpoint /media nuevo
        res = await fetch(`/api/media?ownerType=${entity}&ownerId=${entityId}`, {
          cache: "no-store",
        });
      }
      
      if (res.status === 401) {
        window.location.href = "/entrar";
        return;
      }
      
      if (!res.ok) {
        throw new Error(`Error cargando fotos (${res.status})`);
      }
      
      const data = await res.json();
      
      let fotosArray: any[] = [];
      
      if (useAdminEndpoint) {
        // Backend devuelve array directo: [{ id, url, order, activo }]
        // La API route ya normalizó orden -> order
        fotosArray = Array.isArray(data) ? data : [];
        // Normalizar a formato común
        fotosArray = fotosArray.map(f => ({
          id: f.id,
          publicUrl: f.url,
          order: Number(f.order ?? f.orden ?? 999), // Asegurar number
          activo: f.activo,
          altText: null,
        }));
      } else {
        // Backend devuelve { media: [...] }
        fotosArray = Array.isArray(data.media) ? data.media : [];
      }
      
      // Ordenar por orden ascendente (nulos/undefined al final)
      fotosArray.sort((a, b) => {
        const orderA = a.order ?? 999999;
        const orderB = b.order ?? 999999;
        return orderA - orderB;
      });
      
      setPhotos(fotosArray);
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
      if (useAdminEndpoint) {
        // Subir usando endpoint legacy admin
        const formData = new FormData();
        formData.append("file", file);
        
        const endpoint = entity === "pueblo"
          ? `/api/admin/pueblos/${entityId}/fotos/upload`
          : `/api/admin/pois/${entityId}/fotos/upload`;
        
        const uploadRes = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}));
          throw new Error(errorData?.error ?? `Error subiendo archivo (${uploadRes.status})`);
        }
      } else {
        // Usar /media/upload nuevo
        const formData = new FormData();
        formData.append("file", file);
        formData.append("ownerType", entity);
        formData.append("ownerId", String(entityId));

        const uploadRes = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}));
          throw new Error(errorData?.error ?? `Error subiendo archivo (${uploadRes.status})`);
        }
      }

      // Recargar lista
      await loadPhotos();

      // Reset input
      e.target.value = "";
    } catch (e: any) {
      setError(e?.message ?? "Error subiendo foto");
    } finally {
      setUploading(false);
    }
  }

  // Borrar/Desasociar foto
  async function handleDelete(photoId: number) {
    const confirmMessage = useAdminEndpoint && entity === "pueblo"
      ? "¿Desasociar esta foto del pueblo? (la foto no se borrará, solo se quitará de este pueblo)"
      : "¿Eliminar esta foto?";
    
    if (!confirm(confirmMessage)) return;

    setError(null);

    try {
      if (useAdminEndpoint) {
        // Para pueblos: DETACH (desasociar) en vez de DELETE
        const endpoint = entity === "pueblo"
          ? `/api/admin/pueblos/${entityId}/fotos/${photoId}/detach`
          : `/api/admin/pois/fotos/${photoId}`;
        
        const res = await fetch(endpoint, {
          method: "DELETE",
          cache: "no-store",
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData?.error ?? `Error desasociando foto (${res.status})`);
        }
      } else {
        const res = await fetch(`/api/media/${photoId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error(`Error eliminando foto (${res.status})`);
        }
      }

      // Refetch inmediato sin caché
      await loadPhotos();
    } catch (e: any) {
      setError(e?.message ?? "Error eliminando foto");
    }
  }

  // Reordenar fotos
  async function handleReorder(photoId: number, newOrder: number) {
    setError(null);

    try {
      if (useAdminEndpoint) {
        // Usar endpoint de reorder admin
        const res = await fetch(`/api/admin/fotos/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fotoId: photoId, orden: newOrder }),
        });

        if (!res.ok) {
          throw new Error(`Error reordenando foto (${res.status})`);
        }
      } else {
        const res = await fetch(`/api/media/${photoId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: newOrder }),
        });

        if (!res.ok) {
          throw new Error(`Error reordenando foto (${res.status})`);
        }
      }

      await loadPhotos();
    } catch (e: any) {
      setError(e?.message ?? "Error reordenando foto");
    }
  }

  // Mover foto arriba (usa SWAP)
  async function moveUp(index: number) {
    if (index === 0) return;
    
    const photoA = photos[index];
    const photoB = photos[index - 1];
    
    setError(null);
    
    try {
      const res = await fetch(`/api/admin/fotos/swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aId: photoA.id,
          bId: photoB.id,
        }),
      });
      
      if (!res.ok) {
        throw new Error(`Error intercambiando fotos (${res.status})`);
      }
      
      await loadPhotos();
    } catch (e: any) {
      setError(e?.message ?? "Error intercambiando fotos");
    }
  }

  // Mover foto abajo (usa SWAP)
  async function moveDown(index: number) {
    if (index === photos.length - 1) return;
    
    const photoA = photos[index];
    const photoB = photos[index + 1];
    
    setError(null);
    
    try {
      const res = await fetch(`/api/admin/fotos/swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aId: photoA.id,
          bId: photoB.id,
        }),
      });
      
      if (!res.ok) {
        throw new Error(`Error intercambiando fotos (${res.status})`);
      }
      
      await loadPhotos();
    } catch (e: any) {
      setError(e?.message ?? "Error intercambiando fotos");
    }
  }

  // Rotar foto 90 grados
  async function handleRotate(fotoId: number) {
    setError(null);

    try {
      const res = await fetch(`/api/admin/fotos/${fotoId}/rotate90`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error(`Error rotando foto (${res.status})`);
      }

      // Refrescar la lista tras rotación exitosa
      await loadPhotos();
    } catch (e: any) {
      setError(e?.message ?? "Error rotando foto");
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
                src={photo.publicUrl}
                alt={photo.altText ?? ""}
                style={{
                  width: "120px",
                  height: "80px",
                  objectFit: "cover",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                  transform: `rotate(${photo.rotation ?? 0}deg)`,
                }}
              />

              {/* Info */}
              <div style={{ fontSize: "14px" }}>
                <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                  Foto #{photo.order}
                  {photo.order === 1 && (
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
                  {photo.publicUrl}
                </div>
              </div>

              {/* Botones de acción */}
              <div style={{ display: "flex", gap: "8px" }}>
                {/* Botón rotar */}
                <button
                  onClick={() => handleRotate(photo.id)}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#e0f2fe",
                    color: "#0369a1",
                    border: "1px solid #bae6fd",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                  title="Girar 90°"
                >
                  🔄
                </button>

                {/* Botón borrar */}
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
              </div>
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
