import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { templates, type Template, type TemplateVariant } from "@/data/templates";
import { templatesMeta, type TemplateMeta } from "@/data/templatesMeta";
import { deleteFromR2 } from "@/lib/r2";

/**
 * Extrae la key de R2 a partir de una URL publica.
 * Ej: "https://pub-xxx.r2.dev/template-thumbs/override-80-123.png"
 *      → "template-thumbs/override-80-123.png"
 * Solo devuelve la key si la URL matchea nuestro bucket publico — asi
 * evitamos borrar cosas ajenas por error.
 */
function extractR2Key(url: string | null | undefined): string | null {
  if (!url) return null;
  const base = process.env.R2_PUBLIC_URL || "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev";
  if (!url.startsWith(base)) return null;
  const path = url.slice(base.length).replace(/^\/+/, "");
  return path.length > 0 ? path : null;
}

/** Borra un thumbnail huerfano de R2 sin tirar el flujo si falla. */
async function safeDeleteR2Thumb(url: string | null): Promise<void> {
  const key = extractR2Key(url);
  if (!key) return;
  // Solo borra dentro de template-thumbs/ como safety guard adicional.
  if (!key.startsWith("template-thumbs/")) return;
  try {
    await deleteFromR2(key);
  } catch (e) {
    console.warn("[templateOverrides] no se pudo borrar thumb huerfano", key, e);
  }
}

/**
 * Overrides de plantillas guardados por admin desde el editor visual.
 *
 * El catálogo estático vive en `data/templates.ts`. Cuando un admin edita una
 * plantilla desde el editor y guarda como oficial, sus variants + thumbnail
 * se persisten en la tabla `template_overrides` y este helper las devuelve
 * para que loaders y listados las usen en lugar del catálogo.
 *
 * Uso server-side únicamente (usa service_role para saltarse RLS).
 */

export type TemplateOverrideRow = {
  template_id: number;
  variants: TemplateVariant[];
  image_url: string | null;
  updated_at: string;
  updated_by: string | null;
};

export type TemplateOverride = {
  variants: TemplateVariant[];
  imageUrl: string | null;
};

/** Devuelve el override completo (variants + imageUrl) o null si no hay. */
export async function getTemplateOverride(templateId: number): Promise<TemplateOverride | null> {
  const { data, error } = await supabaseAdmin
    .from("template_overrides")
    .select("variants, image_url")
    .eq("template_id", templateId)
    .maybeSingle();

  if (error) {
    console.error("[templateOverrides] getTemplateOverride error", error);
    return null;
  }
  if (!data) return null;
  return {
    variants: data.variants as TemplateVariant[],
    imageUrl: (data.image_url as string | null) ?? null,
  };
}

/** Devuelve el set de template_ids que tienen override (para badge en /admin/templates). */
export async function listTemplateOverrideIds(): Promise<Set<number>> {
  const { data, error } = await supabaseAdmin
    .from("template_overrides")
    .select("template_id");

  if (error) {
    console.error("[templateOverrides] listTemplateOverrideIds error", error);
    return new Set();
  }
  return new Set((data ?? []).map((r) => Number(r.template_id)));
}

/**
 * Devuelve un Map<templateId, TemplateOverride> con TODOS los overrides.
 * Una sola query — usa esto en listados públicos para no golpear la DB por cada card.
 */
export async function listAllTemplateOverrides(): Promise<Map<number, TemplateOverride>> {
  const { data, error } = await supabaseAdmin
    .from("template_overrides")
    .select("template_id, variants, image_url");

  if (error) {
    console.error("[templateOverrides] listAllTemplateOverrides error", error);
    return new Map();
  }
  const map = new Map<number, TemplateOverride>();
  for (const row of data ?? []) {
    map.set(Number(row.template_id), {
      variants: row.variants as TemplateVariant[],
      imageUrl: (row.image_url as string | null) ?? null,
    });
  }
  return map;
}

/**
 * Catálogo completo con overrides aplicados: por cada Template en `data/templates.ts`,
 * si hay override en Supabase, `variants` e `image` quedan reemplazados.
 * Server-side only.
 */
export async function getTemplatesWithOverrides(): Promise<Template[]> {
  const overrides = await listAllTemplateOverrides();
  if (overrides.size === 0) return templates;
  return templates.map((tpl) => {
    const o = overrides.get(tpl.id);
    if (!o) return tpl;
    return {
      ...tpl,
      variants: o.variants,
      image: o.imageUrl ?? tpl.image,
    };
  });
}

/** Igual pero para templatesMeta (usado en home + listado público, sin layers). */
export async function getTemplatesMetaWithOverrides(): Promise<TemplateMeta[]> {
  const overrides = await listAllTemplateOverrides();
  if (overrides.size === 0) return templatesMeta;
  return templatesMeta.map((meta) => {
    const o = overrides.get(meta.id);
    if (!o) return meta;
    return { ...meta, image: o.imageUrl ?? meta.image };
  });
}

/** Upsert de un override. Guarda variants y opcionalmente image_url (thumbnail R2).
 *  Cuando llega un imageUrl nuevo, borra el thumbnail anterior de R2 para no
 *  acumular archivos huerfanos (el user paga por almacenamiento). */
export async function saveTemplateOverride(
  templateId: number,
  variants: TemplateVariant[],
  userId: string,
  imageUrl: string | null = null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Antes de sobrescribir, lee el image_url previo — si es distinto al nuevo
  // lo borramos de R2 tras el upsert.
  let previousImageUrl: string | null = null;
  if (imageUrl !== null) {
    const { data: prev } = await supabaseAdmin
      .from("template_overrides")
      .select("image_url")
      .eq("template_id", templateId)
      .maybeSingle();
    previousImageUrl = (prev?.image_url as string | null) ?? null;
  }

  const payload: Record<string, unknown> = {
    template_id: templateId,
    variants,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };
  // Solo sobrescribir image_url si viene explícito (para no borrar una thumb previa
  // si el editor no pudo regenerarla en un save posterior).
  if (imageUrl !== null) payload.image_url = imageUrl;

  const { error } = await supabaseAdmin
    .from("template_overrides")
    .upsert(payload, { onConflict: "template_id" });
  if (error) {
    console.error("[templateOverrides] saveTemplateOverride error", error);
    return { ok: false, error: error.message };
  }

  // Borra el thumbnail viejo (si existia y es distinto del nuevo). No bloqueante.
  if (previousImageUrl && previousImageUrl !== imageUrl) {
    void safeDeleteR2Thumb(previousImageUrl);
  }
  return { ok: true };
}

/** Borra el override de una plantilla (revertir al catálogo).
 *  Tambien borra el thumbnail asociado en R2. */
export async function deleteTemplateOverride(templateId: number): Promise<{ ok: true } | { ok: false; error: string }> {
  // Lee el image_url antes de borrar para poder limpiar R2.
  const { data: prev } = await supabaseAdmin
    .from("template_overrides")
    .select("image_url")
    .eq("template_id", templateId)
    .maybeSingle();
  const previousImageUrl = (prev?.image_url as string | null) ?? null;

  const { error } = await supabaseAdmin
    .from("template_overrides")
    .delete()
    .eq("template_id", templateId);
  if (error) {
    console.error("[templateOverrides] deleteTemplateOverride error", error);
    return { ok: false, error: error.message };
  }

  // Limpieza R2 no bloqueante.
  if (previousImageUrl) void safeDeleteR2Thumb(previousImageUrl);
  return { ok: true };
}
