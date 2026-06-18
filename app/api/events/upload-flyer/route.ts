import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { checkRateLimit } from "@/lib/rateLimit";
import { uploadToR2, makeKey } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * /api/events/upload-flyer — sube el flyer de un evento a R2 y devuelve la
 * URL pública + key. Lo usa el formulario del organizador (/organizador).
 *
 * Recibe multipart/form-data con campo `file` (PNG/JPG/WebP).
 * Auth obligatoria (solo organizadores logueados) + rate limit (storage).
 */

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const SNIFF: { ext: string; type: string; test: (b: Buffer) => boolean }[] = [
  { ext: "png", type: "image/png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { ext: "jpg", type: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "webp", type: "image/webp", test: (b) => b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
    }
    const limitRes = await checkRateLimit(supabase, user.id, "event-flyer-upload");
    if (limitRes) return limitRes;

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength === 0) {
      return NextResponse.json({ error: "Archivo vacío" }, { status: 400 });
    }
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "Imagen demasiado grande (máx 8 MB)" }, { status: 413 });
    }
    // Validar por magic-numbers (no confiar en el mime declarado).
    const kind = SNIFF.find((s) => s.test(buffer));
    if (!kind) {
      return NextResponse.json({ error: "Formato no soportado. Usa PNG, JPG o WebP." }, { status: 400 });
    }

    const key = makeKey("eventos", kind.ext);
    const { url } = await uploadToR2(buffer, key, kind.type);
    return NextResponse.json({ url, key });
  } catch (err) {
    console.error("[events/upload-flyer]", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
