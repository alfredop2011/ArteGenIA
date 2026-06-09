/**
 * Helpers de validación de inputs para endpoints API.
 *
 * Bloquea:
 *  - SSRF (Server-Side Request Forgery): el atacante envía una URL a un
 *    endpoint que la fetcha y le devuelve el contenido. Permite leer
 *    metadatos internos de Vercel (e.g. http://169.254.169.254/) o servicios
 *    internos de la VPN, redes locales, etc.
 *  - Bypass del whitelist via DNS rebinding o IPs literales.
 *  - Payloads gigantes que causan DoS o cuelgan workers.
 */

/** Dominios permitidos como origen de imágenes en endpoints IA. */
const ALLOWED_IMAGE_HOSTS = new Set([
  // Nuestro storage
  "pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev",
  // Supabase Storage del proyecto
  "tbuszlffgtjnbvkxhkti.supabase.co",
]);

/** Sufijos permitidos (subdominios variables). */
const ALLOWED_IMAGE_HOST_SUFFIXES = [
  ".fal.media",   // Fal.ai cdn
  ".fal.run",     // Fal.ai inference
];

/**
 * Valida que una URL es:
 *  1. HTTPS (nunca http://)
 *  2. Hostname textual (no IP literal — para evitar 127.0.0.1, 169.254.x, etc.)
 *  3. Hostname en el whitelist (incluyendo sufijos validos)
 *
 * Devuelve null si OK, string con error si rechazada.
 */
export function validateImageUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return "URL inválida";
  }

  if (url.protocol !== "https:") {
    return "Solo HTTPS permitido";
  }

  // Rechazar IPs literales (anti-SSRF bypass)
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(url.hostname) || url.hostname.includes(":")) {
    return "IPs literales no permitidas";
  }

  // Rechazar hostnames internos típicos
  const lowerHost = url.hostname.toLowerCase();
  if (
    lowerHost === "localhost" ||
    lowerHost.endsWith(".local") ||
    lowerHost.endsWith(".internal") ||
    lowerHost === "metadata.google.internal"
  ) {
    return "Hostname interno no permitido";
  }

  // Whitelist
  if (ALLOWED_IMAGE_HOSTS.has(lowerHost)) return null;
  for (const suffix of ALLOWED_IMAGE_HOST_SUFFIXES) {
    if (lowerHost.endsWith(suffix)) return null;
  }

  return `Dominio no permitido: ${lowerHost}`;
}

/**
 * Valida tamaño aprox del body antes de procesar.
 * Llamar antes de await req.formData() / req.json() para evitar OOM.
 *
 * Limite por defecto: 10MB (cabe una foto 4k JPEG).
 */
export function validateContentLength(
  contentLength: string | null,
  maxBytes = 10 * 1024 * 1024,
): string | null {
  if (!contentLength) return null; // si no hay header, no podemos saber — continuamos
  const len = Number.parseInt(contentLength, 10);
  if (Number.isNaN(len)) return null;
  if (len > maxBytes) {
    return `Payload demasiado grande: ${(len / 1024 / 1024).toFixed(1)}MB (máximo ${(maxBytes / 1024 / 1024).toFixed(0)}MB)`;
  }
  return null;
}

/**
 * Valida que un File subido es realmente una imagen (no un .exe disfrazado).
 * Lee los primeros bytes del archivo y verifica el magic number.
 */
export async function validateImageFile(file: File): Promise<string | null> {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    return `Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(1)}MB`;
  }

  // Lee primeros 12 bytes para magic numbers
  const buf = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return null;
  // GIF: 47 49 46 38 (GIF8)
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return null;
  // WEBP: 52 49 46 46 ... 57 45 42 50 (RIFF...WEBP)
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return null;

  return "Formato de imagen no válido (solo PNG/JPEG/GIF/WEBP)";
}
