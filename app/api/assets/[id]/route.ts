import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { deleteFromR2 } from "@/lib/r2";

export const runtime = "nodejs";

/**
 * DELETE /api/assets/[id] — borra un asset de la galería del usuario.
 *
 * 1. Lee la row para obtener storage_key (RLS filtra por user_id)
 * 2. Borra el archivo de R2 si tiene storage_key (best effort)
 * 3. Borra la row de DB
 *
 * Si falla R2 (key inválida, indisponible) borramos la row igual:
 * preferimos huérfano en R2 a fantasma en DB. R2 cuesta $0.015/GB-mes
 * así que un huérfano puntual no es problema; si pasa sistemáticamente,
 * los logs lo revelan.
 */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
    }

    // 1. Leer storage_key antes de borrar (RLS asegura ownership)
    const { data: asset } = await supabase
      .from("user_assets")
      .select("storage_key")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    // 2. Borrar archivo R2 (best effort — no bloquea el DELETE de DB)
    const storageKey: string | null = asset?.storage_key ?? null;
    if (storageKey) {
      try {
        await deleteFromR2(storageKey);
      } catch (r2Err) {
        // R2 falló pero seguimos: huérfano > fantasma en DB.
        // Log para detectar si es sistemático y poder limpiar con cron.
        console.warn(`[assets DELETE] R2 fallo para key=${storageKey}:`, r2Err);
      }
    }

    // 3. Borrar row de DB
    const { error } = await supabase
      .from("user_assets")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[assets DELETE] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[assets DELETE]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
