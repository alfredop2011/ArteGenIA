import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/admin";
import { uploadToR2 } from "@/lib/r2";

/**
 * POST /api/admin/upload-thumbnail
 *
 * Recibe { dataUrl, draftId } en el body. Decodifica el dataUrl PNG, lo sube
 * a R2 con key 'template-thumbs/{draftId}-{timestamp}.png' y devuelve la URL
 * publica para que el cliente la guarde en templates_draft.thumbnail_url.
 *
 * Solo admins pueden llamar este endpoint.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { dataUrl, draftId } = body as { dataUrl?: string; draftId?: string };
    if (!dataUrl || !draftId) {
      return NextResponse.json({ error: "Missing dataUrl or draftId" }, { status: 400 });
    }

    // Decode dataUrl PNG
    const match = dataUrl.match(/^data:image\/(png|jpeg);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Invalid dataUrl" }, { status: 400 });
    }
    const ext = match[1];
    const base64 = match[2];
    const buffer = Buffer.from(base64, "base64");

    const key = `template-thumbs/${draftId}-${Date.now()}.${ext}`;
    const result = await uploadToR2(buffer, key, `image/${ext}`);

    return NextResponse.json({ url: result.url, key: result.key });
  } catch (e) {
    console.error("[upload-thumbnail]", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
