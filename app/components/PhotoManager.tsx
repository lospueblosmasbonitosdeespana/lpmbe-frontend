"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type PhotoManagerProps = {
  entity: "pueblo" | "poi";
  entityId: number;
  useAdminEndpoint?: boolean; // Si true, usa /api/admin/pueblos/:id/fotos
};

// Cache global de rotaciones para sobrevivir a unmount/remount
const rotationCacheGlobal = new Map<string, number>();

const rotationStorageKey = (id: string | number) => `lpbme-photo-rotation:${id}`;

function getStoredRotation(id: string | number): number | undefined {
  if (typeof window === "undefined") return undefined;
  const raw = window.localStorage.getItem(rotationStorageKey(id));
  if (raw == null) return undefined;
  const num = Number(raw);
  return Number.isFinite(num) ? num : undefined;
}

function setStoredRotation(id: string | number, rotation: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(rotationStorageKey(id), String(rotation));
  } catch {
    // ignore storage errors
  }
}

function clearStoredRotation(id: string | number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(rotationStorageKey(id));
  } catch {
    // ignore storage errors
  }
}

/* ----- Sortable row con handle de arrastre ----- */
function SortablePhotoRow({
  photo,
  index,
  onRotate,
  onDelete,
}: {
  photo: any;
  index: number;
  onRotate: (id: string | number) => void;
  onDelete: (id: number) => void;
}) {
  const id = String(photo.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: "grid",
        gridTemplateColumns: "44px 120px 1fr auto",
        gap: "12px",
        alignItems: "center",
        padding: "12px",
        backgroundColor: isDragging ? "#e5e7eb" : "#f9fafb",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
      }}
    >
      {/* Handle de arrastre */}
      <div
        {...attributes}
        {...listeners}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "grab",
          color: "#6b7280",
          padding: "8px",
          borderRadius: "6px",
          backgroundColor: "rgba(0,0,0,0.04)",
        }}
        title="Arrastra para reordenar"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </div>

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

      <div style={{ fontSize: "14px" }}>
        <div style={{ fontWeight: "500", marginBottom: "4px" }}>
          Foto #{index + 1}
          {index === 0 && (
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
          {String(photo.id).startsWith("legacy-") && (
            <span
              style={{
                marginLeft: "8px",
                padding: "2px 8px",
                backgroundColor: "#fef3c7",
                color: "#92400e",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "600",
              }}
              title="Foto heredada del sistema antiguo. Al editarla se convertirá en nueva."
            >
              Legacy
            </span>
          )}
        </div>
        <div style={{ color: "#6b7280", fontSize: "12px", wordBreak: "break-all" }}>
          {photo.publicUrl}
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={() => onRotate(photo.id)}
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
        <button
          type="button"
          onClick={() => onDelete(photo.id)}
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
  );
}

