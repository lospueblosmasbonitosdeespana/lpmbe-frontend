"use client";

import { useState, useRef } from "react";

interface ImageUploadProps {
  /** URL inicial de la imagen (para modo edición) */
  initialUrl?: string;
  /** Callback cuando se sube exitosamente */
  onUploadSuccess: (url: string) => void;
  /** Carpeta de destino en R2 (opcional, ej: "productos", "banners") */
  folder?: string;
  /** Texto del botón */
  buttonText?: string;
  /** Mostrar preview de la imagen */
  showPreview?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

export function ImageUpload({
  initialUrl,
  onUploadSuccess,
  folder = "general",
  buttonText = "Subir imagen",
  showPreview = true,
  className = "",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(initialUrl || null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten archivos de imagen");
      return;
    }

    // Validar tamaño (25MB máximo para subida - el backend optimizará a 500KB)
    if (file.size > 25 * 1024 * 1024) {
      setError("La imagen es demasiado grande (máximo 25MB)");
      return;
    }

    setError(null);
    setUploading(true);

    // Preview local
    if (showPreview) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }

    // Subir a API
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (folder) {
        formData.append("folder", folder);
      }

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error al subir imagen");
      }

      const data = await response.json();
      const uploadedUrl = data?.url ?? data?.publicUrl;
      if (!uploadedUrl) {
        throw new Error("La respuesta no incluye la URL de la imagen");
      }
      onUploadSuccess(uploadedUrl);
      setPreview(uploadedUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al subir imagen";
      setError(message);
      setPreview(initialUrl || null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      {showPreview && preview && (
        <div className="mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="h-32 w-full rounded-lg object-cover"
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? "Subiendo..." : buttonText}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {uploading && (
          <span className="text-sm text-gray-500">
            Optimizando imagen a máx 500KB...
          </span>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      <p className="mt-2 text-xs text-gray-500">
        Formatos: JPG, PNG, WebP, GIF. La imagen se optimizará automáticamente a máximo 500KB.
      </p>
    </div>
  );
}
