import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/admin";
import { saveTemplateOverride } from "@/lib/templateOverrides";
import type { TemplateVariant } from "@/data/templates";

/**
 * POST /api/admin/save-template
 *
 * Body: { templateId: number, variants: TemplateVariant[] }
 *
 * Persiste las variants como override del catálogo estático. La próxima carga
 * del editor (o /flyer/[slug]) las verá inmediatamente sin recompilar.
 * Solo admins.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { templateId, variants, imageUrl } = body as {
      templateId?: number;
      variants?: TemplateVariant[];
      imageUrl?: string | null;
    };

    if (typeof templateId !== "number" || !Number.isFinite(templateId)) {
      return NextResponse.json({ error: "Missing or invalid templateId" }, { status: 400 });
    }
    if (!Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json({ error: "variants must be a non-empty array" }, { status: 400 });
    }

    const result = await saveTemplateOverride(
      templateId,
      variants,
      user.id,
      typeof imageUrl === "string" && imageUrl.length > 0 ? imageUrl : null,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, templateId });
  } catch (e) {
    console.error("[save-template]", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
