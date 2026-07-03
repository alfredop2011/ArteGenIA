import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { templates, type Template, type TemplateVariant } from "@/data/templates";
import { templatesMeta, type TemplateMeta } from "@/data/templatesMeta";

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

/** Upsert de un override. Guarda variants y opcionalmente image_url (thumbnail R2). */
export async function saveTemplateOverride(
  templateId: number,
  variants: TemplateVariant[],
  userId: string,
  imageUrl: string | null = null,
): Promise<{ ok: true } | { ok: false; error: string }> {
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
  return { ok: true };
}

/** Borra el override de una plantilla (revertir al catálogo). */
export async function deleteTemplateOverride(templateId: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabaseAdmin
    .from("template_overrides")
    .delete()
    .eq("template_id", templateId);
  if (error) {
    console.error("[templateOverrides] deleteTemplateOverride error", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
