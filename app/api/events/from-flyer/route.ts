import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { checkRateLimit } from "@/lib/rateLimit";
import { extractEventFromImage } from "@/lib/extractEvent";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * /api/events/from-flyer — lee un flyer (multipart `file`) con visión y
 * devuelve los datos del evento ya extraídos. El panel del organizador lo
 * usa para autocompletar el formulario tras subir el flyer.
 */

const MAX_BYTES = 8 * 1024 * 1024;
const SNIFF: { type: string; test: (b: Buffer) => boolean }[] = [
  { type: "image/png", test: (b) => b[0] === 0x89 && b[1] === 0x50 },
  { type: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 },
  { type: "image/webp", test: (b) => b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
    const limitRes = await checkRateLimit(supabase, user.id, "event-flyer-upload");
    if (limitRes) return limitRes;

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "Archivo inválido o demasiado grande (máx 8 MB)" }, { status: 413 });
    }
    const kind = SNIFF.find((s) => s.test(buffer));
    if (!kind) return NextResponse.json({ error: "Formato no soportado (PNG/JPG/WebP)" }, { status: 400 });

    const extracted = await extractEventFromImage(buffer.toString("base64"), kind.type);
    if (!extracted) {
      return NextResponse.json({ error: "No se pudo leer el flyer. Rellena los datos a mano." }, { status: 422 });
    }
    return NextResponse.json({ data: extracted });
  } catch (err) {
    console.error("[events/from-flyer]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