export default function PhotoManager({ entity, entityId, useAdminEndpoint = true }: PhotoManagerProps) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const rotationCacheRef = useRef<Map<string, number>>(new Map());

  // Cargar fotos desde el endpoint apropiado
  async function loadPhotos() {
    setLoading(true);
    setError(null);
    
    try {
      // Usar endpoint entity-specific (NUNCA /api/media genérico)
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
      
      // Parsing tolerante: detectar estructura automáticamente
      let fotosArray: any[] = [];
      
      if (Array.isArray(data)) {
        // Backend devuelve array directo: [{ id, url, orden/order, activo }]
        fotosArray = data;
      } else if (Array.isArray(data?.media)) {
        // Backend devuelve { media: [...] }
        fotosArray = data.media;
      } else if (Array.isArray(data?.fotos)) {
        // Backend devuelve { fotos: [...] }
        fotosArray = data.fotos;
      } else {
        // No hay fotos o formato desconocido
        fotosArray = [];
      }
      
      // Normalizar a formato común
      fotosArray = fotosArray.map((f) => {
        const id = f.id;
        const cachedRotation =
          rotationCacheRef.current.get(String(id)) ??
          rotationCacheGlobal.get(String(id)) ??
          getStoredRotation(id);
        const hasRotationFromApi = f.rotation !== undefined && f.rotation !== null
          || f.rotacion !== undefined && f.rotacion !== null;
        const rotation = hasRotationFromApi
          ? (f.rotation ?? f.rotacion)
          : (cachedRotation !== undefined ? cachedRotation : 0);

        // Solo actualizar cache si el backend envía rotación explícita
        if (hasRotationFromApi && rotation !== undefined && rotation !== null) {
          rotationCacheRef.current.set(String(id), rotation);
          rotationCacheGlobal.set(String(id), rotation);
          setStoredRotation(id, rotation);
        }

        return {
          id,
          publicUrl: f.url ?? f.publicUrl,
          order: Number(f.order ?? f.orden ?? 999),
          activo: f.activo,
          altText: f.altText ?? null,
          rotation,
        };
      });
      
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

      // Limpiar cache local/global
      rotationCacheRef.current.delete(String(photoId));
      rotationCacheGlobal.delete(String(photoId));
      clearStoredRotation(photoId);
    } catch (e: any) {
      setError(e?.message ?? "Error eliminando foto");
    }
  }

  // Persistir orden completo en backend (autoguardado al arrastrar)
  async function persistOrder(orderedPhotos: any[]) {
    setError(null);
    try {
      const payload = {
        fotos: orderedPhotos.map((p, idx) => ({
          id: p.id,
          orden: idx + 1,
        })),
      };

      console.log("[PhotoManager] persistOrder llamado, payload:", payload);

      const res = await fetch("/api/admin/fotos/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      console.log("[PhotoManager] persistOrder response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Error desconocido");
        console.error("[PhotoManager] persistOrder error:", res.status, errorText);
        throw new Error(`Error guardando orden (${res.status}): ${errorText}`);
      }

      const result = await res.json().catch(() => ({}));
      console.log("[PhotoManager] persistOrder success:", result);

      // Refrescar para sincronizar con backend (p. ej. IDs canonizados)
      await loadPhotos();
    } catch (e: any) {
      console.error("[PhotoManager] persistOrder exception:", e);
      setError(e?.message ?? "Error guardando orden");
      await loadPhotos();
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = photos.findIndex((p) => String(p.id) === String(active.id));
    const newIndex = photos.findIndex((p) => String(p.id) === String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    setError(null);
    const reordered = arrayMove(photos, oldIndex, newIndex).map((p, i) => ({ ...p, order: i + 1 }));
    setPhotos(reordered);
    await persistOrder(reordered);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Rotar foto 90 grados (AUTOSAVE inmediato, igual que pueblo)
  async function handleRotate(fotoId: number | string) {
    setError(null);

    // Encontrar la foto actual para calcular siguiente rotación
    const currentPhoto = photos.find((p) => String(p.id) === String(fotoId));
    if (!currentPhoto) return;

    // Usar cache si existe para evitar rotación reseteada por GET sin rotation
    const cachedRotation = rotationCacheRef.current.get(String(fotoId));
    const baseRotation = cachedRotation ?? currentPhoto.rotation ?? 0;
    const nextRotation = (baseRotation + 90) % 360;

    console.log("[PhotoManager] rotate", { fotoId, nextRotation });

    try {
      // 1) Optimistic update local (UI rota al instante)
      setPhotos((prev) =>
        prev.map((p) =>
          String(p.id) === String(fotoId) ? { ...p, rotation: nextRotation } : p
        )
      );
      rotationCacheRef.current.set(String(fotoId), nextRotation);
      rotationCacheGlobal.set(String(fotoId), nextRotation);
      setStoredRotation(fotoId, nextRotation);

      // 2) Persistir en backend
      console.log("[PhotoManager] PATCH /api/admin/fotos/:id/rotation", fotoId);
      
      const res = await fetch(`/api/admin/fotos/${fotoId}/rotation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rotation: nextRotation }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error("[PhotoManager] rotation PATCH failed", res.status, errorText);
        
        // Rollback: recargar fotos del backend para estado correcto
        await loadPhotos();
        throw new Error(`Error rotando foto (${res.status})`);
      }

      const updated = await res.json();
      console.log("[PhotoManager] rotation PATCH success", updated);

      // 3) Reconciliar: si ID cambia (legacy->canónica), sustituir
      setPhotos((prev) =>
        prev.map((p) => {
          if (String(p.id) !== String(fotoId)) return p;
          
          return {
            ...p,
            id: updated.id, // Muy importante si canoniza
            rotation: updated.rotation, // Muy importante
            publicUrl: updated.url ?? updated.publicUrl ?? p.publicUrl,
            altText: updated.alt ?? p.altText,
            order: updated.orden ?? updated.order ?? p.order,
          };
        })
      );

      // Mantener cache de rotaciones para evitar resets
      rotationCacheRef.current.set(String(updated.id ?? fotoId), updated.rotation ?? nextRotation);
      rotationCacheGlobal.set(String(updated.id ?? fotoId), updated.rotation ?? nextRotation);
      setStoredRotation(updated.id ?? fotoId, updated.rotation ?? nextRotation);
      if (String(updated.id) !== String(fotoId)) {
        rotationCacheRef.current.delete(String(fotoId));
        rotationCacheGlobal.delete(String(fotoId));
        clearStoredRotation(fotoId);
      }
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

      {/* Photos list - drag & drop */}
      {photos.length === 0 ? (
        <p style={{ color: "#6b7280", fontSize: "14px" }}>
          No hay fotos todavía. Sube la primera.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={photos.map((p) => String(p.id))}
            strategy={verticalListSortingStrategy}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {photos.map((photo, index) => (
                <SortablePhotoRow
                  key={photo.id}
                  photo={photo}
                  index={index}
                  onRotate={handleRotate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
        💡 Arrastra las fotos para reordenar. La primera se usa como <strong>foto principal</strong> en listados y cards.
      </div>
      
      {/* Info Legacy */}
      {photos.some(p => String(p.id).startsWith('legacy-')) && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            backgroundColor: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "6px",
            fontSize: "13px",
            color: "#78350f",
          }}
        >
          📌 <strong>Fotos Legacy:</strong> Heredadas del sistema antiguo. Al rotar, reordenar o editar una foto legacy, se canoniza automáticamente (obtiene un ID nuevo). Esto es normal y permite editarla sin afectar otros pueblos.
        </div>
      )}
    </div>
  );
}
