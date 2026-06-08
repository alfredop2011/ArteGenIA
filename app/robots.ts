import type { MetadataRoute } from "next";

/**
 * robots.txt generado por Next 16 file convention.
 *
 * Permite indexacion completa EXCEPTO rutas privadas que no aportan SEO
 * y solo gastarian budget de crawl de Google:
 *  - /api/* — endpoints internos
 *  - /admin/* — panel privado
 *  - /editor/* — editor de proyectos (requiere auth, contenido del usuario)
 *  - /editor-new — variante experimental
 *  - /projects, /history — vistas privadas del usuario
 *  - /auth/callback — callback OAuth, no debe indexarse
 *
 * Si en el futuro queremos bloquear bots de IA (Bytespider, GPTBot, etc.)
 * para que no scrapeen plantillas, añadir bloques especificos por User-agent.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://artegenia.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/editor/",
          "/editor-new",
          "/projects",
          "/history",
          "/auth/callback",
          "/upload/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
