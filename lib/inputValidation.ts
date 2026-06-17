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

  // Rechazar credenciales embebidas (https://trusted.com@169.254.169.254/) —
  // el navegador/fetch usa el host tras la @, no el userinfo.
  if (url.username || url.password) {
    return "Credenciales en URL no permitidas";
  }

  // Rechazar IPs literales (anti-SSRF bypass): dotted-decimal, IPv6, y
  // codificaciones alternativas (decimal/octal/hex sin puntos: 2130706433,
  // 0x7f000001, 0177.0.0.1) que evaden la regex dotted-decimal.
  const host = url.hostname;
  if (
    /^(\d{1,3}\.){3}\d{1,3}$/.test(host) ||      // 127.0.0.1
    host.includes(":") ||                          // IPv6
    /^\d+$/.test(host) ||                           // 2130706433 (entero)
    /^0x[0-9a-f]+$/i.test(host) ||                  // 0x7f000001
    /^0[0-7]+$/.test(host)                          // 0177...
  ) {
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

/**
 * ¿Es esta IP una dirección privada, loopback o link-local? (anti-SSRF).
 * Cubre los rangos que dan acceso a metadata de cloud (169.254.169.254),
 * servicios internos (10/8, 172.16/12, 192.168/16) y loopback.
 */
function isPrivateIp(ip: string): boolean {
  // IPv4
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10) return true;                       // 10.0.0.0/8
    if (a === 127) return true;                      // loopback
    if (a === 0) return true;                        // 0.0.0.0/8
    if (a === 169 && b === 254) return true;         // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;// 172.16.0.0/12
    if (a === 192 && b === 168) return true;         // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true;// CGNAT 100.64.0.0/10
    return false;
  }
  // IPv6
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;      // loopback / unspecified
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA fc00::/7
  if (lower.startsWith("fe80")) return true;                // link-local
  if (lower.startsWith("::ffff:")) {                        // IPv4-mapped
    return isPrivateIp(lower.slice(7));
  }
  return false;
}

/**
 * fetch endurecido contra SSRF para descargar URLs (potencialmente) de usuario
 * server-side. Defensa en profundidad sobre validateImageUrl:
 *  1. Re-valida el whitelist con validateImageUrl.
 *  2. Resuelve DNS y rechaza si alguna IP resuelta es privada/link-local
 *     (mitiga DNS rebinding de un host whitelisted apuntando a interno).
 *  3. redirect: "manual" — un 3xx desde un host permitido hacia una IP interna
 *     NO se sigue (nuestros hosts de confianza devuelven 200 en GET de imagen).
 *
 * Lanza Error si la URL es rechazada o si la respuesta es un redirect.
 */
export async function safeFetch(input: string, init?: RequestInit): Promise<Response> {
  const validationErr = validateImageUrl(input);
  if (validationErr) {
    throw new Error(`safeFetch rechazada: ${validationErr}`);
  }

  const url = new URL(input);
  // Resolución DNS + chequeo de IP (solo en runtime nodejs).
  try {
    const dns = await import("node:dns");
    const addrs = await dns.promises.lookup(url.hostname, { all: true });
    for (const { address } of addrs) {
      if (isPrivateIp(address)) {
        throw new Error(`safeFetch rechazada: el host resuelve a IP interna (${address})`);
      }
    }
  } catch (e) {
    // Si la resolución falla por motivo de seguridad, propagar. Si falla por
    // otra causa (DNS temporal), dejamos que el fetch lo maneje.
    if (e instanceof Error && e.message.startsWith("safeFetch")) throw e;
  }

  const res = await fetch(input, { ...init, redirect: "manual" });
  if (res.status >= 300 && res.status < 400) {
    throw new Error(`safeFetch rechazada: redirect no permitido (${res.status} → ${res.headers.get("location") ?? "?"})`);
  }
  return res;
}
