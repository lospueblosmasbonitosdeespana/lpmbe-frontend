"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
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

type FotoItem = {
  id: number;
  url: string;
  orden: number;
  activo?: boolean;
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

// Fila arrastrable individual
function SortablePhotoRow({
  photo,
  index,
  onRotate,
  onDelete,
  onUpdateAlt,
}: {
  photo: any;
  index: number;
  onRotate: (id: number | string) => void;
  onDelete: (id: number | string) => void;
  onUpdateAlt?: (id: number | string, alt: string) => Promise<void>;
}) {
  const [editingAlt, setEditingAlt] = useState(false);
  const [altValue, setAltValue] = useState(photo.altText ?? "");
  const isLegacy = String(photo.id).startsWith("legacy-");
  const id = photo.id;

  useEffect(() => {
    if (!editingAlt) setAltValue(photo.altText ?? "");
  }, [photo.altText, editingAlt]);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(id),
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "grid grid-cols-[44px_120px_1fr_auto] items-center gap-3 rounded-lg border p-3",
        "border-border",
        isDragging ? "bg-accent/60" : "bg-muted/50 dark:bg-muted/30",
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex cursor-grab items-center justify-center rounded-md border border-border bg-background p-2 text-foreground active:cursor-grabbing"
        title="Arrastra para reordenar"
      >
        <span className="text-base leading-none">⋮⋮</span>
      </div>

      <img
        src={photo.publicUrl}
        alt={photo.altText ?? ""}
        className="h-20 w-[120px] rounded-md border border-border object-cover"
        style={{ transform: `rotate(${photo.rotation ?? 0}deg)` }}
      />

      <div className="min-w-0 text-sm">
        <div className="mb-1 font-medium text-foreground">
          Foto #{index + 1}
          {index === 0 && (
            <span className="ml-2 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-900 dark:bg-blue-950 dark:text-blue-200">
              Principal
            </span>
          )}
          {String(photo.id).startsWith("legacy-") && (
            <span
              className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200"
              title="Foto heredada del sistema antiguo. Al editarla se convertirá en nueva."
            >
              Legacy
            </span>
          )}
        </div>
        <div className="break-all text-xs text-muted-foreground">{photo.publicUrl}</div>
        <div className="mt-1.5">
          {editingAlt && !isLegacy ? (
            <input
              type="text"
              value={altValue}
              onChange={(e) => setAltValue(e.target.value)}
              onBlur={async () => {
                if (onUpdateAlt && altValue !== (photo.altText ?? "")) {
                  await onUpdateAlt(photo.id, altValue);
                }
                setEditingAlt(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                }
                if (e.key === "Escape") {
                  setAltValue(photo.altText ?? "");
                  setEditingAlt(false);
                }
              }}
              placeholder="Descripción (alt) para SEO"
              className="w-full rounded border border-input bg-background px-2 py-1 text-xs text-foreground"
              autoFocus
            />
          ) : (
            <div className="text-xs text-muted-foreground">
              {photo.altText ? (
                <>
                  <span title="Alt (SEO)">📝 {photo.altText}</span>
                  {!isLegacy && onUpdateAlt && (
                    <button
                      type="button"
                      onClick={() => setEditingAlt(true)}
                      className="ml-1.5 text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Editar
                    </button>
                  )}
                </>
              ) : (
                !isLegacy &&
                onUpdateAlt && (
                  <button
                    type="button"
                    onClick={() => setEditingAlt(true)}
                    className="text-muted-foreground underline hover:text-foreground"
                  >
                    + Añadir descripción (alt) para SEO
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onRotate(photo.id)}
          className="rounded-md border border-sky-200 bg-sky-100 px-3 py-2 text-sm font-medium text-sky-900 hover:bg-sky-200 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100 dark:hover:bg-sky-900"
          title="Girar 90°"
        >
          🔄
        </button>
        <button
          type="button"
          onClick={() => onDelete(photo.id)}
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200 dark:hover:bg-red-950"
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
  const [uploadAlt, setUploadAlt] = useState("");
  const rotationCacheRef = useRef<Map<string, number>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Cargar fotos desde el endpoint apropiado
  async function loadPhotos(clearError = true) {
    setLoading(true);
    if (clearError) setError(null);
    
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
          altText: f.alt ?? f.altText ?? null,
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
      // Comprimir + subir a R2
      const { uploadImageToR2 } = await import("@/src/lib/uploadHelper");
      const folder = entity === "pueblo" ? "pueblos" : "pois";
      const { url: uploadedUrl, warning } = await uploadImageToR2(file, folder);
      if (warning) console.warn("[PhotoManager]", warning);

      if (!uploadedUrl) {
        throw new Error("No se recibió la URL del archivo subido");
      }

      // 2) Asociar la URL al pueblo/POI
      const attachEndpoint = entity === "pueblo"
        ? `/api/admin/pueblos/${entityId}/fotos`
        : `/api/admin/pois/${entityId}/fotos`;

      const attachRes = await fetch(attachEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: uploadedUrl,
          ...(uploadAlt?.trim() && { alt: uploadAlt.trim() }),
        }),
        credentials: "include",
      });

      if (!attachRes.ok) {
        const errorData = await attachRes.json().catch(() => ({}));
        throw new Error(errorData?.error ?? `Error asociando foto (${attachRes.status})`);
      }

      // Recargar lista
      await loadPhotos();

      // Reset input y campo alt
      e.target.value = "";
      setUploadAlt("");
    } catch (e: any) {
      setError(e?.message ?? "Error subiendo foto");
    } finally {
      setUploading(false);
    }
  }

  // Borrar/Desasociar foto
  async function handleDelete(photoId: number | string) {
    if (!confirm("¿Eliminar esta foto?")) return;

    setError(null);

    try {
      // Usar endpoint genérico de borrado: DELETE /api/admin/fotos/:id
      const res = await fetch(`/api/admin/fotos/${photoId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error ?? `Error eliminando foto (${res.status})`);
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

  const [saving, setSaving] = useState(false);

  // Persistir orden completo en backend
  async function persistOrder(orderedPhotos: any[]): Promise<boolean> {
    const payload = {
      fotos: orderedPhotos.map((p, idx) => ({
        id: p.id,
        orden: idx + 1,
      })),
    };

    console.log("[PhotoManager] persistOrder payload:", JSON.stringify(payload));

    const res = await fetch("/api/admin/fotos/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const responseText = await res.text().catch(() => "");
    console.log("[PhotoManager] persistOrder response:", res.status, responseText);

    if (!res.ok) {
      throw new Error(`Error guardando orden (${res.status}): ${responseText}`);
    }

    return true;
  }

  // Drag & drop: reordenar y persistir al soltar
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = photos.findIndex((p) => String(p.id) === String(active.id));
    const newIndex = photos.findIndex((p) => String(p.id) === String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    console.log("[PhotoManager] handleDragEnd:", { oldIndex, newIndex, activeId: active.id, overId: over.id });

    // Actualizar UI inmediatamente
    const reordered = arrayMove(photos, oldIndex, newIndex).map((p, i) => ({ ...p, order: i + 1 }));
    setPhotos(reordered);
    setError(null);
    setSaving(true);

    try {
      await persistOrder(reordered);
      console.log("[PhotoManager] ✅ Orden guardado correctamente");
      // Refrescar para sincronizar IDs canonizados
      await loadPhotos(true);
    } catch (e: any) {
      console.error("[PhotoManager] ❌ Error guardando orden:", e);
      setError(e?.message ?? "Error guardando orden");
      // Revertir al orden anterior del backend (NO borrar el error)
      await loadPhotos(false);
    } finally {
      setSaving(false);
    }
  }

  // Actualizar alt (SEO) de una foto
  async function handleUpdateAlt(fotoId: number | string, alt: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/fotos/${fotoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alt: alt.trim() || null }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `Error actualizando alt (${res.status})`);
      }
      await loadPhotos();
    } catch (e: any) {
      setError(e?.message ?? "Error guardando descripción");
    }
  }

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
      <div className="p-5">
        <p className="text-muted-foreground">Cargando fotos...</p>
      </div>
    );
  }

  return (
    <div className="p-5 text-foreground">
      <div className="mb-5">
        <h3 className="mb-2 text-lg font-semibold">Fotos</h3>
        <p className="mb-2 text-sm text-muted-foreground">
          Descripción (alt) para SEO: opcional. Mejora accesibilidad y posicionamiento en Google.
        </p>
        <div className="mb-2 max-w-md">
          <input
            type="text"
            placeholder="Ej: Plaza mayor, iglesia de Santa María..."
            value={uploadAlt}
            onChange={(e) => setUploadAlt(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            aria-label="Descripción de la siguiente foto (alt, para SEO)"
          />
        </div>
        <label
          className={cn(
            "inline-block rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700",
            uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          )}
        >
          {uploading ? "Subiendo..." : "📷 Subir foto"}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {saving && (
        <div className="mb-5 rounded-md border border-green-200 bg-green-50 px-3 py-3 text-sm font-medium text-green-900 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100">
          💾 Guardando nuevo orden...
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay fotos todavía. Sube la primera.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={photos.map((p) => String(p.id))}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-3">
              {photos.map((photo, index) => (
                <SortablePhotoRow
                  key={photo.id}
                  photo={photo}
                  index={index}
                  onRotate={handleRotate}
                  onDelete={handleDelete}
                  onUpdateAlt={handleUpdateAlt}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="mt-5 rounded-md border border-sky-200 bg-sky-50 px-3 py-3 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
        💡 Arrastra las fotos para cambiar el orden. La primera se usa como <strong>foto principal</strong> en listados y la página pública.
      </div>

      {photos.some((p) => String(p.id).startsWith("legacy-")) && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          📌 <strong>Fotos Legacy:</strong> Heredadas del sistema antiguo. Al rotar, reordenar o editar una foto legacy, se canoniza automáticamente (obtiene un ID nuevo). Esto es normal y permite editarla sin afectar otros pueblos.
        </div>
      )}
    </div>
  );
}
