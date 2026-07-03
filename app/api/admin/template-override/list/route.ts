import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/admin";
import { listTemplateOverrideIds } from "@/lib/templateOverrides";

/**
 * GET /api/admin/template-override/list
 *
 * Devuelve el array de template_ids con override. Usado por /admin/templates
 * para pintar el badge "editado" en las cards. Solo admins.
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const ids = await listTemplateOverrideIds();
    return NextResponse.json({ ids: Array.from(ids) });
  } catch (e) {
    console.error("[template-override list]", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
