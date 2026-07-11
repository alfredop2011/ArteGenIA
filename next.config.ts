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
const TICKETM_URL  = "https://*.ticketm.net https://*.ticketmaster.com";
const FAL_URL      = "https://*.fal.media https://*.fal.run";
const POSTHOG_URL  = "https://*.posthog.com https://eu.i.posthog.com";
const SENTRY_URL   = "https://*.ingest.sentry.io";

const CSP = [
  // default: solo nosotros
  `default-src 'self'`,
  // scripts: nosotros + Vercel + unsafe-inline para Next hydration.
  // 'unsafe-eval' ELIMINADO (2026-06-17): auditado que fabric.js, jspdf, gsap,
  // swiper y el código propio NO usan eval/new Function/WebAssembly, así que no
  // hacía falta. Esto bloquea XSS basado en eval(). 'unsafe-inline' sigue (lo
  // requiere la hidratación de Next; quitarlo necesita CSP con nonce+middleware).
  `script-src 'self' 'unsafe-inline' https://*.vercel.app https://*.vercel-scripts.com ${POSTHOG_URL}`,
  // styles: nosotros + Google Fonts + inline (Tailwind)
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  // fonts: Google Fonts CDN
  `font-src 'self' data: https://fonts.gstatic.com`,
  // imagenes: nuestras + Supabase + R2 + Fal + avatars Google + data URLs
  `img-src 'self' blob: data: ${SUPABASE_URL} ${R2_URL} ${TICKETM_URL} ${FAL_URL} https://*.googleusercontent.com`,
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
  // Perf — optimiza los imports de paquetes "barrel" pesados: solo entra en el
  // bundle lo que de verdad se usa (no toda la librería). lucide-react ya lo
  // optimiza Next por defecto; framer-motion NO, y se usa en muchas páginas.
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },
  // Perf — en producción quitamos console.* (excepto error/warn, útiles para
  // monitorización). Menos ruido y algo menos de JS.
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  // UX#1 — /planes es la versión MVP-waitlist legacy. /pricing es la real
  // con Stripe Checkout. Redirigimos 308 (permanente) para que cualquier
  // link viejo guardado o compartido no caiga en una página confusa con
  // mensaje "lanzamiento próximo".
  async redirects() {
    return [
      { source: "/planes", destination: "/pricing", permanent: true },
      // Soporte: la URL de soporte del perfil público de Stripe apunta a
      // /support; la página de ayuda vive en /ayuda. Redirigimos para que ese
      // link (y /soporte en español) no caigan en 404.
      { source: "/support", destination: "/ayuda", permanent: true },
      { source: "/soporte", destination: "/ayuda", permanent: true },
    ];
  },
  async headers() {
    // V8.1: en DEVELOPMENT no aplicamos headers de seguridad. Razon: la CSP
    // estricta + headers que aplican a /:path* incluyen /_next/static/chunks/*
    // de Turbopack. Tras varios cambios en config, los chunks pueden chocar
    // con la CSP y dar errores tipo "module factory not available" o
    // "Refused to load script".
    //
    // En PROD seguimos con todos los headers (audit OWASP, grado A+ en
    // securityheaders.com).
    if (process.env.NODE_ENV !== "production") {
      return [];
    }
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // No reveles framework version a atacantes
  poweredByHeader: false,
};

export default nextConfig;
