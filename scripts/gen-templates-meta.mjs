// Genera data/templatesMeta.ts a partir del catálogo pesado data/templates.ts.
//
// Motivo: data/templates.ts pesa ~560 KB (todas las `layers` de cada plantilla).
// Las páginas de LISTADO (home, /templates, tarjetas) solo necesitan METADATA
// (id, título, categoría, audiencia, formatos disponibles) — NUNCA las layers.
// Importar el catálogo completo metía ~383 KB en el first-load JS de esas
// páginas. Este metadata vive en un módulo aparte que NO importa templates.ts,
// así las layers solo se cargan en el editor y en el thumbnail (chunk lazy).
//
// Regenerar tras editar data/templates.ts:
//   node scripts/gen-templates-meta.mjs
//
// Node ≥23.6 ejecuta el .ts directamente (type stripping nativo).

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const { templates } = await import(join(root, "data/templates.ts"));

const meta = templates.map((t) => ({
  id: t.id,
  title: t.title,
  category: t.category,
  image: t.image,
  premium: t.premium,
  audience: t.audience,
  ...(t.internalTags ? { internalTags: t.internalTags } : {}),
  ...(t.useCases ? { useCases: t.useCases } : {}),
  variants: t.variants.map((v) => ({
    format: v.format,
    width: v.width,
    height: v.height,
  })),
}));

const header = `// ⚠️  AUTO-GENERADO por scripts/gen-templates-meta.mjs — NO editar a mano.
// Regenerar tras cambiar data/templates.ts:  node scripts/gen-templates-meta.mjs
//
// Metadata LIGERA del catálogo (sin \`layers\`). La importan las páginas de
// listado para no arrastrar las ~383 KB de layers al first-load JS. Las layers
// completas viven en data/templates.ts (solo editor + thumbnail lazy).

import type { FormatId } from "./formats";
import type { AudienceId, InternalTag, TemplateLayer, UseCase } from "./templates";

export type TemplateVariantMeta = {
  format: FormatId;
  width: number;
  height: number;
  /** Solo presente en plantillas publicadas (Supabase). Las estáticas resuelven
   *  layers por id desde data/templates.ts dentro del thumbnail. */
  layers?: TemplateLayer[];
};

export type TemplateMeta = {
  id: number;
  title: string;
  category: string;
  image: string;
  premium: boolean;
  audience: AudienceId[];
  internalTags?: InternalTag[];
  useCases?: UseCase[];
  variants: TemplateVariantMeta[];
};

/** Igual que getVariant() pero sobre metadata. Devuelve la variante pedida o la
 *  primera disponible. */
export function getVariantMeta(template: TemplateMeta, formatId?: FormatId): TemplateVariantMeta {
  if (formatId) {
    const v = template.variants.find((x) => x.format === formatId);
    if (v) return v;
  }
  return template.variants[0];
}

export const templatesMeta: TemplateMeta[] = `;

const out = header + JSON.stringify(meta, null, 2) + ";\n";
writeFileSync(join(root, "data/templatesMeta.ts"), out, "utf8");

console.log(`✓ data/templatesMeta.ts generado — ${meta.length} plantillas, sin layers.`);
