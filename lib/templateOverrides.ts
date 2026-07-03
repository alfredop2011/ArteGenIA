import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { TemplateVariant } from "@/data/templates";

/**
 * Overrides de plantillas guardados por admin desde el editor visual.
 *
 * El catálogo estático vive en `data/templates.ts`. Cuando un admin edita una
 * plantilla desde el editor y guarda como oficial, sus variants se persisten
 * en la tabla `template_overrides` y este helper las devuelve para que el
 * loader las use en lugar del catálogo.
 *
 * Uso server-side únicamente (usa service_role para saltarse RLS).
 */

export type TemplateOverrideRow = {
  template_id: number;
  variants: TemplateVariant[];
  updated_at: string;
  updated_by: string | null;
};

/** Devuelve las variants persistidas para un templateId, o null si no hay override. */
export async function getTemplateOverride(templateId: number): Promise<TemplateVariant[] | null> {
  const { data, error } = await supabaseAdmin
    .from("template_overrides")
    .select("variants")
    .eq("template_id", templateId)
    .maybeSingle();

  if (error) {
    console.error("[templateOverrides] getTemplateOverride error", error);
    return null;
  }
  return (data?.variants as TemplateVariant[] | undefined) ?? null;
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

/** Upsert de un override. */
export async function saveTemplateOverride(
  templateId: number,
  variants: TemplateVariant[],
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabaseAdmin
    .from("template_overrides")
    .upsert(
      {
        template_id: templateId,
        variants,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "template_id" },
    );
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
