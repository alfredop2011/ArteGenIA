import type { NextConfig } from "next";

/**
 * Cabeceras HTTP de seguridad — auditadas contra OWASP top 10.
 *
 * Bloquean técnicas modernas de ataque:
 *  - HSTS               → fuerza HTTPS, evita downgrade attacks
 *  - X-Frame-Options    → anti-clickjacking (no incrustar en iframe externo)
 *  - X-Content-Type     → anti MIME sniffing (no ejecutar HTML disfrazado de JS)
 *  - Referrer-Policy    → no filtrar URLs internas a sites externos
 *  - Permissions-Policy → denegar APIs sensibles que no usamos (cam/mic/geo)
 *  - CSP                → bloquea inyección XSS y scripts no autorizados
 *
 * CSP es la más restrictiva. La hemos calibrado para que funcione con:
 *  - Vercel scripts (asset domain *.vercel.app)
 *  - Supabase auth + storage
 *  - R2 (Cloudflare) para imágenes
 *  - Google Fonts (Geist)
 *  - PostHog + Sentry (si se configuran)
 *  - Fal.ai signed URLs para previsualizaciones
 *
 * Si añades un nuevo CDN/servicio que sirva scripts o imágenes, añadelo
 * al CSP correspondiente o las requests fallarán silenciosamente en el
 * browser (Console: "Refused to load... CSP directive").
 */

const SUPABASE_URL = "https://tbuszlffgtjnbvkxhkti.supabase.co";
const R2_URL       = "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev";
const FAL_URL      = "https://*.fal.media https://*.fal.run";
const POSTHOG_URL  = "https://*.posthog.com https://eu.i.posthog.com";
const SENTRY_URL   = "https://*.ingest.sentry.io";

const CSP = [
  // default: solo nosotros
  `default-src 'self'`,
  // scripts: nosotros + Vercel + unsafe-inline para Next hydration.
  // 'unsafe-eval' SOLO para wasm de Fabric.js / IA cliente; cuando se
  // pueda quitar, se quita.
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel.app https://*.vercel-scripts.com ${POSTHOG_URL}`,
  // styles: nosotros + Google Fonts + inline (Tailwind)
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  // fonts: Google Fonts CDN
  `font-src 'self' data: https://fonts.gstatic.com`,
  // imagenes: nuestras + Supabase + R2 + Fal + avatars Google + data URLs
  `img-src 'self' blob: data: ${SUPABASE_URL} ${R2_URL} ${FAL_URL} https://*.googleusercontent.com`,
  // conexiones XHR/fetch/websocket
  `connect-src 'self' ${SUPABASE_URL} ${R2_URL} ${FAL_URL} ${POSTHOG_URL} ${SENTRY_URL} wss://${SUPABASE_URL.replace("https://", "")}`,
  // workers: para Fabric.js
  `worker-src 'self' blob:`,
  // forms: solo nuestro endpoint (anti credentials phishing)
  `form-action 'self'`,
  // frames: nadie puede incrustarnos (anti clickjacking)
  `frame-ancestors 'none'`,
  // base href: solo nosotros
  `base-uri 'self'`,
  // plugins: bloqueados
  `object-src 'none'`,
  // upgrade requests inseguros automaticamente a HTTPS — SOLO produccion.
  // En dev rompe localhost (que esta en HTTP).
  ...(process.env.NODE_ENV === "production" ? [`upgrade-insecure-requests`] : []),
].join("; ");

// HSTS: solo en producción. En desarrollo NO se envía porque rompería
// localhost (browser intentaría HTTPS, dev server está en HTTP).
// Para limpiar HSTS cacheado en el browser:
//   Chrome: chrome://net-internals/#hsts → Delete domain "localhost"
//   Safari: vaciar cachés desde DevTools, o borrar ~/Library/Cookies/HSTS.plist
//   Firefox: about:preferences#privacy → Borrar datos del sitio web
const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  // HSTS: 2 años, todos subdominios, eligible para preload list (SOLO prod)
  ...(isProd ? [{
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  }] : []),
  // Anti-clickjacking (CSP frame-ancestors es lo moderno; X-Frame es fallback)
  { key: "X-Frame-Options", value: "DENY" },
  // No MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // No filtrar URLs internas a sitios externos
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Bloquear APIs sensibles que NO usamos
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "interest-cohort=()", // anti FLoC tracking
      "payment=()",         // hasta que integremos Stripe
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
    ].join(", "),
  },
  // CSP estricta
  { key: "Content-Security-Policy", value: CSP },
  // Legacy XSS protection (Chrome ya no la usa, pero IE/Edge antiguos sí)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Aislamos nuestro tab del de pop-ups OAuth (Spectre mitigation)
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // No reveles framework version a atacantes
  poweredByHeader: false,
};

export default nextConfig;
