import type { MetadataRoute } from "next";
import { templates } from "@/data/templates";
import { getAllCategorySlugs } from "@/data/categorySEO";

/**
 * sitemap.xml generado por Next 16 file convention.
 *
 * Solo paginas PUBLICAS — las privadas (editor, projects, admin) se excluyen
 * por estar en robots.ts como disallow.
 *
 * lastModified: se actualiza en cada build/deploy automaticamente.
 * Es importante que no sea Date.now() — eso rompe build determinista.
 * En cambio usamos una fecha fija que se actualiza cuando hay cambios
 * relevantes en estructura del sitio.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://artegenia.vercel.app";

// Fecha de ultima actualizacion estructural del sitemap. Actualizar cuando
// se añadan rutas publicas nuevas (no cuando cambie contenido dentro).
const LAST_MODIFIED = new Date("2026-06-12");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/templates`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/create`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/colaboradores`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // Paginas legales (importantes para credibilidad pero baja prioridad SEO)
    {
      url: `${SITE_URL}/privacidad`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terminos`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/cookies`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    // Indice de categorias SEO
    {
      url: `${SITE_URL}/flyers`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    // Landings por categoria — long-tail SEO ("flyer conciertos", "flyer clases baile")
    ...getAllCategorySlugs().map(slug => ({
      url: `${SITE_URL}/flyers/${slug}`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    // Plantillas individuales — cada una es una landing potencial via long-tail SEO
    // ("flyer salsa cubana", "flyer concierto urban", etc.). Apuntan al editor con
    // la plantilla cargada — el visitante puede previsualizar sin login.
    ...templates.map(t => ({
      url: `${SITE_URL}/editor/${t.id}?format=portrait`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
