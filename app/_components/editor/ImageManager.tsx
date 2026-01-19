'use client';

import { useState } from 'react';

type UploadedImage = {
  url: string;
  name: string;
};

type ImageManagerProps = {
  images: UploadedImage[];
  defaultAlt: string;
  onInsertAtCursor: (markdown: string) => void;
  onAppendToEnd: (markdown: string) => void;
  onClear: () => void;
};

export default function ImageManager({
  images,
  defaultAlt,
  onInsertAtCursor,
  onAppendToEnd,
  onClear,
}: ImageManagerProps) {
  const [alts, setAlts] = useState<Record<string, string>>({});

  if (images.length === 0) return null;

  function getAltText(url: string): string {
    const userAlt = alts[url]?.trim();
    if (userAlt) return userAlt;
    if (defaultAlt?.trim()) return defaultAlt.trim();
    return 'Imagen';
  }

  function handleInsertSingle(url: string) {
    const alt = getAltText(url);
    const markdown = `![${alt}](${url})`;
    onInsertAtCursor(markdown);
  }

  function handleInsertAllAtCursor() {
    const lines = images.map((img) => {
      const alt = getAltText(img.url);
      return `![${alt}](${img.url})`;
    }).join('\n\n');
    onInsertAtCursor('\n\n' + lines + '\n\n');
    setAlts({});
  }

  function handleAppendAllToEnd() {
    const lines = images.map((img) => {
      const alt = getAltText(img.url);
      return `![${alt}](${img.url})`;
    }).join('\n\n');
    onAppendToEnd('\n\n' + lines + '\n\n');
    setAlts({});
  }

  return (
    <div className="rounded-md border bg-gray-50 p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">
          {images.length} {images.length === 1 ? 'imagen subida' : 'imágenes subidas'}
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleInsertAllAtCursor}
            className="rounded border bg-blue-600 text-white px-3 py-1 text-sm hover:bg-blue-700"
          >
            Insertar todas en el cursor
          </button>
          <button
            type="button"
            onClick={handleAppendAllToEnd}
            className="rounded border bg-white px-3 py-1 text-sm hover:bg-gray-50"
          >
            Añadir todas al final
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded border bg-white px-3 py-1 text-sm text-red-600 hover:bg-red-50"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 rounded border bg-white p-2"
          >
            {/* MINIATURA */}
            <img
              src={img.url}
              alt={img.name}
              className="h-16 w-16 rounded object-cover flex-shrink-0"
            />

            {/* DETALLES */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 truncate">{img.name}</p>
              <input
                type="text"
                placeholder={`Texto alternativo (opcional, por defecto: "${getAltText(img.url)}")`}
                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                value={alts[img.url] || ''}
                onChange={(e) =>
                  setAlts((prev) => ({ ...prev, [img.url]: e.target.value }))
                }
              />
            </div>

            {/* BOTÓN INSERTAR ESTA */}
            <button
              type="button"
              onClick={() => handleInsertSingle(img.url)}
              className="rounded border bg-white px-3 py-1 text-sm hover:bg-gray-50 flex-shrink-0"
            >
              Insertar esta
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
