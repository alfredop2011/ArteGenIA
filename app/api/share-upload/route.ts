import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { checkRateLimit } from "@/lib/rateLimit";
import { uploadToR2, makeKey } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * /api/share-upload — sube un PNG (dataURL) generado en el cliente a R2
 * y devuelve la URL pública.
 *
 * Pensado para el modal de "Compartir tras descargar" del editor mobile.
 * El usuario descarga el PNG localmente Y queremos darle un link público
 * para WhatsApp/Facebook/Twitter sin necesidad de subir él mismo.
 *
 * Auth + rate limit aplicados — R2 cuesta storage y el bucket es público.
 */

type Body = {
  /** Data URL PNG/JPEG generado por toDataURL del canvas */
  imageDataUrl: string;
};

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB max — flyers grandes pero no abusar

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesion" }, { status: 401 });
    }
    const limitRes = await checkRateLimit(supabase, user.id, "share-upload");
    if (limitRes) return limitRes;

    const { imageDataUrl } = (await req.json()) as Body;
    if (!imageDataUrl?.startsWith("data:")) {
      return NextResponse.json({ error: "imageDataUrl invalido" }, { status: 400 });
    }
    // Parse data URL: "data:image/png;base64,...."
    const match = imageDataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Formato no soportado (PNG/JPG)" }, { status: 400 });
    }
    const ext = match[1] === "jpeg" ? "jpg" : match[1];
    const b64 = match[2];
    const buffer = Buffer.from(b64, "base64");
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "Imagen demasiado grande (max 8 MB)" }, { status: 413 });
    }
    const contentType = ext === "jpg" ? "image/jpeg" : "image/png";
    const key = makeKey("share", ext);
    const { url } = await uploadToR2(buffer, key, contentType);
    return NextResponse.json({ url, key });
  } catch (err) {
    console.error("[share-upload]", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
