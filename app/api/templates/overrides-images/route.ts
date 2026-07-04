import { NextResponse } from "next/server";
import { listAllTemplateOverrides } from "@/lib/templateOverrides";

// Sin cache — cuando un admin edita/revierte una plantilla, la propagacion debe
// ser inmediata. La tabla template_overrides tiene <100 rows tipicamente, la
// query a Supabase es milisegundos.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/templates/overrides-images
 *
 * Público (sin auth) — devuelve un map { [templateId]: imageUrl } con la
 * thumbnail nueva de cada plantilla que tenga override. Los listados client-side
 * (/templates, /admin/templates, home) fetch este endpoint al mount y sobrescriben
 * el `image` de las cards afectadas.
 */
export async function GET() {
  try {
    const overrides = await listAllTemplateOverrides();
    const map: Record<string, string> = {};
    for (const [id, o] of overrides.entries()) {
      if (o.imageUrl) map[String(id)] = o.imageUrl;
    }
    return NextResponse.json(
      { images: map },
      {
        headers: {
          // Impedir cualquier cache edge/CDN/browser.
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      },
    );
  } catch (e) {
    console.error("[overrides-images]", e);
    return NextResponse.json({ images: {} }, { status: 200 });
  }
}
