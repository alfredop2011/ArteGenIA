/**
 * Compresión de imágenes en el cliente usando Canvas API.
 *
 * Reduce el tamaño y la resolución de imágenes ANTES de subirlas al servidor.
 * Ahorra ancho de banda y mejora la experiencia del usuario.
 *
 * IMPORTANTE: Si el archivo entrante es PNG o WebP, lo preservamos como PNG
 * para no perder transparencia (decisión conservadora: si subiste PNG asumimos
 * que querías transparencia). Si es JPEG, se comprime como JPEG.
 *
 * Defaults por modo:
 *   - person:  1080px max, PNG si entrante es PNG/WebP, JPEG 80% si entrante es JPEG
 *   - brand:   800px max,  PNG siempre (logos requieren transparencia)
 *
 * El servidor también re-comprime como medida defensiva (ver sharp).
 */

export type CompressionMode = "person" | "brand";

export type CompressOptions = {
  mode?: CompressionMode;
  /** Tamaño máximo del lado largo en px (default según mode) */
  maxSize?: number;
  /** Calidad JPEG 0-1 (default según mode). Ignorado para PNG. */
  quality?: number;
  /**
   * Forzar formato de salida.
   *  - "auto": decisión inteligente (PNG si entrante es PNG/WebP, JPEG si JPEG)
   *  - "jpeg": forzar JPEG (pierde transparencia, fondo blanco si la tenía)
   *  - "png":  forzar PNG  (preserva transparencia siempre)
   */
  format?: "jpeg" | "png" | "auto";
};

const DEFAULTS: Record<CompressionMode, Required<Omit<CompressOptions, "mode">>> = {
  // Personas: auto-detección por mime type de entrada
  person: { maxSize: 1080, quality: 0.80, format: "auto" },
  // Marcas/logos: SIEMPRE PNG para preservar transparencia del logo
  brand:  { maxSize: 800,  quality: 0.92, format: "png" },
};

export type CompressionResult = {
  /** El archivo comprimido, listo para subir */
  file: File;
  /**
   * true si el archivo resultante es PNG (puede tener transparencia).
   * Downstream debe skipear remove-bg cuando esto sea true.
   */
  hasTransparency: boolean;
};

/**
 * Comprime un File de imagen y devuelve el archivo comprimido + flag de transparencia.
 * Si la compresión falla, devuelve el File original con hasTransparency=false.
 */
export async function compressImageWithMeta(file: File, opts: CompressOptions = {}): Promise<CompressionResult> {
  if (typeof window === "undefined") return { file, hasTransparency: false };
  if (!file.type.startsWith("image/")) return { file, hasTransparency: false };

  const mode: CompressionMode = opts.mode ?? "person";
  const cfg = { ...DEFAULTS[mode], ...opts };

  try {
    const img = await loadImageFromFile(file);
    const { width, height } = scaleDownToMax(img.width, img.height, cfg.maxSize);

    // Resolver formato final
    let finalFormat: "jpeg" | "png" = cfg.format === "png" ? "png" : "jpeg";

    if (cfg.format === "auto") {
      // Decisión conservadora: cualquier PNG o WebP entrante → PNG saliente.
      // Esto preserva transparencia siempre que el usuario sube un PNG (intención
      // probable) sin depender de muestreos que pueden fallar.
      if (file.type === "image/png" || file.type === "image/webp") {
        finalFormat = "png";
      } else {
        finalFormat = "jpeg";
      }
    }

    // Si la imagen ya es más pequeña y es JPEG, devolverla tal cual
    if (
      width === img.width
      && height === img.height
      && file.type === "image/jpeg"
      && file.size < 500 * 1024
      && finalFormat === "jpeg"
    ) {
      return { file, hasTransparency: false };
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { file, hasTransparency: finalFormat === "png" };

    if (finalFormat === "jpeg") {
      // JPEG no soporta transparencia: pintar fondo blanco para evitar negro
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0, width, height);

    const outMime = finalFormat === "png" ? "image/png" : "image/jpeg";
    const blob = await canvasToBlob(canvas, outMime, cfg.quality);
    if (!blob) return { file, hasTransparency: finalFormat === "png" };

    if (blob.size >= file.size) {
      // Devolver el original, pero respetando el flag (si format era PNG)
      return { file, hasTransparency: finalFormat === "png" };
    }

    const baseName = file.name.replace(/\.[^.]+$/, "");
    const ext = finalFormat === "png" ? "png" : "jpg";
    const newFile = new File([blob], `${baseName}.${ext}`, { type: outMime });
    return {
      file: newFile,
      hasTransparency: finalFormat === "png",
    };
  } catch (err) {
    console.warn("[compressImage] fallback to original:", err);
    return { file, hasTransparency: false };
  }
}

/**
 * Wrapper retrocompatible para callers que solo necesitan el File comprimido.
 */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  const result = await compressImageWithMeta(file, opts);
  return result.file;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No se pudo cargar la imagen")); };
    img.src = url;
  });
}

function scaleDownToMax(w: number, h: number, max: number): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h };
  if (w >= h) {
    const ratio = max / w;
    return { width: max, height: Math.round(h * ratio) };
  } else {
    const ratio = max / h;
    return { width: Math.round(w * ratio), height: max };
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(b => resolve(b), mime, quality));
}
