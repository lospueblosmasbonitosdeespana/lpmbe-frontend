'use client';

import { useState, useRef, useEffect } from 'react';

type ImageEditorModalProps = {
  imageUrl: string;
  alt?: string;
  linkUrl?: string;
  initialWidth?: number;
  initialHeight?: number;
  initialBorderRadius?: number;
  onClose: () => void;
  onUploadCropped?: (file: File) => Promise<string>;
  onApply: (result: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
    linkUrl?: string;
    borderRadius?: number;
  }) => void;
};

export default function ImageEditorModal({
  imageUrl,
  alt: initialAlt = '',
  linkUrl: initialLinkUrl = '',
  initialWidth,
  initialHeight,
  initialBorderRadius,
  onClose,
  onApply,
}: ImageEditorModalProps) {
  const [url, setUrl] = useState(imageUrl);
  const [alt, setAlt] = useState(initialAlt);
  const [linkUrl, setLinkUrl] = useState(initialLinkUrl);
  const [width, setWidth] = useState<number | undefined>(initialWidth);
  const [height, setHeight] = useState<number | undefined>(initialHeight);
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);
  const [keepRatio, setKeepRatio] = useState(true);
  const [borderRadius, setBorderRadius] = useState(initialBorderRadius ?? 0);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imageUrl) return;
    const img = new window.Image();
    img.onload = () => {
      setNaturalW(img.naturalWidth);
      setNaturalH(img.naturalHeight);
      setWidth((prev) => prev ?? img.naturalWidth);
      setHeight((prev) => prev ?? img.naturalHeight);
    };
    img.src = imageUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  const handleWidthChange = (v: number) => {
    setWidth(v);
    if (keepRatio && naturalW > 0) {
      setHeight(Math.round((v / naturalW) * naturalH));
    }
  };

  const handleHeightChange = (v: number) => {
    setHeight(v);
    if (keepRatio && naturalH > 0) {
      setWidth(Math.round((v / naturalH) * naturalW));
    }
  };

  const presets = [
    { label: 'Original', w: naturalW, h: naturalH },
    { label: 'Pequeña (300px)', w: 300, h: naturalH && naturalW ? Math.round((300 / naturalW) * naturalH) : 200 },
    { label: 'Media (500px)', w: 500, h: naturalH && naturalW ? Math.round((500 / naturalW) * naturalH) : 350 },
    { label: 'Grande (800px)', w: 800, h: naturalH && naturalW ? Math.round((800 / naturalW) * naturalH) : 550 },
  ];

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-base font-semibold">Editar imagen</h3>
          <button onClick={onClose} className="text-xl leading-none text-muted-foreground hover:text-foreground">&times;</button>
        </div>

        <div className="space-y-4 p-5">
          {url && (
            <div className="flex justify-center rounded-lg bg-neutral-100 p-3 dark:bg-neutral-800">
              <img
                src={url}
                alt={alt}
                style={{
                  maxWidth: '100%',
                  maxHeight: 220,
                  objectFit: 'contain',
                  borderRadius: borderRadius > 0 ? borderRadius : undefined,
                }}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-muted-foreground">
              Ancho (px)
              <input
                type="number"
                value={width ?? ''}
                onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Alto (px)
              <input
                type="number"
                value={height ?? ''}
                onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={keepRatio} onChange={(e) => setKeepRatio(e.target.checked)} />
            Mantener proporción
          </label>

          <div className="flex flex-wrap gap-2">
            {presets.filter(p => p.w > 0).map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => { setWidth(p.w); setHeight(p.h); }}
                className="rounded-md border px-2.5 py-1 text-xs hover:bg-primary/10"
              >
                {p.label}
              </button>
            ))}
          </div>

          <label className="text-xs text-muted-foreground">
            Bordes redondeados (px)
            <input
              type="range"
              min={0}
              max={50}
              value={borderRadius}
              onChange={(e) => setBorderRadius(parseInt(e.target.value))}
              className="mt-1 w-full"
            />
            <span className="text-xs">{borderRadius}px</span>
          </label>

          <label className="text-xs text-muted-foreground">
            Texto alternativo (alt)
            <input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
              placeholder="Descripción de la imagen"
            />
          </label>

          <label className="text-xs text-muted-foreground">
            Enlace al pulsar (opcional)
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
              placeholder="https://..."
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onApply({
                url,
                alt,
                width: width || undefined,
                height: height || undefined,
                linkUrl: linkUrl || undefined,
                borderRadius: borderRadius > 0 ? borderRadius : undefined,
              });
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
