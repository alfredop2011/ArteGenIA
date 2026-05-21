/**
 * Compresión de imágenes en el cliente usando Canvas API.
 *
 * Reduce el tamaño y la resolución de imágenes ANTES de subirlas al servidor.
 * Ahorra ancho de banda y mejora la experiencia del usuario.
 *
 * Para fotos de personas: 1080px lado largo, JPEG 80% calidad (~150-300KB)
 * Para logos: 800px lado largo, PNG (~50-150KB)
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
  /** Forzar formato de salida */
  format?: "jpeg" | "png" | "auto";
};

const DEFAULTS: Record<CompressionMode, Required<Omit<CompressOptions, "mode">>> = {
  // Personas: JPEG es mejor por compresión, no necesitan transparencia
  person: { maxSize: 1080, quality: 0.80, format: "jpeg" },
  // Marcas/logos: PNG para preservar transparencia del logo
  brand: { maxSize: 800, quality: 0.92, format: "png" },
};

/**
 * Comprime un File de imagen y devuelve un nuevo File listo para subir.
 * Si la compresión falla por cualquier motivo, devuelve el File original.
 */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  if (typeof window === "undefined") return file; // SSR safety
  if (!file.type.startsWith("image/")) return file;

  const mode: CompressionMode = opts.mode ?? "person";
  const cfg = { ...DEFAULTS[mode], ...opts };

  try {
    // 1. Cargar imagen
    const img = await loadImageFromFile(file);

    // 2. Calcular dimensiones manteniendo aspect ratio
    const { width, height } = scaleDownToMax(img.width, img.height, cfg.maxSize);

    // 3. Si la imagen ya es más pequeña y es JPEG, devolverla tal cual
    //    (evita re-comprimir innecesariamente y perder calidad)
    if (
      width === img.width
      && height === img.height
      && file.type === "image/jpeg"
      && file.size < 500 * 1024
      && cfg.format !== "png"
    ) {
      return file;
    }

    // 4. Dibujar en canvas
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // Para JPEG, pintar fondo blanco para evitar transparencia → negro
    if (cfg.format === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0, width, height);

    // 5. Exportar al formato elegido
    const outMime = cfg.format === "png" ? "image/png" : "image/jpeg";
    const blob = await canvasToBlob(canvas, outMime, cfg.quality);
    if (!blob) return file;

    // 6. Si el resultado es MÁS GRANDE que el original (caso raro de PNGs pequeños),
    //    devolvemos el original.
    if (blob.size >= file.size) return file;

    // 7. Reconstruir como File con nombre limpio
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const ext = cfg.format === "png" ? "png" : "jpg";
    return new File([blob], `${baseName}.${ext}`, { type: outMime });
  } catch (err) {
    console.warn("[compressImage] fallback to original:", err);
    return file;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen"));
    };
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
