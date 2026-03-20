'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export interface ImageEditResult {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  linkUrl?: string;
}

interface Props {
  imageUrl: string;
  alt?: string;
  linkUrl?: string;
  onApply: (result: ImageEditResult) => void;
  onClose: () => void;
  onUploadCropped?: (file: File) => Promise<string>;
}

function centerAspectCrop(w: number, h: number): Crop {
  return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, w / h, w, h), w, h);
}

export default function ImageEditorModal({ imageUrl, alt = '', linkUrl = '', onApply, onClose, onUploadCropped }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);
  const [displayW, setDisplayW] = useState(0);
  const [displayH, setDisplayH] = useState(0);
  const [widthInput, setWidthInput] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [ratioLocked, setRatioLocked] = useState(true);
  const [altText, setAltText] = useState(alt);
  const [link, setLink] = useState(linkUrl);
  const [paddingV, setPaddingV] = useState(0);
  const [paddingH, setPaddingH] = useState(0);
  const [borderRadius, setBorderRadius] = useState(0);
  const [tab, setTab] = useState<'crop' | 'styles'>('crop');
  const [applying, setApplying] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [imgLoadError, setImgLoadError] = useState(false);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight, width, height } = e.currentTarget;
    setNaturalW(naturalWidth);
    setNaturalH(naturalHeight);
    setDisplayW(naturalWidth);
    setDisplayH(naturalHeight);
    setWidthInput(String(naturalWidth));
    setHeightInput(String(naturalHeight));
    setCrop(centerAspectCrop(width, height));
  }

  function handleWidthChange(val: string) {
    setWidthInput(val);
    const n = parseInt(val, 10);
    if (!n || !naturalW) return;
    setDisplayW(n);
    if (ratioLocked && naturalH) {
      const h = Math.round((n / naturalW) * naturalH);
      setDisplayH(h);
      setHeightInput(String(h));
    }
  }

  function handleHeightChange(val: string) {
    setHeightInput(val);
    const n = parseInt(val, 10);
    if (!n || !naturalH) return;
    setDisplayH(n);
    if (ratioLocked && naturalW) {
      const w = Math.round((n / naturalH) * naturalW);
      setDisplayW(w);
      setWidthInput(String(w));
    }
  }

  function resetToOriginal() {
    setWidthInput(String(naturalW));
    setHeightInput(String(naturalH));
    setDisplayW(naturalW);
    setDisplayH(naturalH);
  }

  async function getCroppedBlob(): Promise<Blob | null> {
    if (!completedCrop || !imgRef.current) return null;
    const img = imgRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const targetW = displayW || Math.round(completedCrop.width * scaleX);
    const targetH = displayH || Math.round(completedCrop.height * scaleY);
    canvas.width = targetW;
    canvas.height = targetH;
    ctx.drawImage(
      img,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0, targetW, targetH,
    );
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9));
  }

  async function handleApply() {
    setApplying(true);
    try {
      let finalUrl = imageUrl;

      // Si hay recorte activo y tenemos la función de upload
      if (cropMode && completedCrop && onUploadCropped && !imgLoadError) {
        const blob = await getCroppedBlob();
        if (blob) {
          const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
          finalUrl = await onUploadCropped(file);
        }
      }

      onApply({
        url: finalUrl,
        width: displayW || undefined,
        height: displayH || undefined,
        alt: altText,
        linkUrl: link,
      });
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-base font-semibold text-slate-800">Editar imagen</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {(['crop', 'styles'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors ${tab === t ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t === 'crop' ? 'Imagen' : 'Estilos'}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto">
          {tab === 'crop' && (
            <div className="p-5 space-y-5">
              {/* Preview / Crop area */}
              <div className="flex justify-center rounded-xl border border-slate-200 bg-slate-50 p-3 min-h-48 items-center overflow-hidden">
                {imageUrl ? (
                  cropMode && !imgLoadError ? (
                    <ReactCrop
                      crop={crop}
                      onChange={(c) => setCrop(c)}
                      onComplete={(c) => setCompletedCrop(c)}
                      className="max-h-72 max-w-full"
                    >
                      <img
                        ref={imgRef}
                        src={imageUrl}
                        crossOrigin="anonymous"
                        onLoad={onImageLoad}
                        onError={() => { setImgLoadError(true); setCropMode(false); }}
                        alt="Editar"
                        className="max-h-72 max-w-full object-contain"
                      />
                    </ReactCrop>
                  ) : (
                    <img
                      ref={imgRef}
                      src={imageUrl}
                      onLoad={onImageLoad}
                      onError={() => setImgLoadError(true)}
                      alt="Preview"
                      style={{
                        maxHeight: '288px',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        width: displayW ? `${displayW}px` : undefined,
                        borderRadius: borderRadius ? `${borderRadius}px` : undefined,
                        padding: `${paddingV}px ${paddingH}px`,
                      }}
                    />
                  )
                ) : (
                  <p className="text-sm text-slate-400">Sin imagen</p>
                )}
              </div>

              {/* Crop toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setCropMode((v) => !v); setImgLoadError(false); }}
                  className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${cropMode ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2v14a2 2 0 002 2h14"/><path d="M18 22V8a2 2 0 00-2-2H2"/>
                  </svg>
                  {cropMode ? 'Recortando...' : 'Recortar'}
                </button>
                {imgLoadError && (
                  <p className="text-xs text-amber-600">⚠ La imagen no soporta recorte por CORS. El resto de ediciones sí funcionan.</p>
                )}
              </div>

              {/* Dimensions */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Dimensiones</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500">Ancho (px)</label>
                    <input
                      type="number"
                      value={widthInput}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setRatioLocked((v) => !v)}
                    className={`mt-5 rounded-lg border p-2 transition-colors ${ratioLocked ? 'border-primary bg-primary/10 text-primary' : 'border-slate-300 text-slate-400 hover:border-slate-400'}`}
                    title={ratioLocked ? 'Proporciones bloqueadas' : 'Proporciones libres'}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {ratioLocked
                        ? <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>
                        : <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1" /></>}
                    </svg>
                  </button>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500">Alto (px)</label>
                    <input
                      type="number"
                      value={heightInput}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={resetToOriginal}
                    className="mt-5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Original
                  </button>
                </div>
              </div>

              {/* Alt text */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Texto alternativo (SEO)</label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Descripción de la imagen"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Link */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Enlace al clicar (opcional)</label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          )}

          {tab === 'styles' && (
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Padding vertical (px)</label>
                  <input type="number" min={0} max={80} value={paddingV} onChange={(e) => setPaddingV(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Padding horizontal (px)</label>
                  <input type="number" min={0} max={80} value={paddingH} onChange={(e) => setPaddingH(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Radio de borde (px)</label>
                  <input type="number" min={0} max={100} value={borderRadius} onChange={(e) => setBorderRadius(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              {/* Preview with styles */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex justify-center">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={altText}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      objectFit: 'contain',
                      padding: `${paddingV}px ${paddingH}px`,
                      borderRadius: `${borderRadius}px`,
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={applying}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 hover:opacity-90 transition-opacity"
          >
            {applying ? 'Aplicando...' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>
  );
}
