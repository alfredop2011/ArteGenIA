import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

/**
 * DELETE /api/assets/[id] — borra un asset de la galería del usuario.
 *
 * También intenta borrar el archivo de R2 si tiene storage_key. Si falla
 * el borrado R2 (URL externa, key faltante, R2 indisponible), borramos
 * la row de DB igual — preferimos "huérfano en R2" a "fantasma en DB".
 *
 * RLS de Supabase asegura que solo el dueño puede borrar.
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

    // TODO Z.8.1: borrar archivo R2 cuando lib/r2 exporte deleteFromR2.
    // Por ahora el archivo queda huérfano en R2. Es aceptable corto plazo:
    // R2 cuesta $0.015/GB-mes, un archivo huérfano de 2MB cuesta $0.00003/mes.
    // Cron de limpieza futuro puede recolectar huérfanos comparando con DB.

    // Borrar de DB
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
