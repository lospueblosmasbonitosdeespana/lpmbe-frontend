'use client';

import { useRef, useState } from 'react';

type CoverPickerProps = {
  currentCoverUrl?: string | null;
  onFileSelected: (file: File | null) => void;
};

export default function CoverPicker({ currentCoverUrl, onFileSelected }: CoverPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleClick() {
    inputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    onFileSelected(file);

    // Crear preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  function handleClear() {
    setSelectedFile(null);
    setPreviewUrl(null);
    onFileSelected(null);
    // Limpiar input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  const hasFile = selectedFile || currentCoverUrl;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        className="rounded border px-4 py-2 text-sm hover:bg-gray-50 transition"
      >
        {hasFile ? '🖼️ Cambiar portada' : '📷 Insertar portada'}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {selectedFile && (
        <div className="mt-2 text-sm text-gray-600">
          <p>
            Archivo seleccionado: <span className="font-medium">{selectedFile.name}</span>
          </p>
          {previewUrl && (
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Preview"
                className="h-32 w-auto rounded border object-cover"
              />
              <button
                type="button"
                onClick={handleClear}
                className="mt-2 block text-sm text-red-600 hover:underline"
              >
                Quitar portada
              </button>
            </div>
          )}
        </div>
      )}

      {!selectedFile && currentCoverUrl && (
        <div className="mt-2 text-sm text-gray-600">
          <p>Portada actual:</p>
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentCoverUrl}
              alt="Portada actual"
              className="h-32 w-auto rounded border object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
}
