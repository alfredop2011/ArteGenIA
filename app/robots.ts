import type { MetadataRoute } from "next";

/**
 * robots.txt generado por Next 16 file convention.
 *
 * Permite indexacion completa EXCEPTO rutas privadas que no aportan SEO
 * y solo gastarian budget de crawl de Google:
 *  - /api/* — endpoints internos
 *  - /admin — panel privado
 *  - /editor-new — variante experimental
 *  - /projects, /history — vistas privadas del usuario
 *  - /mis-creaciones, /mis-recursos, /preview — vistas privadas del usuario
 *  - /auth/callback — callback OAuth, no debe indexarse
 *  - /upload/* — flujo de upload de colaboradores via token
 *
 * NOTA: /editor/ NO se bloquea porque sirve dos usos mezclados:
 *  - /editor/[id-numerico] -> plantilla publica (intencion SEO, en sitemap)
 *  - /editor/[uuid] -> proyecto privado (requiere auth, redirige a login)
 * Google indexara las publicas; las privadas no las indexa porque el
 * server-redirect a /login impide acceso.
 *
 * Si en el futuro queremos bloquear bots de IA (Bytespider, GPTBot, etc.)
 * para que no scrapeen plantillas, añadir bloques especificos por User-agent.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://artegenia.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/editor-new",
          "/projects",
          "/history",
          "/mis-creaciones",
          "/mis-recursos",
          "/preview",
          "/auth/callback",
          "/upload/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
