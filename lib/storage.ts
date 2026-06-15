/**
 * Storage limits por plan (Fase Z.8).
 *
 * Free       : 100 MB
 * Pro        : 5 GB
 * Enterprise : 50 GB
 *
 * Política de exceso:
 *   - Free al 80%: warning suave en UI.
 *   - Free al 100%: bloquear nuevos saves + sugerir borrar antiguos
 *     o sub ir a Pro.
 *   - Pro al 90%: warning con CTA Enterprise.
 *   - Pro al 100%: bloquear + obligar a borrar.
 */

export const STORAGE_LIMIT_BYTES: Record<string, number> = {
  free: 100 * 1024 * 1024,           // 100 MB
  pro: 5 * 1024 * 1024 * 1024,       // 5 GB
  enterprise: 50 * 1024 * 1024 * 1024, // 50 GB
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function getStorageLimitFor(plan?: string | null): number {
  return STORAGE_LIMIT_BYTES[plan ?? "free"] ?? STORAGE_LIMIT_BYTES.free;
}

export function isStorageExceeded(usedBytes: number, plan?: string | null): boolean {
  return usedBytes >= getStorageLimitFor(plan);
}

export type AssetType = "sin_fondo" | "sticker_ia" | "generada_ia" | "subida";

export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  sin_fondo: "Fotos sin fondo",
  sticker_ia: "Stickers IA",
  generada_ia: "Generadas con IA",
  subida: "Subidas",
};

export const ASSET_TYPE_ICON: Record<AssetType, string> = {
  sin_fondo: "✂️",
  sticker_ia: "✨",
  generada_ia: "🎨",
  subida: "📤",
};
