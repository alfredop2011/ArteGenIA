import { NextResponse } from "next/server";
import { listAllTemplateOverrides } from "@/lib/templateOverrides";

/**
 * GET /api/templates/overrides-images
 *
 * Público (sin auth) — devuelve un map { [templateId]: imageUrl } con la
 * thumbnail nueva de cada plantilla que tenga override. Los listados client-side
 * (/templates, /admin/templates, home) fetch este endpoint al mount y sobrescriben
 * el `image` de las cards afectadas.
 *
 * Cachea 60s en edge; los cambios de admin propagan en <1 min.
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
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (e) {
    console.error("[overrides-images]", e);
    return NextResponse.json({ images: {} }, { status: 200 });
  }
}
