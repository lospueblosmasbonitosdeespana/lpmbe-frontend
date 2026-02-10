/**
 * Comprime una imagen en el navegador usando Canvas antes de subirla.
 *
 * - Acepta CUALQUIER tamaño de imagen (30 MB, 50 MB…).
 * - Redimensiona al máximo indicado (por defecto 2560 px de lado).
 * - Exporta como WebP (o JPEG si WebP no disponible) bajando calidad
 *   progresivamente hasta que el resultado cabe en maxBytes (por defecto 3 MB,
 *   seguro para el proxy de Vercel que limita ~4,5 MB).
 * - Devuelve un File listo para añadir a FormData.
 */

const DEFAULT_MAX_SIDE = 2560;
const DEFAULT_MAX_BYTES = 3 * 1024 * 1024; // 3 MB — margen para el límite de Vercel

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('No se pudo cargar la imagen'));
    img.src = src;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Error leyendo archivo'));
    reader.readAsDataURL(file);
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Error generando blob'));
      },
      type,
      quality,
    );
  });
}

export interface CompressOptions {
  /** Lado máximo en px (ancho o alto). Default 2560 */
  maxSide?: number;
  /** Tamaño máximo en bytes del resultado. Default 3 MB */
  maxBytes?: number;
  /** Nombre del archivo resultante (se asigna extensión automática) */
  fileName?: string;
}

export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<File> {
  const {
    maxSide = DEFAULT_MAX_SIDE,
    maxBytes = DEFAULT_MAX_BYTES,
    fileName,
  } = options;

  // Si ya es lo bastante pequeño y no necesita redimensión, devolver tal cual
  if (file.size <= maxBytes && file.type !== 'image/bmp' && file.type !== 'image/tiff') {
    // Aun así podría ser muy grande en píxeles; comprobamos dimensiones
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      if (img.naturalWidth <= maxSide && img.naturalHeight <= maxSide) {
        return file; // no necesita compresión
      }
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // Cargar imagen en canvas
  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);

  let { naturalWidth: w, naturalHeight: h } = img;

  // Redimensionar si excede maxSide
  if (w > maxSide || h > maxSide) {
    const ratio = Math.min(maxSide / w, maxSide / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);

  // Intentar WebP primero, luego JPEG como fallback
  const formats: Array<{ mime: string; ext: string }> = [
    { mime: 'image/webp', ext: 'webp' },
    { mime: 'image/jpeg', ext: 'jpg' },
  ];

  for (const fmt of formats) {
    // Bajar calidad progresivamente: 0.92 → 0.80 → 0.65 → 0.50 → 0.35
    for (const quality of [0.92, 0.80, 0.65, 0.50, 0.35]) {
      try {
        const blob = await canvasToBlob(canvas, fmt.mime, quality);
        if (blob.size <= maxBytes) {
          const baseName =
            fileName ??
            (file.name.replace(/\.[^.]+$/, '') || 'imagen');
          return new File([blob], `${baseName}.${fmt.ext}`, {
            type: fmt.mime,
          });
        }
      } catch {
        // formato no soportado por el navegador, probar siguiente
        break;
      }
    }
  }

  // Última opción: JPEG a calidad muy baja y dimensiones reducidas
  const smallerSide = Math.round(maxSide * 0.6);
  const ratio2 = Math.min(smallerSide / img.naturalWidth, smallerSide / img.naturalHeight, 1);
  canvas.width = Math.round(img.naturalWidth * ratio2);
  canvas.height = Math.round(img.naturalHeight * ratio2);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const lastBlob = await canvasToBlob(canvas, 'image/jpeg', 0.30);
  const baseName = fileName ?? (file.name.replace(/\.[^.]+$/, '') || 'imagen');
  return new File([lastBlob], `${baseName}.jpg`, { type: 'image/jpeg' });
}
