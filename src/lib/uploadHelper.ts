/**
 * Helper centralizado para subir imágenes a R2 vía los proxies de Vercel.
 *
 * - Comprime SIEMPRE en el navegador antes de enviar (≤ 4 MB).
 * - Acepta CUALQUIER tamaño de imagen original.
 * - Si la imagen es < 300 KB, devuelve un warning.
 * - Usa `/api/admin/uploads` (streaming) o `/api/media/upload` (streaming).
 */

import { compressImage } from './compressImage';

const LOW_QUALITY_THRESHOLD = 300 * 1024; // 300 KB

export interface UploadResult {
  url: string;
  warning?: string;
}

/**
 * Sube una imagen a R2 con compresión automática.
 *
 * @param file - Archivo original (cualquier tamaño)
 * @param folder - Carpeta destino en R2 (ej: "productos", "logos")
 * @param endpoint - Endpoint a usar. Default: '/api/admin/uploads'
 * @returns { url, warning? }
 */
export async function uploadImageToR2(
  file: File,
  folder?: string,
  endpoint: '/api/admin/uploads' | '/api/media/upload' = '/api/admin/uploads',
): Promise<UploadResult> {
  let warning: string | undefined;

  // Aviso de baja calidad
  if (file.size < LOW_QUALITY_THRESHOLD && file.type.startsWith('image/')) {
    warning = `La imagen pesa solo ${Math.round(file.size / 1024)} KB. Puede que no se vea con la calidad adecuada.`;
  }

  // Comprimir en el navegador (acepta cualquier tamaño, resultado ≤ 4 MB)
  let compressed: File;
  if (file.type.startsWith('image/') && !file.type.includes('svg') && !file.type.includes('gif')) {
    try {
      compressed = await compressImage(file, {
        fileName: file.name.replace(/\.[^.]+$/, ''),
      });
    } catch {
      compressed = file; // fallback si falla compresión
    }
  } else {
    compressed = file; // SVGs, GIFs, PDFs → enviar tal cual
  }

  const formData = new FormData();
  formData.append('file', compressed);
  if (folder) formData.append('folder', folder);

  const res = await fetch(endpoint, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data?.error ?? data?.message ?? `Error ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : 'Error subiendo imagen');
  }

  const data = await res.json();
  const url = data?.url ?? data?.publicUrl;
  if (!url || typeof url !== 'string') {
    throw new Error('La subida no devolvió URL');
  }

  return { url, warning };
}
