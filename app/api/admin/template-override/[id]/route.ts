import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/admin";
import { deleteTemplateOverride } from "@/lib/templateOverrides";

/**
 * DELETE /api/admin/template-override/[id]
 *
 * Borra el override de una plantilla. La siguiente carga usará el catálogo
 * estático original. Solo admins.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const templateId = Number(id);
    if (!Number.isFinite(templateId)) {
      return NextResponse.json({ error: "Invalid template id" }, { status: 400 });
    }

    const result = await deleteTemplateOverride(templateId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, templateId });
  } catch (e) {
    console.error("[template-override DELETE]", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
